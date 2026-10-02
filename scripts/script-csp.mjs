import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const MARKER = '__DD_BUILD_SCRIPT_CSP__';
const JAVASCRIPT_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript', 'text/ecmascript', 'application/ecmascript']);

export function inlineScriptHashes(html) {
  const hashes = new Set();
  const visit = node => {
    if (node.tagName === 'script') {
      const attributes = Object.fromEntries(node.attrs.map(attribute => [attribute.name, attribute.value]));
      if (!('src' in attributes) && JAVASCRIPT_TYPES.has((attributes.type ?? '').trim().toLowerCase())) {
        const contents = (node.childNodes ?? []).map(child => child.value ?? '').join('');
        hashes.add(`sha256-${createHash('sha256').update(contents).digest('base64')}`);
      }
    }
    // Template content is inert and must not enlarge the executable allowlist.
    for (const child of node.childNodes ?? []) visit(child);
  };
  visit(parse(html));
  return [...hashes].sort();
}

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(filename) : [filename];
  });
}

export function buildScriptPolicy(hashes) {
  return `script-src 'self' ${[...new Set(hashes)].sort().map(hash => `'${hash}'`).join(' ')}; script-src-attr 'none'; worker-src 'self'`;
}

/** Hash reviewed build artifacts, never arbitrary request-time response HTML. */
export function prepareScriptPolicy(buildRoot) {
  const htmlFiles = filesIn(buildRoot).filter(file => file.endsWith('.html'));
  const hashes = htmlFiles.flatMap(file => inlineScriptHashes(fs.readFileSync(file, 'utf8')));
  const policy = buildScriptPolicy(hashes);
  const header = `  Content-Security-Policy: ${policy}`;
  if (header.length > 2000) {
    throw new Error('Trusted script CSP exceeds the Cloudflare Pages header limit. Externalize reviewed inline scripts; do not widen the policy.');
  }
  const headersFile = path.join(buildRoot, '_headers');
  const originalHeaders = fs.readFileSync(headersFile, 'utf8').replace(/^\s+Content-Security-Policy-Report-Only:[^\n]*\n/gmi, '\n');
  const staticPages = htmlFiles.filter(file => !path.relative(buildRoot, file).startsWith('_build/'));
  const rules = staticPages.map(file => {
    const pathname = '/' + path.relative(buildRoot, file).replaceAll(path.sep, '/').replace(/\.html$/, '').replace(/\/index$/, '');
    return `${pathname === '/index' ? '/' : pathname}\n${header}\n`;
  });
  const combinedHeaders = `${originalHeaders}\n# Generated document-only script CSP. Worker scripts retain their own execution context.\n${rules.join('\n')}`;
  if (combinedHeaders.split('\n').filter(line => line && !/^[\s#]/.test(line)).length > 100) {
    throw new Error('Trusted script CSP exceeds the Cloudflare Pages rule limit.');
  }
  fs.writeFileSync(headersFile, combinedHeaders);

  // The meta policy also protects the static 404 document served at unknown URLs.
  // No scripts, stylesheet priorities or cache directives are changed.
  for (const file of staticPages) {
    const html = fs.readFileSync(file, 'utf8');
    const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
    // Keep the charset in the first 1024 bytes and enforce before the first script.
    const charset = /<meta\b[^>]*\bcharset\s*=[^>]*>/i;
    const updated = charset.test(html) ? html.replace(charset, tag => `${tag}${meta}`)
      : html.replace(/<head\b[^>]*>/i, head => `${head}${meta}`);
    if (updated === html) throw new Error(`Missing document head: ${path.relative(buildRoot, file)}`);
    fs.writeFileSync(file, updated);
  }

  let replacements = 0;
  for (const file of filesIn(path.join(buildRoot, '_worker.js')).filter(file => /\.[cm]?js$/.test(file))) {
    const source = fs.readFileSync(file, 'utf8');
    const updated = source.replace(new RegExp(`(["'])${MARKER}\\1`, 'g'), () => {
      replacements++;
      return JSON.stringify(policy);
    });
    if (updated !== source) fs.writeFileSync(file, updated);
  }
  if (!replacements) throw new Error('Trusted script CSP placeholder was not found in the Worker.');
  console.log(`[script-csp] trusted ${new Set(hashes).size} inline scripts; enforced on ${staticPages.length} static documents and Worker HTML`);
  return policy;
}
