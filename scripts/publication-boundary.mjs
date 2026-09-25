import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInternalPath } from '../src/lib/internal-paths.mjs';

export const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const fail = message => { throw new Error(`[publication-boundary] ${message}`); };

export function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) fail(`Symlinks are not allowed in publication inputs/output: ${file}`);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) files.push(path.relative(directory, file).split(path.sep).join('/'));
      else fail(`Unsupported file: ${file}`);
    }
  };
  if (fs.lstatSync(directory).isSymbolicLink()) fail(`Symlinked directory: ${directory}`);
  visit(directory);
  return files.sort();
}

export function assertSources(root = projectRoot) {
  for (const directory of ['src/pages', 'public', 'src/content', 'src/assets']) {
    for (const file of filesIn(path.join(root, directory))) {
      if (isInternalPath('/' + file.replace(/\.(astro|tsx?|jsx?|mdx?)$/, ''))) fail(`Reserved internal path in ${directory}: ${file}`);
    }
  }
  // Vite's realpath resolution must not turn a public import into private input.
  filesIn(path.join(root, 'src'));
}

export function assertRoutes(routes, root = projectRoot) {
  for (const route of routes) {
    if (route.pattern === '/_build/publication/[...path]' && route.entrypoint === 'src/build-pages/publication-artifacts.astro') continue;
    if (isInternalPath(route.pattern)) fail(`Internal production route: ${route.pattern}`);
    if (route.type === 'redirect') continue; // Explicit redirects in astro.config.mjs.
    // Framework/plugin routes need no separate inventory. Internal entrypoints
    // still cannot become public through injection under an innocent URL.
    assertPublicModule(path.resolve(root, route.entrypoint), root);
  }
}

export function assertPublicModule(id, root = projectRoot) {
  const clean = id.split('?')[0];
  const privateRoots = [root, fs.realpathSync(root)].flatMap(base =>
    ['internal', 'src/offline-pages', 'internal-marketing'].map(dir => path.join(base, dir)));
  let resolved = clean;
  if (fs.existsSync(clean)) resolved = fs.realpathSync(clean);
  if (privateRoots.some(dir => [clean, resolved].some(file => file === dir || file.startsWith(dir + path.sep)))) {
    fail(`Production cannot import internal files: ${id}`);
  }
  if (fs.existsSync(clean)) {
    const relative = path.relative(fs.realpathSync(root), resolved).split(path.sep).join('/');
    const allowed = ['src/', 'public/', 'node_modules/', '.astro/'].some(prefix => relative.startsWith(prefix))
      || relative === 'keystatic.config.ts';
    if (!allowed) fail(`Production import outside approved source roots: ${id}`);
  }
}

export function assertOutput(directory, pages, root = projectRoot) {
  // Derive copied assets from the publishing folder, not a maintained file list.
  const publicAssets = new Set(filesIn(path.join(root, 'public')));
  const html = new Set(pages.map(({ pathname }) => {
    const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
    return clean ? `${clean}.html` : 'index.html';
  }));
  const generated = new Set(['_headers', '_redirects', '_routes.json', 'sitemap-index.xml', 'sitemap-0.xml', 'sitemap.xml']);
  for (const file of filesIn(directory)) {
    // Worker files are server code, never static assets on Pages.
    if (file.startsWith('_worker.js/')) continue;
    if (isInternalPath('/' + file)) fail(`Internal artifact in deployment output: ${file}`);
    if (publicAssets.has(file) || html.has(file) || generated.has(file)) continue;
    if (file.startsWith('_astro/') || file.startsWith('~partytown/')) continue;
    fail(`Unexpected deployment artifact: ${file}`);
  }
  for (const file of filesIn(directory).filter(file => /^sitemap.*\.xml$/.test(file))) {
    const xml = fs.readFileSync(path.join(directory, file), 'utf8');
    for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (isInternalPath(new URL(url).pathname)) fail(`Internal URL in ${file}: ${url}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assertSources();
  console.log('Publication inputs respect the internal/public folder boundary.');
}
