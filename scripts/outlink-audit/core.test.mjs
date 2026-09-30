import assert from 'node:assert/strict';
import test from 'node:test';
import { runAudit } from './core.mjs';

const SITE = 'https://site.test';
const html = (body, status = 200, headers = {}) => new Response(body, { status, headers: { 'content-type': 'text/html', ...headers } });
const xml = body => new Response(body, { headers: { 'content-type': 'application/xml' } });
const sitemap = (...urls) => xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);

function fixture(routes, overrides = {}) {
  let time = Date.parse('2026-09-30T12:00:00Z');
  const calls = [];
  const sleeps = [];
  const counters = new Map();
  const fetchImpl = async (url, options) => {
    calls.push({ url, time, options });
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'manual');
    assert.ok(options.signal instanceof AbortSignal);
    const count = counters.get(url) ?? 0;
    counters.set(url, count + 1);
    const handler = routes[url];
    assert.ok(handler, `Unexpected request: ${url}`);
    return handler(count, options);
  };
  const config = {
    seedUrls: ['/'], sitemapUrls: [], concurrency: 1, perHostDelayMs: 0,
    backoffMs: 10, confirmationDelayMs: 30, ...overrides,
  };
  return {
    calls, sleeps,
    run: () => runAudit({
      siteUrl: SITE, config, fetchImpl,
      now: () => time,
      sleep: async milliseconds => { sleeps.push(milliseconds); time += milliseconds; },
    }),
  };
}

test('discovers nested sitemaps, pagination and canonical aliases; preserves queries, parents, and editorial scope', async () => {
  const f = fixture({
    [`${SITE}/sitemap-index.xml`]: () => xml(`<sitemapindex><sitemap><loc>${SITE}/posts.xml</loc></sitemap></sitemapindex>`),
    [`${SITE}/posts.xml`]: () => sitemap(`${SITE}/article`),
    [`${SITE}/`]: () => html('<a href="/posts?page=2">Next</a><a href="https://www.site.test/article#top">Article</a><a href="https://other.test/ref?q=1#part">One</a><img src="https://assets.test/image.png"><link rel="stylesheet" href="https://assets.test/site.css"><a href="mailto:help@site.test">Email</a>'),
    [`${SITE}/article`]: () => html('<a href="https://other.test/ref?q=1#other">Same</a><a href="https://other.test/ref?q=2">Distinct query</a>'),
    [`${SITE}/posts?page=2`]: () => html('<a href="/posts?page=3">Next page</a>'),
    [`${SITE}/posts?page=3`]: () => html('<a href="https://other.test/last">Last</a>'),
    'https://other.test/ref?q=1': () => html('<a href="https://never.test/deep">Do not crawl me</a>'),
    'https://other.test/ref?q=2': () => html('OK'),
    'https://other.test/last': () => html('OK'),
  }, { sitemapUrls: ['/sitemap-index.xml'], firstPartyHosts: ['www.site.test'] });
  const result = await f.run();
  assert.equal(result.complete, true);
  assert.equal(result.coverage.pagesScanned, 4);
  assert.equal(result.coverage.sitemapsScanned, 2);
  assert.equal(result.links.length, 3);
  assert.deepEqual(result.links.find(link => link.url.endsWith('q=1')).parents, [`${SITE}/`, `${SITE}/article`]);
  assert.ok(result.links.every(link => link.classification === 'reachable'));
  assert.equal(f.calls.filter(call => call.url === 'https://other.test/ref?q=1').length, 1);
});

test('GET 404 then 200 is reachable; repeated 404/410 is dead only after a delayed second pass', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/flaky">Flaky</a><a href="https://other.test/dead">Dead</a>'),
    'https://other.test/flaky': count => html(count ? 'OK' : 'Not found', count ? 200 : 404),
    'https://other.test/dead': count => html('Gone', count ? 410 : 404),
  });
  const result = await f.run();
  const flaky = result.links.find(link => link.url.endsWith('/flaky'));
  const dead = result.links.find(link => link.url.endsWith('/dead'));
  assert.equal(flaky.classification, 'reachable');
  assert.equal(dead.classification, 'dead');
  assert.deepEqual(dead.checks.map(check => check.status), [404, 410]);
  assert.equal(f.sleeps.filter(delay => delay === 30).length, 1);
  assert.equal(Date.parse(dead.checks[1].checkedAt) - Date.parse(dead.checks[0].checkedAt), 30);
});

test('a failed confirmation remains unverified', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/dead">Maybe dead</a>'),
    'https://other.test/dead': count => html('Unavailable', count ? 403 : 404),
  });
  const { links } = await f.run();
  assert.equal(links[0].classification, 'unverified');
  assert.deepEqual(links[0].checks.map(check => check.status), [404, 403]);
});

