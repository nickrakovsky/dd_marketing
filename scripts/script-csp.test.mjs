import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inlineScriptHashes, prepareScriptPolicy } from './script-csp.mjs';

const hash = text => `sha256-${createHash('sha256').update(text).digest('base64')}`;
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'script-csp-'));
  fs.mkdirSync(path.join(root, '_worker.js'));
  fs.mkdirSync(path.join(root, '_build/publication'), { recursive: true });
  fs.writeFileSync(path.join(root, '_worker.js/index.js'), 'const policy = "__DD_BUILD_SCRIPT_CSP__";');
  fs.writeFileSync(path.join(root, '_headers'), "/*\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy-Report-Only: script-src 'self'\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n");
  fs.writeFileSync(path.join(root, 'about.html'), '<html><head><script>window.reviewed = true;</script></head><body></body></html>');
  fs.writeFileSync(path.join(root, '_build/publication/home.html'), '<html><head><script type="module">window.future = true;</script></head></html>');
  return root;
}

test('hashes browser-parsed executable contents without trusting comments, templates, data or external tags', () => {
  const html = '<!-- <script>commentAttack()</script> --><template><script>templateAttack()</script></template>'
    + '<script type="application/ld+json">{"description":"untrusted"}</script>'
    + '<script type="text/partytown" src="/reviewed.js"></script>'
    + '<script src="/external.js">ignored()</script>'
    + '<script data-src="not-an-external-script">first()\r\nsecond()</script>'
    + '<script type="module">moduleScript()</script>';
  assert.deepEqual(inlineScriptHashes(html), [hash('first()\nsecond()'), hash('moduleScript()')].sort());
});

test('covers static and future runtime builds without changing script contents, assets or cache rules', () => {
  const root = fixture();
  try {
    const policy = prepareScriptPolicy(root);
    assert.ok(policy.includes(`'${hash('window.reviewed = true;')}'`));
    assert.ok(policy.includes(`'${hash('window.future = true;')}'`));
    assert.ok(!policy.includes(hash('window.injected = true;')));
    assert.ok(!/unsafe-inline|unsafe-eval|https:/.test(policy));
    const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
    assert.ok(headers.includes('/about\n  Content-Security-Policy: script-src'));
    assert.ok(!headers.includes('/_build/publication'));
    assert.ok(!headers.includes('Content-Security-Policy-Report-Only'));
    assert.ok(headers.includes('/_astro/*\n  Cache-Control: public, max-age=31536000, immutable'));
    const html = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
    assert.ok(html.includes('<head><meta http-equiv="Content-Security-Policy"'));
    assert.deepEqual(inlineScriptHashes(html), [hash('window.reviewed = true;')]);
    assert.ok(fs.readFileSync(path.join(root, '_worker.js/index.js'), 'utf8').includes(policy));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('fails closed when the Worker marker or Pages header capacity is missing', () => {
  for (const failure of ['marker', 'limit']) {
    const root = fixture();
    try {
      if (failure === 'marker') fs.writeFileSync(path.join(root, '_worker.js/index.js'), 'missingMarker();');
      else fs.writeFileSync(path.join(root, 'about.html'), '<html><head>' + Array.from({ length: 50 }, (_, i) => `<script>unique${i}()</script>`).join('') + '</head></html>');
      assert.throws(() => prepareScriptPolicy(root), failure === 'marker' ? /placeholder/ : /header limit/);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});
