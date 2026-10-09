import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { CAMPAIGN_PATHS, isCampaignLandingPath } from '../src/lib/campaign-pages.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const site = 'https://datadocks.com';
const ownHosts = new Set(['datadocks.com', 'www.datadocks.com']);
const fail = (file, detail) => { throw new Error(`[campaign-isolation] ${file}: ${detail}`); };

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) fail(file, 'Cannot audit a symlink');
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function decode(value) {
  for (let i = 0; i < 4; i++) {
    const next = value.replace(/(?:%[\da-f]{2})+/gi, encoded => {
      try { return decodeURIComponent(encoded); } catch { return encoded; }
    }).replace(/\\(?:u00|x)([\da-f]{2})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&#(?:x([\da-f]+)|(\d+));?/gi, (entity, hex, decimal) => {
        const code = parseInt(hex || decimal, hex ? 16 : 10);
        return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
      });
    if (next === value) break;
    value = next;
  }
  return value;
}

function hasCampaignReference(source) {
  // Also catch a route assembled from adjacent literal pieces in UI code.
  const expanded = decode(source).replace(/\$\{\s*(['"])(.*?)\1\s*\}/g, '$2')
    .replace(/['"`]\s*\+\s*['"`]/g, '').toLowerCase();
  return CAMPAIGN_PATHS.some(route => expanded.includes(route.slice(1)));
}

/** Public source must not add paid destinations to navigation or discovery. */
export function assertCampaignSources(root = projectRoot) {
  const allowed = new Set([
    'src/lib/campaign-pages.mjs', 'public/_headers',
    ...CAMPAIGN_PATHS.map(route => `src/pages${route}.astro`),
  ]);
  for (const directory of ['src', 'public']) {
    for (const file of filesIn(path.join(root, directory))) {
      const relative = path.relative(root, file).split(path.sep).join('/');
      if (allowed.has(relative) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relative)) continue;
      if (!/\.(?:astro|[cm]?[jt]sx?|html?|mdx?|json|xml|svg|txt|ya?ml|webmanifest|css)$/.test(file)
        && !path.basename(file).startsWith('_')) continue;
      if (hasCampaignReference(fs.readFileSync(file, 'utf8'))) {
        fail(relative, 'Paid campaign URL reference in public source');
      }
    }
  }
}

function artifactPath(relative) {
  let route = relative.replace(/\.html?$/, '');
  if (route.startsWith('_build/publication/')) {
    route = route.slice('_build/publication/'.length);
    if (route === 'home') return '/';
    if (route === 'hub') return '/posts';
  }
  return '/' + route.replace(/(?:^|\/)index$/, '');
}

const normalizedPath = value => decode(value).replaceAll('\\', '/').replace(/\/+/g, '/')
  .toLowerCase().replace(/\.html(?=\/|$)/g, '').replace(/\/$/, '') || '/';

function assertUrl(value, base, file) {
  if (typeof value !== 'string' || !value.trim()) return;
  let url;
  try { url = new URL(value.trim(), base); } catch { return; }
  if (!ownHosts.has(url.hostname) || !isCampaignLandingPath(url.pathname)) return;
  // A campaign document may identify itself, but no other document may link in.
  if (isCampaignLandingPath(base.pathname) && normalizedPath(url.pathname) === normalizedPath(base.pathname)) return;
  fail(file, `Inbound reference to paid campaign: ${value}`);
}

function assertHtml(html, relative) {
  const base = new URL(artifactPath(relative), site);
  const visitValue = value => {
    if (typeof value === 'string') assertUrl(value, base, relative);
    else if (value && typeof value === 'object') Object.values(value).forEach(visitValue);
  };
  const text = node => (node.childNodes || []).map(child => child.value || text(child)).join('');
  const visit = node => {
    const attrs = Object.fromEntries((node.attrs || []).map(attribute => [attribute.name, attribute.value]));
    for (const name of ['href', 'src', 'action']) {
      if (attrs[name]) assertUrl(attrs[name], base, relative);
    }
    if (node.tagName === 'base' && attrs.href) {
      try { base.href = new URL(attrs.href, base).href; } catch { /* Invalid bases do not resolve links. */ }
    }
    if (node.tagName === 'meta' && attrs.content) {
      const refresh = attrs.content.match(/(?:^|;)\s*url\s*=\s*["']?([^"']+)/i);
      assertUrl(refresh ? refresh[1] : attrs.content, base, relative);
    }
    if (node.tagName === 'script' && attrs.type?.toLowerCase() === 'application/ld+json') {
      try { visitValue(JSON.parse(text(node))); }
      catch (error) {
        if (error.message.startsWith('[campaign-isolation]')) throw error;
        if (hasCampaignReference(text(node)) && !isCampaignLandingPath(base.pathname)) {
          fail(relative, 'Campaign reference in malformed structured data');
        }
      }
    }
    for (const child of node.childNodes || []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parse(html));
}

/** Call before render-sample cleanup and again after sitemap generation. */
export function assertCampaignOutput(buildRoot) {
  for (const file of filesIn(buildRoot)) {
    const relative = path.relative(buildRoot, file).split(path.sep).join('/');
    if (/^(?:_worker\.js|_astro|~partytown)\//.test(relative)
      || ['_headers', '_routes.json'].includes(relative)) continue;
    if (/\.html?$/.test(file)) assertHtml(fs.readFileSync(file, 'utf8'), relative);
    else if (/\.(?:xml|svg|txt|json|webmanifest)$/.test(file) || relative === '_redirects') {
      if (hasCampaignReference(fs.readFileSync(file, 'utf8'))) {
        fail(relative, 'Paid campaign URL leaked into a sitemap, feed or discovery artifact');
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assertCampaignSources();
  console.log('Campaign destinations are isolated from public discovery sources.');
}
