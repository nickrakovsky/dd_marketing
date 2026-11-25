import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';
import { finishPublicationStyles } from './publication-build.mjs';

test('critical CSS is deduplicated without changing route CSS or response HTML', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-styles-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '_worker.js'));
  fs.mkdirSync(path.join(root, '_build'));
  const runtime = fs.readFileSync(new URL('../src/lib/publication-styles.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(runtime, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  }).outputText;
  const file = path.join(root, '_worker.js/middleware.mjs');
  fs.writeFileSync(file, `${code}\nexport { serialized };`);
  const shared = '.card::before{content:"Quoted \\"text\\" · €"}\n.card{color:red}';
  const distinct = `${shared}\n@media(min-width:40rem){.card{color:blue}}`;
  const cssByPath = { '/': shared, '/posts': shared, '/posts/example': distinct, '/videos/example': shared };

  finishPublicationStyles(root, cssByPath);
  const { serialized, withPublicationStyles } = await import(pathToFileURL(file).href);
  const packed = JSON.parse(serialized);
  assert.deepEqual(packed.styles, [shared, distinct]);
  assert.deepEqual(packed.byPath, { '/': 0, '/posts': 0, '/posts/example': 1, '/videos/example': 0 });
  assert.equal(fs.existsSync(path.join(root, '_build')), false);

  const link = '<link rel="stylesheet" href="/_astro/page.css">';
  const secondLink = '<link rel="stylesheet" href="/_astro/widget.css">';
  const html = `<html><head>${link}${secondLink}</head><body>Article</body></html>`;
  for (const [pathname, css] of Object.entries(cssByPath)) {
    assert.equal(packed.styles[packed.byPath[pathname]], css);
    const response = await withPublicationStyles(new Response(html, {
      headers: { 'Content-Type': 'text/html', 'ETag': 'old', 'Content-Length': String(html.length) },
    }), pathname.toUpperCase());
    const deferred = value => `${value.replace('rel="stylesheet"', 'rel="stylesheet" media="print" data-dd-async-css')}<noscript>${value}</noscript>`;
    assert.equal(await response.text(), `<html><head><style data-publication-critical>${css}</style>${deferred(link)}${deferred(secondLink)}</head><body>Article</body></html>`);
    assert.equal(response.headers.has('ETag'), false);
    assert.equal(response.headers.has('Content-Length'), false);
  }
  for (const [pathname, status, contentType] of [
    ['/missing', 200, 'text/html'],
    ['/', 404, 'text/html'],
    ['/', 200, 'application/json'],
  ]) {
    const response = new Response(html, { status, headers: { 'Content-Type': contentType } });
    assert.equal(await withPublicationStyles(response, pathname), response);
    assert.equal(await response.text(), html);
  }
});

test('missing required critical styles still fail the build', () => {
  assert.throws(() => finishPublicationStyles('/unused', { '/': '.home{}' }), /Missing publication critical CSS/);
  assert.throws(() => finishPublicationStyles('/unused', { '/posts': '.hub{}' }), /Missing publication critical CSS/);
});
