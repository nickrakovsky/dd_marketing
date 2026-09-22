import fs from 'node:fs';
import path from 'node:path';

const marker = '__PUBLICATION_CRITICAL_CSS__';
const styles = html => Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g), match => match[1]);

export function collectPublicationStyles(file, buildRoot, before, after, output) {
  const sampleRoot = path.join(buildRoot, '_build/publication');
  if (!file.startsWith(sampleRoot + path.sep)) return;
  const relative = path.relative(sampleRoot, file).replaceAll(path.sep, '/').replace(/\.html$/, '');
  const pathname = relative === 'home' ? '/' : relative === 'hub' ? '/posts' : `/${relative}`;
  const originalStyles = new Set(styles(before));
  output[pathname.toLowerCase()] = styles(after).filter(css => !originalStyles.has(css)).join('\n');
}

export function finishPublicationStyles(buildRoot, criticalByPath) {
  if (!criticalByPath['/'] || !criticalByPath['/posts']) {
    throw new Error('Missing publication critical CSS: build-only samples must be rendered and processed.');
  }
  let injected = 0;
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.js')) {
        const source = fs.readFileSync(file, 'utf8');
        // Replace the complete string literal, not source substrings containing it.
        const updated = source.replace(new RegExp(`(["'])${marker}\\1`, 'g'), () => {
          injected++;
          return JSON.stringify(JSON.stringify(criticalByPath));
        });
        if (updated !== source) fs.writeFileSync(file, updated);
      }
    }
  };
  visit(path.join(buildRoot, '_worker.js'));
  if (!injected) throw new Error('Publication critical CSS placeholder was not found in the Worker.');
  fs.rmSync(path.join(buildRoot, '_build'), { recursive: true, force: true });
  console.log(`[publication] preserved critical CSS for ${Object.keys(criticalByPath).length} routes; removed build-only HTML`);
}
