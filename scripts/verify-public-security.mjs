import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium, request, devices } from 'playwright';
import { parse } from 'parse5';
import { VENDOR_ASSETS } from '../src/lib/vendor-assets.mjs';

// Public reads only. Production form writes in the separate test suite are
// fulfilled locally. This report records gaps; success does not certify them.
const directory = 'production-security-evidence';
fs.mkdirSync(directory, { recursive: true });
const cleanUrl = value => { try { const url = new URL(value); return url.origin + url.pathname; } catch { return value; } };
const redact = value => value?.replace(/'nonce-[^']+'/g, "'nonce-[response]'");
const selectedHeaders = ['content-type', 'content-security-policy', 'content-security-policy-report-only', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'cache-control', 'cdn-cache-control', 'cf-cache-status', 'age', 'etag', 'last-modified', 'location'];
const result = { at: new Date().toISOString(), pages: [], assets: [], redirects: [], runtime: [], vendorIntegrity: [] };
const digest = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('base64');
const api = await request.newContext({ userAgent: devices['Desktop Chrome'].userAgent, timeout: 30000 });

function inventory(html, url) {
  const scripts = [], stylesheets = [], metaPolicies = [], forms = [];
  let eventAttributes = 0;
  const visit = node => {
    const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
    eventAttributes += Object.keys(attrs).filter(name => /^on[a-z]+$/.test(name)).length;
    if (node.nodeName === 'script') {
      const body = (node.childNodes || []).map(child => child.value || '').join('');
      scripts.push({ src: attrs.src ? cleanUrl(new URL(attrs.src, url).href) : null, type: attrs.type || '', integrity: attrs.integrity || null, crossorigin: attrs.crossorigin ?? null, noncePresent: Boolean(attrs.nonce), bytes: Buffer.byteLength(body), hash: 'sha256-' + digest('sha256', body), newRelic: /NREUM|newrelic|nr-loader/.test(body) });
    }
    if (node.nodeName === 'link' && /stylesheet/.test(attrs.rel || '') && attrs.href) stylesheets.push(cleanUrl(new URL(attrs.href, url).href));
    if (node.nodeName === 'meta' && attrs['http-equiv']?.toLowerCase() === 'content-security-policy') metaPolicies.push(redact(attrs.content));
    if (node.nodeName === 'form') forms.push({ method: attrs.method || 'get', action: attrs.action ? cleanUrl(new URL(attrs.action, url).href) : cleanUrl(url) });
    for (const child of node.childNodes || []) visit(child);
  };
  visit(parse(html));
  return { scripts, stylesheets, metaPolicies, forms, eventAttributes };
}

