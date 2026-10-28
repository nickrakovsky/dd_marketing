#!/usr/bin/env node
// Check publishing payloads against the existing site's parsers; never assign dates.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let site;
let baseRef = 'origin/main';
const folders = [];
for (let i = 0; i < args.length; i++) {
  if (['--site', '--base-ref'].includes(args[i])) {
    const option = args[i];
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${option} requires a value`);
    if (option === '--site') site = path.resolve(args[++i]);
    else baseRef = args[++i];
  } else if (args[i].startsWith('--')) throw new Error(`Unknown option: ${args[i]}`);
  else folders.push(path.resolve(args[i]));
}
site ??= root;
const require = createRequire(path.join(site, 'package.json'));
const matter = require('gray-matter');
const ts = require('typescript');
const { transform, parse } = await import(require.resolve('@astrojs/compiler'));
const { compile } = await import(require.resolve('@mdx-js/mdx'));
const errors = [];
const fail = (file, message) => errors.push(`${path.relative(root, file)}: ${message}`);
const read = file => fs.readFileSync(file, 'utf8');
const walk = (node, visit) => { visit(node); for (const child of node.children ?? []) walk(child, visit); };
function checkCitation(file, node) {
  const parts = [];
  walk(node, child => { if (['text', 'inlineCode'].includes(child.type)) parts.push(child.value); });
  const label = parts.join('').trim();
  if (/^(?:https?:\/\/|www\.)\S+$/i.test(label)) fail(file, 'URL-only citation label; use readable source text');
  if (/&(?:#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/i.test(label)) fail(file, 'citation displays a literal HTML entity; use the intended character');
}
function isExternal(href) {
  if (typeof href !== 'string') return false;
  try { const url = new URL(href, 'https://datadocks.com'); return /^https?:$/.test(url.protocol) && !['datadocks.com', 'www.datadocks.com'].includes(url.hostname); } catch { return false; }
}
const syntax = (file, text) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
const known = new Set();
function findComponents(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText() === 'mdxComponents' && ts.isObjectLiteralExpression(node.initializer)) {
    for (const property of node.initializer.properties) if (property.name) known.add(property.name.getText().replace(/^['"]|['"]$/g, ''));
  }
  ts.forEachChild(node, findComponents);
}
findComponents(syntax('keystatic.config.ts', read(path.join(site, 'keystatic.config.ts'))));
if (!known.size) throw new Error('Cannot find the site’s mdxComponents map');
if (!folders.length) {
  const staging = path.join(root, 'internal/blog-staging');
  for (const entry of fs.readdirSync(staging, { withFileTypes: true })) {
    if (entry.isDirectory()) folders.push(path.join(staging, entry.name));
    else if (entry.name !== 'README.md') fail(path.join(staging, entry.name), 'only post folders and the shared README belong in staging');
  }
}
if (!folders.length) {
  console.log('Staging queue is empty; scheduled posts live in src/content/posts.');
  process.exit(0);
}
const slugs = new Map();
const titles = new Map();
const siteSlugs = new Map();
const postsDirectory = path.join(site, 'src/content/posts');
const git = (...args) => execFileSync('git', ['-C', site, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
let baseline;
try { baseline = git('rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`).trim(); } catch { /* A source export may have no Git history. */ }
console.log(`Slug collision baseline: ${baseline ? `${baseRef}@${baseline.slice(0, 8)}` : `checkout files at ${site} (${baseRef} unavailable)`}; local snapshot, no fetch.`);
const postNames = baseline ? git('ls-tree', '-r', '--name-only', '-z', baseline, '--', 'src/content/posts').split('\0').filter(Boolean)
  : fs.readdirSync(postsDirectory, { recursive: true }).map(name => `src/content/posts/${name}`);
