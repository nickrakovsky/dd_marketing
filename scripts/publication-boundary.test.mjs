import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assertSources, assertRoutes, assertPublicModule, assertOutput } from './publication-boundary.mjs';
import { isInternalPath } from '../src/lib/internal-paths.mjs';
import internalWorkspace from '../integrations/internal-workspace.mjs';

const manifest = {
  pageEntrypoints: ['src/pages/index.astro'],
  publicAssets: ['images/logo.svg'],
  contentFiles: ['posts/published.mdx'],
  sourceAssets: ['logo.svg'],
  integrationRoutes: ['/_image'],
};
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

test('unreviewed routes, static assets, and automatically discovered content fail closed', t => {
  const { root, write } = fixture(t);
  assert.doesNotThrow(() => assertSources(root, manifest));
  for (const file of ['src/pages/mockup.astro', 'public/images/proposal.pdf', 'src/content/posts/draft.mdx', 'src/assets/proposal.pdf']) {
    write(file);
    assert.throws(() => assertSources(root, manifest), /Unapproved public file/);
    fs.unlinkSync(path.join(root, file));
  }
});

test('a manifest entry cannot approve a reserved internal namespace', t => {
  const { root, write } = fixture(t);
  write('src/pages/wireframes/new.astro');
  assert.throws(() => assertSources(root, {
    ...manifest, pageEntrypoints: [...manifest.pageEntrypoints, 'src/pages/wireframes/new.astro'],
  }), /Reserved internal path/);
});

test('symlinks cannot smuggle private files into publication inputs', t => {
  const { root, write } = fixture(t);
  write('internal/secret.svg');
  fs.symlinkSync(path.join(root, 'internal/secret.svg'), path.join(root, 'public/images/private.svg'));
  assert.throws(() => assertSources(root, manifest), /Symlinks/);
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

test('injected internal and unapproved routes cannot bypass the source manifest', () => {
  assert.throws(() => assertRoutes([{ pattern: '/wireframes', entrypoint: 'internal/pages/index.astro' }], manifest), /Internal production route/);
  assert.throws(() => assertRoutes([{ pattern: '/experiment', entrypoint: 'plugin/page.astro' }], manifest), /Unapproved production route/);
  assert.doesNotThrow(() => assertRoutes([{ pattern: '/', entrypoint: 'src/pages/index.astro' }], manifest));
});

test('final deployment output rejects private artifacts and unexpected generated pages', t => {
  const { root, write } = fixture(t);
  write('dist/index.html');
  write('dist/images/logo.svg');
  const check = () => assertOutput(path.join(root, 'dist'), [{ pathname: '' }], manifest);
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