try {
  for (const url of [
    'https://datadocks.com/', 'https://datadocks.com/integrations',
    'https://datadocks.com/posts', 'https://datadocks.com/posts/dwell-time-in-trucking',
    'https://datadocks.com/__security-verification-missing-page',
    'https://booking.datadocks.com/', 'https://booking.datadocks.com/sessions/new',
    'https://booking.datadocks.com/__security-verification-missing-page',
  ]) {
    try {
      const response = await api.get(url);
      const headers = response.headers();
      const body = await response.text();
      result.pages.push({ url, finalUrl: cleanUrl(response.url()), status: response.status(), headers: Object.fromEntries(selectedHeaders.filter(name => headers[name]).map(name => [name, redact(headers[name])])), ...inventory(body, response.url()) });
    } catch (error) { result.pages.push({ url, error: error.message }); }
  }
  const assetUrls = new Set(result.pages.flatMap(page => [...(page.scripts || []).map(script => script.src), ...(page.stylesheets || [])]).filter(url => url && new URL(url).hostname.endsWith('datadocks.com')));
  for (const url of assetUrls) {
    try {
      const response = await api.get(url), headers = response.headers();
      result.assets.push({ url, status: response.status(), type: headers['content-type'], nosniff: headers['x-content-type-options'], cache: headers['cache-control'], sha384: 'sha384-' + digest('sha384', await response.body()) });
    } catch (error) { result.assets.push({ url, error: error.message }); }
  }
  const approved = {
    calendlyJs: '6b0923aa37edebb2d554dc0e5aed2a66ac7e765a951f9efdb100ae878b3631627e086d7f89b8bf8ad8678b93ba5e8c5b',
    calendlyCss: '1b487d8fa0e2f719698d564e2f1e386c11b02733b6cd7a1a979af0cfe00c60c9f5607044475d7749d74d3d6a4547c79e',
    calendlyCloseIcon: '1fcba6314c72761bca29862c0386b4560bfd606a16c51658418ed08a18bc4904b5b27bc54d52b22d0e42e2462083f46f',
    dealfront: 'fefd2d18e596ab0e5863a0475887a9fb2d44dc5508c9096c2073f27280b8b5acd094d667c3d5800656868a86ec72274e',
    bentoBootstrap: '4f034afd02847478f6d54ab82b5c49c9929f34c8a50a5dbca5eda6fbdbaf65748b769f203eb8356db238bbbed1322996',
    bentoSdk: 'c1730bd18371c54cf0e1930234f99832014a270656af8af0f3f5f1c88e7a2460f3af9a02f93a3723495cdea46a120275',
  };
  for (const [name, asset] of Object.entries(VENDOR_ASSETS)) {
    const response = await api.get(new URL(asset.path, 'https://datadocks.com').href);
    result.vendorIntegrity.push({ name, status: response.status(), approvedBytesMatch: createHash('sha384').update(await response.body()).digest('hex') === approved[name], nosniff: response.headers()['x-content-type-options'], cache: response.headers()['cache-control'] });
  }
  for (const host of ['datadocks.com', 'www.datadocks.com', 'booking.datadocks.com', 'app.datadocks.com', 'auth.datadocks.com', 'go.datadocks.com', 'getdatadocks.com', 'www.getdatadocks.com']) {
    try {
      const response = await api.get(`http://${host}/?utm_source=security-verification`, { maxRedirects: 0 });
      result.redirects.push({ host, status: response.status(), location: response.headers().location });
    } catch (error) { result.redirects.push({ host, error: error.message }); }
  }
  const calendly = await api.get('https://calendly.com/nick-rakovsky/datadocks-demo');
  result.calendlyReachability = { status: calendly.status(), finalUrl: cleanUrl(calendly.url()) };

  const browser = await chromium.launch({ headless: process.env.CSP_HEADED !== '1' });
  try {
    for (const [url, mobile] of [
      ['https://datadocks.com/', false], ['https://datadocks.com/', true],
      ['https://datadocks.com/integrations', false], ['https://datadocks.com/posts/dwell-time-in-trucking', true],
      ['https://booking.datadocks.com/', false], ['https://booking.datadocks.com/sessions/new', false],
    ]) {
      const context = await browser.newContext({ serviceWorkers: 'block', ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1280, height: 900 } }) });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'serviceWorker', { value: undefined });
        window.__ddAuditViolations = [];
        document.addEventListener('securitypolicyviolation', event => window.__ddAuditViolations.push({ directive: event.effectiveDirective, disposition: event.disposition, blockedURI: event.blockedURI, line: event.lineNumber }));
      });
      const page = await context.newPage(), executableResponses = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', async response => {
        if (response.request().resourceType() === 'script' || /javascript/.test(response.headers()['content-type'] || '')) {
          try { executableResponses.push({ url: cleanUrl(response.url()), status: response.status(), sha384: 'sha384-' + digest('sha384', await response.body()) }); }
          catch { executableResponses.push({ url: cleanUrl(response.url()), status: response.status(), bodyUnavailable: true }); }
        }
      });
      await context.route('**/*', route => {
        const req = route.request(), target = new URL(req.url());
        if (target.pathname === '/__security-verification/eval.js') return route.fulfill({ contentType: 'application/javascript', body: "try { new Function('window.__ddEvalRan = true')(); } catch { window.__ddEvalBlocked = true; }" });
        if (!['GET', 'HEAD'].includes(req.method()) || /(?:bentonow\.com|nr-data\.net|leadfeeder\.com|lfeeder\.com|google-analytics\.com)$/.test(target.hostname) || /^\/cdn-cgi\/(?:rum|zaraz\/t)/.test(target.pathname)) return route.abort();
        return route.continue();
      });
      try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(13000);
        const startupViolations = await page.evaluate(() => window.__ddAuditViolations);
        const scriptElements = await page.locator('script').evaluateAll(nodes => nodes.filter(node => node.src).map(node => ({ url: new URL(node.src).origin + new URL(node.src).pathname, integrity: node.integrity || null, noncePresent: Boolean(node.nonce), type: node.type })));
        await page.evaluate(() => {
          const inline = document.createElement('script'); inline.textContent = 'window.__ddUnapprovedRan = true'; document.head.appendChild(inline);
          const external = document.createElement('script'); external.src = '/__security-verification/eval.js'; document.head.appendChild(external);
          const button = document.createElement('button'); button.id = 'security-verification-probe'; button.textContent = 'Verification'; button.setAttribute('onclick', 'window.__ddAttributeRan = true'); button.addEventListener('click', () => { window.__ddListenerRan = true; }); document.body.appendChild(button); button.click();
        });
        await page.waitForTimeout(500);
        const probes = await page.evaluate(() => ({ unapprovedInlineBlocked: window.__ddUnapprovedRan !== true, inlineAttributeBlocked: window.__ddAttributeRan !== true, eventListenerRan: window.__ddListenerRan === true, evalBlocked: window.__ddEvalBlocked === true, evalRan: window.__ddEvalRan === true }));
        result.runtime.push({ url, mobile, status: response.status(), title: await page.title(), startupViolations, errors, probes, scriptElements, executableResponses });
      } catch (error) { result.runtime.push({ url, mobile, error: error.message, errors, executableResponses }); }
      await context.close();
    }
  } finally { await browser.close(); }
} finally {
  await api.dispose();
  fs.writeFileSync(`${directory}/public-security.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ at: result.at, pages: result.pages.map(page => ({ url: page.url, status: page.status, error: page.error, csp: Boolean(page.headers?.['content-security-policy']), reportOnly: Boolean(page.headers?.['content-security-policy-report-only']), metaCsp: page.metaPolicies?.length, nosniff: page.headers?.['x-content-type-options'], eventAttributes: page.eventAttributes })), assets: result.assets.map(asset => ({ url: asset.url, status: asset.status, nosniff: asset.nosniff, type: asset.type })), vendorIntegrity: result.vendorIntegrity, redirects: result.redirects, calendly: result.calendlyReachability, runtime: result.runtime.map(row => ({ url: row.url, mobile: row.mobile, status: row.status, error: row.error, startupViolations: row.startupViolations, errors: row.errors, probes: row.probes, scripts: row.executableResponses?.map(script => script.url) })) }));
}
