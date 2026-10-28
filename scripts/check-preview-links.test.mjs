import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { crawlPreview, previewOptions } from './check-preview-links.mjs';

// Keep local fixtures off any configured outbound proxy.
for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']) {
  delete process.env[key];
}

async function fixture(t, handler) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise(resolve => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}/`;
}

test('checks canonical marketing links on the preview and skips app/third-party links', async t => {
  const visited = [];
  const url = await fixture(t, (req, res) => {
    visited.push(req.url);
    res.setHeader('content-type', 'text/html');
    res.end(req.url === '/' ? `
      <a href="https://www.datadocks.com/canonical">Canonical</a>
      <a href="/child">Child</a>
      <a href="https://booking.datadocks.com/">Booking</a>
      <a href="https://another.pages.dev/">Other preview</a>
      <a href="https://datadocks.com.example.org/">External</a>
    ` : req.url === '/child' ? '<img src="/asset.svg">' : 'OK');
  });
  const result = await crawlPreview(url, { deadlineMs: 5_000 });
  assert.equal(result.complete, true);
  assert.equal(result.passed, true);
  assert.ok(visited.includes('/canonical'));
  assert.ok(visited.includes('/asset.svg'));
  for (const host of ['booking.datadocks.com', 'another.pages.dev', 'datadocks.com.example.org']) {
    assert.ok(result.links.some(link => link.url.includes(host) && link.state === 'SKIPPED'));
  }
});

test('a broken internal asset fails with its URL and parent intact', async t => {
  const url = await fixture(t, (req, res) => {
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html');
      res.end('<img src="/missing.svg">');
    } else {
      res.writeHead(404).end();
    }
  });
  const result = await crawlPreview(url, { deadlineMs: 5_000 });
  assert.equal(result.complete, true);
  assert.equal(result.passed, false);
  assert.ok(result.links.some(link => link.state === 'BROKEN' && link.status === 404 && link.parent === url));
});

test('the CLI writes valid JSON and fails when an internal link is broken', async t => {
  const url = await fixture(t, (req, res) => {
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html');
      res.end('<a href="/missing">Missing</a>');
    } else {
      res.writeHead(404).end();
    }
  });
  const directory = await mkdtemp(join(tmpdir(), 'preview-links-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const reportPath = join(directory, 'results.json');
  await assert.rejects(
    promisify(execFile)(process.execPath, ['scripts/check-preview-links.mjs', url, reportPath]),
    error => error.code === 1 && error.stderr.includes('Broken preview links'),
  );
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  assert.equal(report.complete, true);
  assert.equal(report.passed, false);
  assert.ok(report.links.some(link => link.status === 404 && link.url === `${url}missing`));
});

test('failed retries finish with a complete broken-link report', async t => {
  let failures = 0;
  const url = await fixture(t, (req, res) => {
    if (req.url === '/') {
      res.setHeader('content-type', 'text/html');
      res.end('<a href="/unavailable">Unavailable</a>');
    } else {
      failures++;
      res.writeHead(503).end();
    }
  });
  const { LinkChecker } = await import('linkinator');
  const checker = new LinkChecker();
  const check = checker.check.bind(checker);
  checker.check = options => check({ ...options, retryErrorsCount: 1, retryErrorsJitter: 0 });
  const result = await crawlPreview(url, { checker, deadlineMs: 10_000 });
  assert.equal(result.complete, true);
  assert.equal(result.passed, false);
  assert.ok(failures > 2);
  assert.ok(result.links.some(link => link.state === 'BROKEN' && link.status === 503));
});

test('an unsettled crawler times out and preserves partial diagnostics', async () => {
  const checker = new EventEmitter();
  checker.check = () => {
    checker.emit('link', { url: 'https://preview.pages.dev/', state: 'OK', status: 200 });
    return new Promise(() => {});
  };
  const result = await crawlPreview('https://preview.pages.dev/', { checker, deadlineMs: 25 });
  assert.equal(result.complete, false);
  assert.equal(result.passed, false);
  assert.equal(result.links.length, 1);
  assert.match(result.error, /timed out/);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)));
});

test('a crawler exception or empty report cannot become a passing check', async () => {
  for (const check of [
    async () => { throw new Error('crawler stopped'); },
    async () => ({ passed: true, links: [] }),
  ]) {
    const checker = new EventEmitter();
    checker.check = check;
    const result = await crawlPreview('https://preview.pages.dev/', { checker, deadlineMs: 1_000 });
    assert.equal(result.passed, false);
    assert.equal(result.complete, false);
    assert.ok(result.error);
  }
  assert.throws(() => previewOptions('file:///tmp/site'), /HTTP or HTTPS/);
});
