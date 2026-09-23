import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInternalPath } from '../src/lib/internal-paths.mjs';

export const projectRoot = fileURLToPath(new URL('..', import.meta.url));
export const readManifest = (root = projectRoot) => JSON.parse(fs.readFileSync(path.join(root, 'config/publication-manifest.json'), 'utf8'));
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

export function assertSources(root = projectRoot, manifest = readManifest(root)) {
  for (const [directory, approved] of [
    ['src/pages', manifest.pageEntrypoints.map(file => file.replace(/^src\/pages\//, ''))],
    ['public', manifest.publicAssets],
    ['src/content', manifest.contentFiles],
    ['src/assets', manifest.sourceAssets],
  ]) {
    const actual = filesIn(path.join(root, directory));
    for (const file of actual) {
      if (!approved.includes(file)) fail(`Unapproved public file: ${directory}/${file}. Keep internal work in internal/; public additions require a reviewed manifest entry.`);
      if (isInternalPath('/' + file.replace(/\.(astro|tsx?|jsx?|mdx?)$/, ''))) fail(`Reserved internal path in ${directory}: ${file}`);
    }
    for (const file of approved) {
      if (!actual.includes(file)) fail(`Stale manifest entry: ${directory}/${file}`);
    }
    if (new Set(approved).size !== approved.length) fail(`Duplicate manifest entries for ${directory}`);
  }
  // Vite's realpath resolution must not turn a public import into private input.
  filesIn(path.join(root, 'src'));
}

export function assertRoutes(routes, manifest = readManifest()) {
  for (const route of routes) {
    if (route.pattern === '/_build/publication/[...path]' && route.entrypoint === 'src/build-pages/publication-artifacts.astro') continue;
    if (isInternalPath(route.pattern)) fail(`Internal production route: ${route.pattern}`);
    if (route.type === 'redirect') continue; // Explicit redirects in astro.config.mjs.
    if (manifest.pageEntrypoints.includes(route.entrypoint)) continue;
    if (manifest.integrationRoutes.includes(route.pattern)) continue;
    fail(`Unapproved production route: ${route.pattern} (${route.entrypoint})`);
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
    const allowed = ['src/', 'node_modules/', '.astro/'].some(prefix => relative.startsWith(prefix))
      || relative === 'keystatic.config.ts'
      || (relative.startsWith('public/') && readManifest(root).publicAssets.includes(relative.slice(7)));
    if (!allowed) fail(`Production import outside approved source roots: ${id}`);
  }
}

export function assertOutput(directory, pages, manifest = readManifest()) {
  const html = new Set(pages.map(({ pathname }) => {
    const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
    return clean ? `${clean}.html` : 'index.html';
  }));
  const generated = new Set(['_headers', '_redirects', '_routes.json', 'sitemap-index.xml', 'sitemap-0.xml', 'sitemap.xml']);
  for (const file of filesIn(directory)) {
    // Worker files are server code, never static assets on Pages.
    if (file.startsWith('_worker.js/')) continue;
    if (isInternalPath('/' + file)) fail(`Internal artifact in deployment output: ${file}`);
    if (manifest.publicAssets.includes(file) || html.has(file) || generated.has(file)) continue;
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
  console.log('Publication inputs match the public manifest.');
}
