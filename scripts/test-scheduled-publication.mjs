#!/usr/bin/env node
/**
 * Exercise every publication cutoff against ONE production build.
 *
 * Run `npm run build` first, then `node scripts/test-scheduled-publication.mjs`.
 * This script copies dist to an OS temporary directory and wraps only the copied
 * Worker with a controllable clock. Neither application source nor the original
 * build receives a clock override or a publicly accessible preview mechanism.
 * Requests run sequentially so each response has one consistent test instant.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { access, cp, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(root, process.env.PUBLICATION_TEST_DIST || 'dist');
const originalWorker = join(dist, '_worker.js', 'index.js');
const manifest = JSON.parse(await readFile(join(root, 'docs/daily-blog-schedule.json'), 'utf8'));
const slots = [...manifest.slots].sort((a, b) => Date.parse(a.pubDate) - Date.parse(b.pubDate));
const clockHeader = `x-publication-test-${randomBytes(12).toString('hex')}`;
const articlePath = (slot) => `/posts/${slot.slug}`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

await access(originalWorker).catch(() => {
  throw new Error(`No production Worker at ${originalWorker}. Run npm run build first.`);
});
assert.equal(slots.length, 15, 'Expected the complete 15-post rollout schedule');
const originalWorkerHash = sha256(await readFile(originalWorker));
const scratch = await mkdtemp(join(tmpdir(), 'datadocks-publication-test-'));
let server;
let serverExit;
let serverLog = '';
let checks = 0;

async function availablePort() {
  const socket = createServer();
  await new Promise((done, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', done);
  });
  const port = socket.address().port;
  await new Promise((done, reject) => socket.close((error) => error ? reject(error) : done()));
  return port;
}

// No-store is intentional: a cached pre-publication 404 or listing must never
// outlive a release boundary. Revisit these assertions if bounded caching is
// introduced, with a separate test for expiry and revalidation at the cutoff.
function assertUncached(response, label) {
  assert.match(response.headers.get('cache-control') || '', /(?:^|,)\s*(?:private\s*,\s*)?no-store\b/i,
    `${label}: publication-sensitive responses must not be cached`);
}

try {
  const copiedDist = join(scratch, 'dist');
  await cp(dist, copiedDist, { recursive: true });
  await cp(join(root, 'wrangler.toml'), join(scratch, 'wrangler.toml'));
  const copiedEntry = join(copiedDist, '_worker.js', 'index.js');
  await rename(copiedEntry, join(copiedDist, '_worker.js', 'publication-test-original.js'));
  await writeFile(copiedEntry, `// TEST HARNESS ONLY. This file exists solely in an OS temporary directory.
import worker from './publication-test-original.js';
const RealDate = globalThis.Date;
let requestTime;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [requestTime ?? RealDate.now()])); }
  static now() { return requestTime ?? RealDate.now(); }
};
export default {
  ...worker,
  async fetch(request, env, context) {
    const clock = request.headers.get(${JSON.stringify(clockHeader)});
    requestTime = clock === null ? undefined : RealDate.parse(clock);
    if (requestTime !== undefined && !Number.isFinite(requestTime)) {
      requestTime = undefined;
      return new Response('Invalid harness clock', { status: 400 });
    }
    const headers = new Headers(request.headers);
    headers.delete(${JSON.stringify(clockHeader)});
    try {
      const response = await worker.fetch(new Request(request, { headers }), env, context);
      // Astro may stream HTML: keep the clock fixed until rendering is complete.
      const body = response.body ? await response.arrayBuffer() : null;
      return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    } finally {
      requestTime = undefined;
    }
  }
};
`);

  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const wrangler = join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  await access(wrangler);
  server = spawn(process.execPath, [wrangler, 'pages', 'dev', copiedDist,
    '--port', String(port), '--ip', '127.0.0.1', '--kv', 'SESSION',
    '--persist-to', join(scratch, 'wrangler-state'), '--log-level', 'warn'], {
    cwd: scratch,
    env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: join(scratch, 'wrangler.log') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverExit = new Promise((done) => {
    server.once('exit', (code, signal) => done({ code, signal }));
    server.once('error', (error) => done({ error }));
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', (chunk) => { serverLog = (serverLog + chunk).slice(-40000); });
  }

  const request = async (path, at, extraHeaders = {}) => {
    const response = await fetch(`${origin}${path}`, {
      redirect: 'manual',
      headers: { ...extraHeaders, [clockHeader]: new Date(at).toISOString() },
      signal: AbortSignal.timeout(30000),
    });
    const text = await response.text();
    return { response, text };
  };

  const startupDeadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < startupDeadline) {
    if (server.exitCode !== null) throw new Error(`Worker exited during startup (${server.exitCode})`);
    try {
      // A static asset avoids prewarming publication code under the real clock.
      await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(1000) });
      ready = true;
      break;
    } catch {
      await sleep(250);
    }
  }
  assert.ok(ready, 'Cloudflare production Worker did not start within 60 seconds');

  // Both public sitemap entry points must point at the request-time post sitemap.
  for (const path of ['/sitemap.xml', '/sitemap-index.xml']) {
    const { response, text } = await request(path, Date.parse(slots[0].pubDate) - 1);
    assert.equal(response.status, 200, `${path}: sitemap index must remain available`);
    assert.ok(text.includes('/sitemap-posts.xml'), `${path}: missing the dynamic post sitemap`);
    checks++;
  }
  const staticSitemap = await request('/sitemap-0.xml', Date.parse(slots[0].pubDate) - 1);
  assert.equal(staticSitemap.response.status, 200, 'Static sitemap must remain available');
  for (const slot of slots) {
    assert.ok(!staticSitemap.text.includes(articlePath(slot)), `Static sitemap leaked ${slot.slug}`);
  }
  checks++;

  for (const path of ['/_worker.js/index.js', '/_build/publication/home', '/_build/publication/hub', `/_build/publication/posts/${slots[0].slug}`]) {
    const hidden = await request(path, Date.parse(slots[0].pubDate) - 1);
    assert.equal(hidden.response.status, 404, `${path}: build-only files must not be public`);
    checks++;
  }
  assert.ok(!staticSitemap.text.includes('/_build/'), 'Static sitemap exposed build-only samples');

  for (const [index, slot] of slots.entries()) {
    const cutoff = Date.parse(slot.pubDate);
    for (const [phase, instant] of [['before', cutoff - 1], ['exact', cutoff], ['after', cutoff + 1]]) {
      const published = phase !== 'before';
      const label = `Slot ${slot.slot} ${phase} (${new Date(instant).toISOString()})`;
      const { response, text } = await request(articlePath(slot), instant);
      assert.equal(response.status, published ? 200 : 404, `${label}: article availability`);
      assertUncached(response, `${label} article`);
      if (published) {
        assert.ok(text.includes(articlePath(slot)), `${label}: article canonical/content was not rendered`);
        assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), `${label}: published article is noindex`);
        assert.ok(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(text),
          `${label}: published article contains a noindex meta tag`);
      } else {
        assert.match(response.headers.get('x-robots-tag') || '', /noindex/i,
          `${label}: unpublished article needs an explicit noindex response`);
        assert.ok(!text.includes(slot.title), `${label}: unpublished article body leaked`);
      }
      checks++;

      for (const path of ['/', '/posts', '/sitemap-posts.xml']) {
        const result = await request(path, instant);
        assert.equal(result.response.status, 200, `${label}: ${path} response`);
        assertUncached(result.response, `${label} ${path}`);
        assert.equal(result.text.includes(slot.slug), published, `${label}: ${path} visibility`);
        for (const future of slots.filter((entry) => Date.parse(entry.pubDate) > instant)) {
          assert.ok(!result.text.includes(future.slug), `${label}: ${path} leaked future post ${future.slug}`);
        }
        if (path === '/sitemap-posts.xml') {
          for (const due of slots.filter((entry) => Date.parse(entry.pubDate) <= instant)) {
            assert.ok(result.text.includes(articlePath(due)), `${label}: sitemap omitted published post ${due.slug}`);
          }
        }
        checks++;
      }
    }
    console.log(`✓ Slot ${String(index + 1).padStart(2, '0')}: ${slot.slug} — hidden before, published at and after ${slot.pubDate}`);
  }

  // A public preview-style query/header must not move the application's clock.
  const firstCutoff = Date.parse(slots[0].pubDate);
  const attemptedOverride = await request(`${articlePath(slots[0])}?asOf=2099-01-01&previewAsOf=2099-01-01&now=2099-01-01`,
    firstCutoff - 1, { 'x-preview-as-of': '2099-01-01', 'x-publication-time': '2099-01-01', 'x-test-now': '2099-01-01' });
  assert.equal(attemptedOverride.response.status, 404, 'Public preview query/header bypassed the publication gate');
  checks++;

  // The second instalment shares the first instalment's category: related cards
  // on the existing article must update when the new instalment is released.
  const series = slots.filter((slot) => slot.group === 'A');
  assert.ok(series.length >= 2, 'Expected at least two series instalments for related-resource coverage');
  const nextInstallmentCutoff = Date.parse(series[1].pubDate);
  for (const [instant, visible] of [[nextInstallmentCutoff - 1, false], [nextInstallmentCutoff, true]]) {
    const result = await request(articlePath(series[0]), instant);
    assert.equal(result.response.status, 200, 'Already-published article must remain available');
    assert.equal(result.text.includes(articlePath(series[1])), visible, 'Related resources did not follow the publication cutoff');
    checks++;
  }

  // Rewind the same warm Worker to prove collections were not captured by a
  // module-level, first-request filter or permanently cached after publication.
  const rewound = await request('/sitemap-posts.xml', firstCutoff - 1);
  for (const slot of slots) assert.ok(!rewound.text.includes(slot.slug), `Warm Worker leaked ${slot.slug} after clock rewind`);
  checks++;
  assert.equal(sha256(await readFile(originalWorker)), originalWorkerHash, 'Original production Worker was modified');
  console.log(`\nPassed ${checks} publication checks against one unchanged production build. No deployment or rebuild occurred between cutoffs.`);
} catch (error) {
  console.error(error.stack || error);
  if (serverLog) console.error(`\nWorker log (last 40 KB):\n${serverLog}`);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([serverExit, sleep(5000)]);
    if (server.exitCode === null) {
      server.kill('SIGKILL');
      await serverExit;
    }
  }
  await rm(scratch, { recursive: true, force: true });
}
