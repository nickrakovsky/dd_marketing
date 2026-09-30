import { JSDOM } from 'jsdom';
import { BlockList, isIP } from 'node:net';

export const DEFAULT_CONFIG = Object.freeze({
  seedUrls: ['/', '/posts'],
  sitemapUrls: ['/sitemap-index.xml'],
  firstPartyHosts: [],
  excludeUrls: [],
  concurrency: 4,
  perHostDelayMs: 1000,
  timeoutMs: 15000,
  maxRedirects: 5,
  retries: 2,
  backoffMs: 2000,
  maxRetryAfterMs: 30000,
  confirmationDelayMs: 30000,
  maxPages: 1000,
  maxSitemaps: 20,
  maxExternalUrls: 3000,
  maxPageBytes: 2 * 1024 * 1024,
  maxCheckBytes: 64 * 1024,
  maxRunMs: 15 * 60 * 1000,
});

const DEAD = new Set([404, 410]);
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const sleepDefault = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const privateAddresses = new BlockList();
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['192.0.0.0', 24], ['192.0.2.0', 24], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3]]) {
  privateAddresses.addSubnet(address, prefix, 'ipv4');
  privateAddresses.addSubnet(`::ffff:${address}`, 96 + prefix, 'ipv6');
}
for (const [address, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['2001:db8::', 32]]) privateAddresses.addSubnet(address, prefix, 'ipv6');

function isPublicUrl(value) {
  const host = new URL(value).hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (host === 'localhost' || /\.(?:localhost|local|internal)$/.test(host)) return false;
  const version = isIP(host);
  return !version || !privateAddresses.check(host, version === 4 ? 'ipv4' : 'ipv6');
}