test('rate limits use bounded Retry-After backoff; long requested waits stay unverified', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/retry">Retry</a><a href="https://other.test/long">Long</a>'),
    'https://other.test/retry': count => html('Retry', count ? 200 : 429, count ? {} : { 'Retry-After': '2' }),
    'https://other.test/long': () => html('Retry much later', 429, { 'Retry-After': '3600' }),
  });
  const { links } = await f.run();
  assert.equal(links.find(link => link.url.endsWith('/retry')).classification, 'reachable');
  assert.deepEqual(links.find(link => link.url.endsWith('/retry')).checks.map(check => check.status), [429, 200]);
  const long = links.find(link => link.url.endsWith('/long'));
  assert.equal(long.classification, 'unverified');
  assert.equal(long.checks.length, 1);
  assert.match(long.reason, /wait limit/);
  assert.ok(f.sleeps.includes(2000));
  assert.ok(!f.sleeps.includes(3600000));
});

test('network errors and transient statuses retry at most twice', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/network">Network</a><a href="https://other.test/service">Service</a>'),
    'https://other.test/network': () => { throw new Error('connection reset'); },
    'https://other.test/service': () => html('Unavailable', 503),
  });
  const result = await f.run();
  assert.ok(result.links.every(link => link.classification === 'unverified' && link.checks.length === 3));
  assert.equal(result.complete, true);
  assert.equal(result.links.find(link => link.url.endsWith('/network')).status, null);
});

test('follows bounded redirects and records terminal response; redirect loops are unverified', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/moved">Moved</a><a href="https://other.test/loop">Loop</a>'),
    'https://other.test/moved': () => new Response(null, { status: 302, headers: { Location: '/new' } }),
    'https://other.test/new': () => html('Not found', 404),
    'https://other.test/loop': () => new Response(null, { status: 301, headers: { Location: '/loop' } }),
  });
  const { links } = await f.run();
  const moved = links.find(link => link.url.endsWith('/moved'));
  assert.equal(moved.classification, 'dead');
  assert.equal(moved.checks[0].finalUrl, 'https://other.test/new');
  assert.equal(moved.checks[0].redirects[0].status, 302);
  const loop = links.find(link => link.url.endsWith('/loop'));
  assert.equal(loop.classification, 'unverified');
  assert.match(loop.reason, /Redirect loop/);
});

test('challenges cannot become dead or reachable even with status 404 or 200', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/404">Challenge</a><a href="https://other.test/200">Challenge</a>'),
    'https://other.test/404': () => html('<title>Just a moment...</title>', 404),
    'https://other.test/200': () => html('Please verify you are human', 200),
  });
  const result = await f.run();
  assert.ok(result.links.every(link => link.classification === 'unverified' && link.checks.length === 1));
  assert.ok(result.links.every(link => link.checks[0].challenge));
});

test('missing pages and malformed sitemap flag partial discovery while preserving checked links', async () => {
  const f = fixture({
    [`${SITE}/sitemap-index.xml`]: () => xml('<invalid'),
    [`${SITE}/`]: () => html('<a href="/missing">Missing page</a><a href="https://other.test/live">Live</a>'),
    [`${SITE}/missing`]: () => html('Not found', 404),
    'https://other.test/live': () => html('OK'),
  }, { sitemapUrls: ['/sitemap-index.xml'] });
  const result = await f.run();
  assert.equal(result.complete, false);
  assert.equal(result.errors.length, 2);
  assert.equal(result.links[0].classification, 'reachable');
});

test('discovery never follows an offsite redirect or parses binary assets', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="/redirect">Redirect</a><a href="/brochure.pdf">PDF</a>'),
    [`${SITE}/redirect`]: () => new Response(null, { status: 302, headers: { Location: 'https://never.test/' } }),
    [`${SITE}/brochure.pdf`]: () => new Response('binary', { headers: { 'content-type': 'application/pdf' } }),
  });
  const result = await f.run();
  assert.equal(result.complete, false);
  assert.equal(result.coverage.nonHtmlPagesSkipped, 1);
  assert.equal(result.links.length, 0);
  assert.ok(result.errors.some(error => /outside the site/.test(error.message)));
});

test('exact URL exclusions require a reason and do not suppress other query variants', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/?a=1#part">Excluded</a><a href="https://other.test/?a=2">Included</a>'),
    'https://other.test/?a=2': () => html('OK'),
  }, { excludeUrls: [{ url: 'https://other.test/?a=1', reason: 'Intentionally retired citation' }] });
  const result = await f.run();
  assert.deepEqual(result.suppressedUrls, ['https://other.test/?a=1']);
  assert.equal(result.links.length, 1);
  await assert.rejects(fixture({}, { excludeUrls: [{ url: 'https://other.test/', reason: '' }] }).run, /reason/);
});

