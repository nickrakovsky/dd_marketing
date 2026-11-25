import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assertSources, assertRoutes, assertPublicModule, assertOutput } from './publication-boundary.mjs';
import { isInternalPath } from '../src/lib/internal-paths.mjs';
import internalWorkspace from '../integrations/internal-workspace.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-boundary-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, content = 'fixture') => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  for (const file of ['src/pages/index.astro', 'public/images/logo.svg', 'src/content/posts/published.mdx', 'src/assets/logo.svg']) write(file);
  return { root, write };
}

test('new public pages, downloads, content and images need no filename inventory', t => {
  const { root, write } = fixture(t);
  assert.doesNotThrow(() => assertSources(root));
  for (const file of ['src/pages/new-page.astro', 'public/files/new-download.pdf', 'src/content/posts/new-article.mdx', 'src/assets/new-image.svg']) {
    write(file);
    assert.doesNotThrow(() => assertSources(root));
    fs.unlinkSync(path.join(root, file));
  }
});

test('reserved internal namespaces remain forbidden in publishing folders', t => {
  const { root, write } = fixture(t);
  for (const file of ['src/pages/wireframes/new.astro', 'public/internal/note.pdf', 'src/content/preview/draft.mdx', 'src/assets/__internal/mockup.svg']) {
    write(file);
    assert.throws(() => assertSources(root), /Reserved internal path/);
    fs.unlinkSync(path.join(root, file));
  }
});

test('symlinks cannot smuggle private files into publication inputs', t => {
  const { root, write } = fixture(t);
  write('internal/secret.svg');
  fs.symlinkSync(path.join(root, 'internal/secret.svg'), path.join(root, 'public/images/private.svg'));
  assert.throws(() => assertSources(root), /Symlinks/);
});

test('private imports are rejected, including raw/url imports and resolved symlinks', t => {
  const { root, write } = fixture(t);
  write('internal/secret.txt');
  for (const suffix of ['', '?raw', '?url']) {
    assert.throws(() => assertPublicModule(path.join(root, 'internal/secret.txt') + suffix, root), /cannot import internal/);
  }
  fs.symlinkSync(path.join(root, 'internal/secret.txt'), path.join(root, 'src/alias.txt'));
  assert.throws(() => assertPublicModule(path.join(root, 'src/alias.txt'), root), /cannot import internal/);
  assert.doesNotThrow(() => assertPublicModule(path.join(root, 'src/pages/index.astro'), root));
  write('docs/internal-note.md');
  assert.throws(() => assertPublicModule(path.join(root, 'docs/internal-note.md') + '?raw', root), /outside approved source roots/);
});

test('normal routes need no inventory while injected internal entrypoints are rejected', t => {
  const { root, write } = fixture(t);
  write('internal/page.astro');
  assert.throws(() => assertRoutes([{ pattern: '/wireframes', entrypoint: 'internal/page.astro' }], root), /Internal production route/);
  assert.throws(() => assertRoutes([{ pattern: '/innocent-name', entrypoint: 'internal/page.astro' }], root), /cannot import internal/);
  assert.doesNotThrow(() => assertRoutes([{ pattern: '/', entrypoint: 'src/pages/index.astro' }, { pattern: '/plugin-route', entrypoint: 'virtual:plugin-page' }], root));
});

test('final deployment output rejects private artifacts and unexpected generated pages', t => {
  const { root, write } = fixture(t);
  write('dist/index.html');
  write('dist/images/logo.svg');
  const check = () => assertOutput(path.join(root, 'dist'), [{ pathname: '' }], root);
  assert.doesNotThrow(check);
  write('public/files/new-download.pdf');
  write('dist/files/new-download.pdf');
  assert.doesNotThrow(check);
  for (const file of ['wireframes/index.html', 'brand-assets/proposal-template.pdf', '_build/publication/home.html', 'forgotten-draft.html']) {
    write('dist/' + file);
    assert.throws(check, /Internal artifact|Unexpected deployment artifact/);
    fs.unlinkSync(path.join(root, 'dist', file));
  }
  write('dist/sitemap-0.xml', '<urlset><url><loc>https://datadocks.com/wireframes</loc></url></urlset>');
  assert.throws(check, /Internal URL/);
});

test('old URLs and encoded/html aliases remain private; legitimate public assets remain available', () => {
  for (const url of ['/wireframes', '/wireframes.html', '/wireframes/index.html', '/Wireframes/split-stream/', '/%77ireframes/tabbed-hub', '/%2577ireframes', '/brand-assets/proposal-template.pdf', '/__internal/assets/brand/proposal-template.pdf', '/brand-book.html', '/_worker.js/index.js', '/preview/daily-blog/home']) {
    assert.equal(isInternalPath(url), true, url);
  }
  for (const url of ['/', '/posts', '/brand-assets/logo-orange.svg', '/datadocks-features/dock-dashboard', '/wireframes-guide']) {
    assert.equal(isInternalPath(url), false, url);
  }
});

test('internal pages exist only in local development, never build or preview', () => {
  for (const command of ['build', 'preview', 'dev']) {
    const integration = internalWorkspace();
    const routes = [];
    integration.hooks['astro:config:setup']({ command, injectRoute: route => routes.push(route) });
    assert.equal(routes.length > 0, command === 'dev');
    if (command === 'dev') {
      assert.ok(routes.some(route => route.pattern === '/wireframes'));
      assert.throws(() => integration.hooks['astro:config:done']({ config: { server: { host: true } } }), /local-only/);
    }
  }
});
