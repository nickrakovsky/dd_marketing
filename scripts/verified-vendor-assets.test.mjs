import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyVendorSource, transformVendorSource, prepareVendorAssets, loadVendorSource } from '../integrations/verified-vendor-assets.mjs';
import { VENDOR_SOURCES, VENDOR_ASSETS, PINNED_BENTO_UUID, bentoScriptPath } from '../src/lib/vendor-assets.mjs';

test('SHA-384 accepts reviewed bytes and rejects a one-byte change', () => {
  const bytes = Buffer.from('reviewed vendor script');
  const integrity = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
  verifyVendorSource('fixture', bytes, integrity);
  assert.throws(() => verifyVendorSource('fixture', Buffer.from('reviewed vendor scripT'), integrity), /failed SHA-384/);
});

test('the Bento bootstrap loads the pinned local SDK, with no CDN fallback', () => {
  const source = Buffer.from(`load('${VENDOR_SOURCES.bentoSdk.url}')`);
  assert.equal(transformVendorSource('bentoBootstrap', source).toString(), `load('${VENDOR_ASSETS.bentoSdk.path}')`);
  assert.throws(() => transformVendorSource('bentoBootstrap', Buffer.from('load("unknown.js")')), /Unexpected Bento/);
  assert.throws(() => transformVendorSource('bentoBootstrap', Buffer.concat([source, source])), /Unexpected Bento/);
});

test('Calendly CSS resolves its close icon on the first-party origin', () => {
  const css = Buffer.from('background:url(/assets/external/close-icon.svg)');
  const result = transformVendorSource('calendlyCss', css).toString();
  assert.equal(result, `background:url(${VENDOR_ASSETS.calendlyCloseIcon.path})`);
});

test('a different Bento site cannot silently receive the wrong tracker', () => {
  assert.equal(bentoScriptPath(undefined), undefined);
  assert.equal(bentoScriptPath(PINNED_BENTO_UUID), VENDOR_ASSETS.bentoBootstrap.path);
  assert.throws(() => bentoScriptPath('different-site'), /does not match/);
});

test('upstream HTTP errors and changed bytes fail before publishing', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dd-vendor-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const build = path.join(root, 'dist');
  await assert.rejects(prepareVendorAssets(build, path.join(root, 'cache'), async () => new Response('', { status: 503 })), /HTTP 503/);
  await assert.rejects(prepareVendorAssets(build, path.join(root, 'cache'), async () => new Response('modified code')), /failed SHA-384/);
  await assert.rejects(fs.access(build));
});

test('cached vendor bytes are checked rather than trusted', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dd-vendor-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const cache = path.join(root, 'cache');
  await fs.mkdir(cache);
  const key = createHash('sha384').update(VENDOR_SOURCES.calendlyJs.integrity).digest('hex');
  await fs.writeFile(path.join(cache, key), 'corrupted cached code');
  await assert.rejects(prepareVendorAssets(path.join(root, 'dist'), cache, async () => { throw new Error('must not fetch'); }), /failed SHA-384/);
});

test('the reviewed Bento SDK builds without requesting its blocked upstream URL', async () => {
  let networkRequests = 0;
  const bytes = await loadVendorSource('bentoSdk', '/unused-cache', async () => {
    networkRequests++;
    return new Response('', { status: 403 });
  });
  verifyVendorSource('bentoSdk', bytes);
  assert.equal(networkRequests, 0);
});

test('missing or corrupted SDK snapshots fail without falling back to the network', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dd-vendor-snapshot-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sourceRoot = pathToFileURL(root + path.sep);
  let networkRequests = 0;
  const fetcher = async () => { networkRequests++; throw new Error('must not fetch'); };
  await assert.rejects(loadVendorSource('bentoSdk', '/unused-cache', fetcher, sourceRoot), { code: 'ENOENT' });
  const snapshot = path.join(root, VENDOR_SOURCES.bentoSdk.snapshot);
  await fs.mkdir(path.dirname(snapshot), { recursive: true });
  await fs.writeFile(snapshot, 'modified SDK');
  await assert.rejects(loadVendorSource('bentoSdk', '/unused-cache', fetcher, sourceRoot), /failed SHA-384/);
  assert.equal(networkRequests, 0);
});