test('page and response limits flag incomplete discovery; oversized error bodies are unverified', async () => {
  const limited = fixture({ [`${SITE}/`]: () => html('<a href="/two">Next</a>') }, { maxPages: 1 });
  assert.equal((await limited.run()).complete, false);
  const oversized = fixture({ [`${SITE}/`]: () => html('x'.repeat(51)) }, { maxPageBytes: 50 });
  assert.equal((await oversized.run()).complete, false);
  const errorBody = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/error">Error</a>'),
    'https://other.test/error': () => html('x'.repeat(51), 404),
  }, { maxCheckBytes: 50 });
  assert.equal((await errorBody.run()).links[0].classification, 'unverified');
});

test('same-host requests are paced and the time budget prevents false confirmation', async () => {
  const paced = fixture({
    [`${SITE}/`]: () => html('<a href="/two">Next</a>'),
    [`${SITE}/two`]: () => html('OK'),
  }, { perHostDelayMs: 1000 });
  await paced.run();
  assert.equal(paced.calls[1].time - paced.calls[0].time, 1000);
  const budget = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/dead">Maybe dead</a>'),
    'https://other.test/dead': () => html('Not found', 404),
  }, { maxRunMs: 20, confirmationDelayMs: 30 });
  const result = await budget.run();
  assert.equal(result.complete, false);
  assert.equal(result.links[0].classification, 'unverified');
  assert.equal(result.links[0].checks.length, 1);
});

test('Retry-After pauses sibling URLs on that host and excessive waits stop further host requests', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/first">First</a><a href="https://other.test/second">Second</a>'),
    'https://other.test/first': count => html('OK', count ? 200 : 429, count ? {} : { 'Retry-After': '1' }),
    'https://other.test/second': () => html('OK'),
  }, { concurrency: 4 });
  await f.run();
  const first = f.calls.find(call => call.url.endsWith('/first'));
  const second = f.calls.find(call => call.url.endsWith('/second'));
  assert.ok(second.time - first.time >= 1000);
  const long = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/first">First</a><a href="https://other.test/second">Second</a>'),
    'https://other.test/first': () => html('Later', 429, { 'Retry-After': '3600' }),
  }, { concurrency: 4 });
  const result = await long.run();
  assert.ok(result.links.every(link => link.classification === 'unverified'));
  assert.equal(long.calls.filter(call => call.url.startsWith('https://other.test')).length, 1);
});

test('private address literals, local hostnames and private redirects are never requested', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="http://localhost/admin">Local</a><a href="http://127.1/">Short IPv4</a><a href="http://169.254.169.254/">Metadata</a><a href="http://[::ffff:127.0.0.1]/">Mapped</a><a href="http://[::1]/">IPv6</a><a href="https://other.test/redirect">Redirect</a>'),
    'https://other.test/redirect': () => new Response(null, { status: 302, headers: { Location: 'http://10.0.0.1/' } }),
  });
  const result = await f.run();
  assert.equal(result.links.length, 6);
  assert.ok(result.links.every(link => link.classification === 'unverified' && /Non-public/.test(link.reason)));
  assert.equal(f.calls.length, 2);
});

test('confirmation retries retain separate phase evidence', async () => {
  const f = fixture({
    [`${SITE}/`]: () => html('<a href="https://other.test/dead">Dead</a>'),
    'https://other.test/dead': count => html('Not found', count === 1 ? 503 : 404),
  });
  const { links } = await f.run();
  assert.equal(links[0].classification, 'dead');
  assert.deepEqual(links[0].checks.map(check => [check.phase, check.status]), [['initial', 404], ['confirmation', 503], ['confirmation', 404]]);
});

test('worker pool limits total concurrency and serializes requests per host', async () => {
  let active = 0;
  let maximum = 0;
  const hosts = new Set();
  const targets = Array.from({ length: 12 }, (_, index) => `https://external${index % 6}.test/${index}`);
  const result = await runAudit({
    siteUrl: SITE,
    config: { seedUrls: ['/'], sitemapUrls: [], perHostDelayMs: 0, concurrency: 4 },
    fetchImpl: async url => {
      if (url === `${SITE}/`) return html(targets.map(target => `<a href="${target}">Link</a>`).join(''));
      const host = new URL(url).host;
      assert.equal(hosts.has(host), false, 'same host must not have concurrent requests');
      hosts.add(host);
      active++;
      maximum = Math.max(maximum, active);
      await new Promise(resolve => setImmediate(resolve));
      active--;
      hosts.delete(host);
      return html('OK');
    },
  });
  assert.equal(maximum, 4);
  assert.ok(result.links.every(link => link.classification === 'reachable'));
});