function normalizeUrl(value, base) {
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function isChallenge(response, body) {
  return response.headers.get('cf-mitigated') === 'challenge'
    || /<title[^>]*>\s*(?:just a moment|attention required|access denied)/i.test(body)
    || /(?:verify (?:that )?you are human|enable javascript and cookies to continue|cf-chl-|challenge-platform|id=["']challenge-form)/i.test(body);
}

async function readBody(response, maximumBytes) {
  if (!response.body) return { body: '', truncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = '';
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return { body: body + decoder.decode(), truncated: false };
      const remaining = maximumBytes - bytes;
      body += decoder.decode(value.subarray(0, remaining), { stream: true });
      bytes += value.byteLength;
      if (bytes > maximumBytes) {
        await reader.cancel();
        return { body: body + decoder.decode(), truncated: true };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function retryDelay(value, now) {
  if (value == null) return null;
  if (/^\d+(?:\.\d+)?$/.test(value.trim())) return Number(value) * 1000;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : null;
}

/** Live editorial-link audit. Browser scripts and external-site recursion are never run. */
export async function runAudit({
  siteUrl = 'https://datadocks.com',
  config = {},
  fetchImpl = globalThis.fetch,
  now = Date.now,
  sleep = sleepDefault,
} = {}) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  for (const key of ['concurrency', 'timeoutMs', 'maxPages', 'maxSitemaps', 'maxExternalUrls', 'maxPageBytes', 'maxCheckBytes', 'maxRunMs']) {
    if (!Number.isSafeInteger(settings[key]) || settings[key] < 1) throw new Error(`Invalid audit config: ${key}`);
  }
  for (const key of ['perHostDelayMs', 'maxRedirects', 'retries', 'backoffMs', 'maxRetryAfterMs', 'confirmationDelayMs']) {
    if (!Number.isSafeInteger(settings[key]) || settings[key] < 0) throw new Error(`Invalid audit config: ${key}`);
  }
  const origin = new URL(siteUrl).origin;
  if (!normalizeUrl(origin)) throw new Error('siteUrl must use HTTP or HTTPS');
  const firstPartyHosts = new Set([new URL(origin).hostname, ...settings.firstPartyHosts]);
  const canonicalInternal = value => {
    const url = new URL(value);
    if (url.origin === origin) return value;
    return firstPartyHosts.has(url.hostname) ? new URL(url.pathname + url.search, origin).href : null;
  };
  const startedAt = new Date(now()).toISOString();
  const deadline = now() + settings.maxRunMs;
  const errors = [];
  let complete = true;
  const coverage = { pagesScanned: 0, sitemapsScanned: 0, externalUrls: 0, requests: 0, nonHtmlPagesSkipped: 0, excludedUrls: 0 };
  const fail = (stage, url, message) => {
    complete = false;
    errors.push({ stage, url, message });
  };
  const boundedSleep = async milliseconds => {
    if (now() + milliseconds >= deadline) throw new Error('Audit time budget exceeded');
    if (milliseconds > 0) await sleep(milliseconds);
  };
  const hostQueues = new Map();
  const nextRequestAt = new Map();
  const unavailableHosts = new Set();
  const withHost = async (url, operation) => {
    const host = new URL(url).hostname;
    const previous = hostQueues.get(host) ?? Promise.resolve();
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    hostQueues.set(host, pending);
    await previous;
    try {
      if (unavailableHosts.has(host)) throw new Error('Host rate limit exceeds the audit wait limit');
      const wait = Math.max(0, (nextRequestAt.get(host) ?? 0) - now());
      if (wait > Math.max(settings.maxRetryAfterMs, settings.perHostDelayMs)) throw new Error('Host rate limit exceeds the audit wait limit');
      await boundedSleep(wait);
      if (now() >= deadline) throw new Error('Audit time budget exceeded');
      nextRequestAt.set(host, now() + settings.perHostDelayMs);
      return await operation();
    } finally {
      release();
      if (hostQueues.get(host) === pending) hostQueues.delete(host);
    }
  };

  const request = async (initialUrl, discovery = false) => {
    let url = initialUrl;
    const redirects = [];
    const visited = new Set();
    for (;;) {
      if (!isPublicUrl(url)) throw new Error('Non-public URL literals are not checked');
      if (visited.has(url)) throw new Error('Redirect loop');
      visited.add(url);
      const result = await withHost(url, async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), Math.max(1, Math.min(settings.timeoutMs, deadline - now())));
        try {
          coverage.requests++;
          const response = await fetchImpl(url, {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DataDocksOutlinkAudit/1.0; +https://datadocks.com)',
              Accept: discovery ? 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.5' : 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.8',
              'Cache-Control': 'no-cache',
            },
          });
          const contentType = response.headers.get('content-type') ?? '';
          const location = response.headers.get('location');
          if (REDIRECTS.has(response.status)) {
            await response.body?.cancel();
            return { status: response.status, location };
          }
          // Binary downloads are valid links but are not page-discovery inputs.
          const textual = !contentType || /(?:html|xml|text\/)/i.test(contentType);
          const sample = textual ? await readBody(response, discovery ? settings.maxPageBytes : settings.maxCheckBytes) : { body: '', truncated: false };
          if (!textual) await response.body?.cancel();
          const retryAfterMs = retryDelay(response.headers.get('retry-after'), now());
          if (RETRYABLE.has(response.status) && retryAfterMs !== null) {
            const host = new URL(url).hostname;
            if (retryAfterMs > settings.maxRetryAfterMs) unavailableHosts.add(host);
            else nextRequestAt.set(host, Math.max(nextRequestAt.get(host) ?? 0, now() + retryAfterMs));
          }
          return {
            status: response.status,
            contentType,
            ...sample,
            challenge: isChallenge(response, sample.body),
            retryAfterMs,
          };
        } finally {
          clearTimeout(timer);
        }
      });
      if (!REDIRECTS.has(result.status)) return { ...result, finalUrl: url, redirects };
      if (redirects.length >= settings.maxRedirects) throw new Error('Redirect limit exceeded');
      const target = normalizeUrl(result.location, url);
      if (!result.location || !target) throw new Error('Invalid redirect location');
      if (discovery && !canonicalInternal(target)) throw new Error('Discovery redirected outside the site');
      redirects.push({ url, status: result.status, location: target });
      url = discovery ? canonicalInternal(target) : target;
    }
  };

  const check = async (url, discovery = false, phase) => {
    const checks = [];
    let result;
    for (let attempt = 0; attempt <= settings.retries; attempt++) {
      const checkedAt = new Date(now()).toISOString();
      try {
        result = await request(url, discovery);
      } catch (error) {
        result = { status: null, finalUrl: url, reason: error.message };
        if (error.message === 'Audit time budget exceeded') fail('budget', url, error.message);
      }
      const { status, finalUrl, redirects, challenge, reason } = result;
      checks.push({ checkedAt, status, finalUrl, ...(phase ? { phase } : {}), ...(redirects?.length ? { redirects } : {}), ...(challenge ? { challenge: true } : {}), ...(reason ? { reason } : {}) });
      const permanentFailure = /^(?:Redirect |Invalid redirect|Discovery redirected|Host rate limit|Audit time budget|Non-public URL)/.test(reason ?? '');
      if (permanentFailure || result.challenge || (result.status !== null && !RETRYABLE.has(result.status)) || attempt === settings.retries) break;
      const delay = Math.max(settings.backoffMs * 2 ** attempt, result.retryAfterMs ?? 0);
      if (delay > settings.maxRetryAfterMs) {
        result.reason = 'Retry-After exceeds the audit wait limit';
        break;
      }
      try {
        await boundedSleep(delay);
      } catch (error) {
        fail('budget', url, error.message);
        result.reason = error.message;
        break;
      }
    }
    return { ...result, checks };
  };

  const excluded = new Set();
  for (const entry of settings.excludeUrls) {
    const url = normalizeUrl(entry.url, origin);
    if (!url || typeof entry.reason !== 'string' || !entry.reason.trim()) throw new Error('Each excludeUrls entry needs an exact HTTP(S) URL and a reason');
    excluded.add(url);
  }
  const pages = new Set();
  const sitemaps = new Set();
  const links = new Map();
  const enqueue = (set, rawUrl, base, maximum, kind) => {
    const normalized = normalizeUrl(rawUrl, base);
    if (!normalized) return;
    const url = canonicalInternal(normalized);
    if (!url || set.has(url)) return;
    if (set.size >= maximum) {
      if (!errors.some(error => error.stage === kind && error.message === 'Discovery limit exceeded')) fail(kind, url, 'Discovery limit exceeded');
      return;
    }
    set.add(url);
  };
  for (const seed of settings.seedUrls) enqueue(pages, seed, origin, settings.maxPages, 'pages');
  for (const seed of settings.sitemapUrls) enqueue(sitemaps, seed, origin, settings.maxSitemaps, 'sitemaps');

  const fetchDiscovery = async (url, kind) => {
    const result = await check(url, true);
    if (result.status < 200 || result.status >= 300 || result.status === null || result.challenge || result.truncated) {
      fail(kind, url, result.reason ?? (result.challenge ? 'Bot challenge' : result.truncated ? 'Response exceeds the discovery body limit' : `HTTP ${result.status}`));
      return null;
    }
    return result;
  };
  for (const url of sitemaps) {
    const result = await fetchDiscovery(url, 'sitemaps');
    if (!result) continue;
    let dom;
    try {
      dom = new JSDOM(result.body, { contentType: 'text/xml' });
      const document = dom.window.document;
      const kind = document.documentElement.localName;
      if (!['sitemapindex', 'urlset'].includes(kind)) throw new Error('Expected sitemapindex or urlset XML');
      coverage.sitemapsScanned++;
      for (const loc of document.querySelectorAll('loc')) {
        if (kind === 'sitemapindex') enqueue(sitemaps, loc.textContent.trim(), result.finalUrl, settings.maxSitemaps, 'sitemaps');
        else enqueue(pages, loc.textContent.trim(), result.finalUrl, settings.maxPages, 'pages');
      }
    } catch (error) {
      fail('sitemaps', url, `Invalid sitemap: ${error.message}`);
    } finally {
      dom?.window.close();
    }
  }
  for (const url of pages) {
    const result = await fetchDiscovery(url, 'pages');
    if (!result) continue;
    if (result.contentType && !/(?:html|xhtml)/i.test(result.contentType)) {
      coverage.nonHtmlPagesSkipped++;
      continue;
    }
    const dom = new JSDOM(result.body, { url: result.finalUrl });
    try {
      coverage.pagesScanned++;
      for (const anchor of dom.window.document.querySelectorAll('a[href]')) {
        const target = normalizeUrl(anchor.getAttribute('href'), dom.window.document.baseURI);
        if (!target) continue;
        if (canonicalInternal(target)) {
          enqueue(pages, target, result.finalUrl, settings.maxPages, 'pages');
        } else if (!excluded.has(target)) {
          if (!links.has(target)) {
            if (links.size >= settings.maxExternalUrls) {
              if (!errors.some(error => error.stage === 'externalUrls')) fail('externalUrls', target, 'External URL limit exceeded');
              continue;
            }
            links.set(target, { url: target, parents: new Set(), classification: 'unverified', status: null, checks: [] });
          }
          links.get(target).parents.add(result.finalUrl);
        }
      }
    } finally {
      dom.window.close();
    }
  }
  if (!coverage.pagesScanned) fail('pages', origin, 'No HTML pages were scanned');
  coverage.externalUrls = links.size;
  coverage.excludedUrls = excluded.size;

  const pool = async (items, operation) => {
    let index = 0;
    await Promise.all(Array.from({ length: Math.min(settings.concurrency, items.length) }, async () => {
      while (index < items.length) await operation(items[index++]);
    }));
  };
  const apply = (link, result) => {
    link.status = result.status;
    link.checks.push(...result.checks);
    if (result.challenge) link.reason = 'Bot challenge; destination could not be verified';
    else if (DEAD.has(result.status) && result.truncated) link.reason = 'Error response exceeds the confirmation body limit';
    else if (result.status >= 200 && result.status < 300) {
      link.classification = 'reachable';
      delete link.reason;
      return 'reachable';
    } else if (DEAD.has(result.status)) return 'candidate';
    else link.reason = result.reason ?? `HTTP ${result.status ?? 'request failed'}; destination could not be verified`;
    return 'unverified';
  };
  const candidates = [];
  await pool([...links.values()], async link => {
    if (apply(link, await check(link.url, false, 'initial')) === 'candidate') candidates.push(link);
  });
  if (candidates.length) {
    try {
      await boundedSleep(settings.confirmationDelayMs);
      await pool(candidates, async link => {
        if (apply(link, await check(link.url, false, 'confirmation')) === 'candidate') {
          link.classification = 'dead';
          link.reason = 'HTTP 404/410 confirmed by two separate GET checks';
        }
      });
    } catch (error) {
      fail('confirmation', origin, error.message);
      for (const link of candidates) link.reason ??= 'Confirmation could not be completed';
    }
  }
  return {
    schemaVersion: 1,
    startedAt,
    completedAt: new Date(now()).toISOString(),
    complete,
    siteUrl: origin,
    coverage,
    links: [...links.values()].map(link => ({ ...link, parents: [...link.parents].sort() })).sort((a, b) => a.url.localeCompare(b.url)),
    suppressedUrls: [...excluded].sort(),
    errors,
  };
}
