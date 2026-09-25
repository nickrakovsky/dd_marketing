import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function internalWorkspace() {
  let enabled = false;
  const assets = fileURLToPath(new URL('../internal/assets/', import.meta.url));
  const pages = {
    '/preview/daily-blog/home': 'daily-blog-home-preview.astro',
    '/preview/daily-blog/posts': 'daily-blog-posts-preview.astro',
    '/sales-one-pager': 'sales-one-pager.astro',
    '/internal/marketing-pdf': 'marketing-pdf.astro',
    '/brand-book': 'brand-book.astro',
    '/solid-test': 'solid-test.astro',
    '/wireframes': 'wireframes/index.astro',
    ...Object.fromEntries(['editorial-bento', 'sidebar-engine', 'split-stream', 'tabbed-hub']
      .map(name => [`/wireframes/${name}`, `wireframes/${name}.astro`])),
  };
  return {
    name: 'internal-workspace',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        enabled = command === 'dev';
        if (!enabled) return;
        for (const [pattern, file] of Object.entries(pages)) {
          injectRoute({ pattern, entrypoint: `./internal/pages/${file}` });
        }
      },
      'astro:config:done': ({ config }) => {
        if (enabled && ![false, 'localhost', '127.0.0.1', '::1'].includes(config.server.host)) {
          throw new Error('The internal workspace is local-only. Do not expose astro dev with --host; use a production build for shared previews.');
        }
      },
      'astro:server:setup': ({ server }) => {
        if (!enabled) return;
        server.middlewares.use((request, response, next) => {
          let pathname;
          try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
          catch { response.statusCode = 400; response.end(); return; }
          if (!pathname.startsWith('/__internal/assets/')) return next();
          response.setHeader('X-Robots-Tag', 'noindex, nofollow');
          response.setHeader('Cache-Control', 'no-store');
          const file = path.resolve(assets, pathname.slice('/__internal/assets/'.length));
          if (!file.startsWith(assets) || !fs.existsSync(file)
            || !fs.realpathSync(file).startsWith(assets) || !fs.statSync(file).isFile()) {
            response.statusCode = 404; response.end(); return;
          }
          const types = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };
          response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
          fs.createReadStream(file).pipe(response);
        });
      },
    },
  };
}