for (const name of postNames) {
  if (!/\.mdx?$/.test(name)) continue;
  const file = path.join(site, name);
  siteSlugs.set(path.basename(name).replace(/\.mdx?$/, ''), file);
  const { data } = matter(baseline ? git('show', `${baseline}:${name}`) : read(file));
  if (typeof data.slug === 'string') siteSlugs.set(data.slug, file);
}
const componentNames = new Map();
for (const folder of folders) {
  const files = [];
  function inventory(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) fail(file, 'symlinks are not publishing assets');
      else if (entry.isDirectory()) inventory(file);
      else files.push(file);
    }
  }
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) { fail(folder, 'package directory missing'); continue; }
  inventory(folder);
  const articles = files.filter(file => path.dirname(file) === folder && file.endsWith('.mdx'));
  const used = new Set(articles);
  const components = new Map(files.filter(file => path.dirname(file) === folder && /^[A-Z]\w*\.astro$/.test(path.basename(file)))
    .map(file => [path.basename(file, '.astro'), file]));
  for (const [name, file] of components) {
    if (componentNames.has(name)) fail(file, `duplicate component name also in ${path.relative(root, componentNames.get(name))}`);
    componentNames.set(name, file);
  }
  if (articles.length !== 1) fail(folder, 'expected exactly one <slug>.mdx article');
  for (const file of files) {
    const rel = path.relative(folder, file);
    const allowed = (path.dirname(file) === folder && /\.(mdx|astro|css)$/.test(file)) || /^assets\/.+\.(svg|png|jpe?g|webp|avif|gif)$/i.test(rel);
    if (!allowed || /(?:^|\/)(?:logo|wordmark|preview|poster|fallback)[-.]/i.test(rel)) fail(file, 'unexpected baggage; keep only article, components and required unique assets');
  }
  function dependency(file, ref) {
    if (!ref || /^(?:[a-z][\w+.-]*:|#|\/\/)/i.test(ref)) return;
    const clean = ref.split(/[?#]/)[0];
    const siteImage = file.endsWith('.mdx') && clean.startsWith('../../assets/blog-images/');
    const base = siteImage ? path.join(site, 'src/content/posts') : path.dirname(file);
    const boundary = ref.startsWith('/') ? path.join(site, 'public') : siteImage ? path.join(site, 'src/assets/blog-images') : folder;
    const target = ref.startsWith('/') ? path.join(site, 'public', clean.slice(1)) : path.resolve(base, clean);
    if (!target.startsWith(boundary + path.sep)) { fail(file, `dependency leaves ${siteImage ? 'site image directory' : ref.startsWith('/') ? 'site public directory' : 'package'}: ${ref}`); return; }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) fail(file, `missing dependency: ${ref}`);
    else used.add(target);
  }
  for (const file of articles) {
    const slug = path.basename(file, '.mdx');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(file, 'filename must be a lowercase hyphenated slug');
    if (slugs.has(slug)) fail(file, `duplicate slug also in ${path.relative(root, slugs.get(slug))}`);
    if (siteSlugs.has(slug)) fail(file, `slug "${slug}" already belongs to ${path.relative(site, siteSlugs.get(slug))}`);
    slugs.set(slug, file);
    try {
      const { data, content, matter: frontmatter } = matter(read(file));
      if (typeof data.title !== 'string' || !data.title.trim()) fail(file, 'title is required');
      else {
        const title = data.title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        if (titles.has(title)) fail(file, `duplicate normalized title also in ${path.relative(root, titles.get(title))}`);
        titles.set(title, file);
      }
      if ('slug' in data && data.slug !== slug) fail(file, `frontmatter slug must match filename "${slug}"`);
      if (/[\uE200\uE201\uE202]|:codex-(?:file-)?citation\b|\bturn\d+(?:search|view|fetch|file)\d+\b|oaicite:|contentReference\[/i.test(content)) fail(file, 'unresolved tool citation marker; replace it with a verified SmartLink citation');
      if (!['Nick Rakovsky', 'DataDocks Team'].includes(data.author)) fail(file, 'author must be Nick Rakovsky or DataDocks Team');
      if (data.category !== undefined && (typeof data.category !== 'string' || !data.category.trim())) fail(file, 'category must be nonempty text');
      if ('pubDate' in data) {
        const raw = frontmatter.match(/^pubDate:\s*([^\n#]+)/m)?.[1].trim().replace(/^['"]|['"]$/g, '') ?? '';
        const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(raw);
        if (!iso || !Number.isFinite(Date.parse(raw)) || Number(iso[3]) > new Date(Date.UTC(+iso[1], +iso[2], 0)).getUTCDate()) fail(file, 'pubDate must be a valid ISO date; omit it when unscheduled');
      }
      await compile(content, { remarkPlugins: [() => tree => {
        const definitions = new Map();
        walk(tree, node => { if (node.type === 'definition') definitions.set(node.identifier, node.url); });
        return walk(tree, node => {
        if (node.type === 'mdxjsEsm') fail(file, 'MDX import/export is unsupported by the CMS');
        if (['mdxTextExpression', 'mdxFlowExpression'].includes(node.type)) fail(file, 'MDX expressions are unsupported by the CMS');
        if (['link', 'linkReference'].includes(node.type) || node.name === 'BibliographyItem') checkCitation(file, node);
        if (isExternal(node.type === 'link' ? node.url : node.type === 'linkReference' ? definitions.get(node.identifier) : undefined)) fail(file, 'external Markdown citation needs SmartLink with verified href, standalone title, publication/year snippet and preserved anchorText');
        if (node.type === 'image') dependency(file, node.url);
        if (!node.type.startsWith('mdxJsx') || !node.name) return;
        if (['script', 'style', 'html', 'head', 'body', 'title', 'meta', 'link', 'iframe'].includes(node.name)) fail(file, `article must not contain <${node.name}>`);
        else if (components.has(node.name)) used.add(components.get(node.name));
        else if (!known.has(node.name)) fail(file, `unregistered component <${node.name}>; supply a colocated .astro file`);
        const props = {};
        for (const attr of node.attributes ?? []) {
          if (attr.type === 'mdxJsxExpressionAttribute' || /^on(?:click|change|input|submit|load|error|key|mouse|pointer|touch|focus|blur)/i.test(attr.name ?? '')) fail(file, 'JavaScript attributes are unsupported by the CMS');
          let value = attr.value;
          if (value?.type === 'mdxJsxAttributeValueExpression') {
            try { value = JSON.parse(value.value); } catch { fail(file, 'attribute expressions must contain JSON literals, not executable JavaScript'); }
          }
          if (attr.name) props[attr.name] = value;
          if (node.name === 'SmartLink' && ['anchorText', 'title', 'snippet'].includes(attr.name) && typeof value === 'string') checkCitation(file, { type: 'text', value });
          if (attr.name === 'src' && typeof value === 'string') dependency(file, value);
        }
        if (node.name === 'SmartLink' && isExternal(props.href)) {
          const missing = ['title', 'snippet', 'anchorText'].filter(key => typeof props[key] !== 'string' || !props[key].trim());
          if (missing.length) fail(file, `external SmartLink needs nonempty ${missing.join(', ')}; verify source metadata and preserve the prose`);
        }
      }); }] });
    } catch (error) { fail(file, `invalid article: ${error.message.split('\n')[0]}`); }
  }
  for (const file of files.filter(file => /\.(astro|css)$/.test(file))) {
    const text = read(file);
    if (/@font-face\b/i.test(text)) fail(file, 'use the site’s existing font declarations');
    for (const match of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"]/g)) dependency(file, match[1] ?? match[2]);
    if (!file.endsWith('.astro')) continue;
    try {
      const result = await transform(text, { filename: file });
      for (const diagnostic of result.diagnostics.filter(item => item.severity === 1)) fail(file, diagnostic.text);
      for (const diagnostic of syntax(file + '.ts', result.code).parseDiagnostics) fail(file, `invalid Astro expression: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
      const { ast } = await parse(text);
      walk(ast, node => {
        if (node.type === 'doctype' || ['html', 'head', 'body'].includes(node.name?.toLowerCase())) fail(file, 'components must be fragments without a page shell');
        if (node.name?.toLowerCase() === 'script') {
          if (node.attributes.length) fail(file, 'component scripts must use a plain <script> bundled by Astro; script attributes are unsupported');
          const clientSource = (node.children ?? []).map(child => child.value ?? '').join('');
          const client = syntax(file + '.client.ts', clientSource);
          for (const diagnostic of client.parseDiagnostics) fail(file, `invalid component script: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
          function checkClientImports(item) {
            if (ts.isImportDeclaration(item) || ts.isImportEqualsDeclaration(item) || (ts.isExportDeclaration(item) && item.moduleSpecifier)
              || (ts.isCallExpression(item) && (item.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(item.expression) && item.expression.text === 'require')))) {
              fail(file, 'component scripts must be self-contained; module dependencies are unsupported in staged client scripts');
            }
            ts.forEachChild(item, checkClientImports);
          }
          checkClientImports(client);
        }
        for (const attr of node.attributes ?? []) if (['src', 'poster'].includes(attr.name) && attr.kind === 'quoted') dependency(file, attr.value);
        if (node.type !== 'frontmatter') return;
        for (const statement of syntax(file + '.ts', node.value).statements) {
          if (!ts.isImportDeclaration(statement)) continue;
          const ref = statement.moduleSpecifier.text;
          if (ref.startsWith('.')) dependency(file, ref);
          else { try { require.resolve(ref); } catch { fail(file, `unavailable module: ${ref}`); } }
        }
      });
    } catch (error) { fail(file, `invalid Astro component: ${error.message.split('\n')[0]}`); }
  }
  for (const file of files) if (!used.has(file) && /\.(astro|css|svg|png|jpe?g|webp|avif|gif)$/i.test(file)) fail(file, 'unused publishing file');
}
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`Staging check failed: ${errors.length} issue(s).`);
  process.exitCode = 1;
} else console.log(`Staging check passed: ${folders.length} package(s). Publication dates are not changed.`);
