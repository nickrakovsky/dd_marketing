import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import Beasties from 'beasties';
import { BENTO_PARTYTOWN_FORWARD } from './src/lib/bento-config.mjs';

// Build a map of post slugs to their most recent date (updatedDate or pubDate)
const postsDir = path.resolve('./src/content/posts');
const postDateMap = new Map();
if (fs.existsSync(postsDir)) {
  for (const file of fs.readdirSync(postsDir)) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const { data } = matter(content);
    const slug = file.replace(/\.mdx?$/, '');
    const date = data.updatedDate ? new Date(data.updatedDate) : data.pubDate ? new Date(data.pubDate) : null;
    if (date && !isNaN(date.getTime())) {
      postDateMap.set(`https://datadocks.com/posts/${slug.toLowerCase()}`, date);
    }
  }
}

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
  }),

  site: 'https://datadocks.com',
  base: '/',
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssCodeSplit: false,
    },
    optimizeDeps: {
      exclude: ['@kobalte/core', '@kobalte/core/accordion'],
    },
    ssr: {
      noExternal: ['@kobalte/core'],
    },
  },
  redirects: {
    '/compare/opendock': '/datadocks-vs-opendock',
    '/datadocks-vs/opendock': '/datadocks-vs-opendock',
    '/privacy-policy-datadocks': '/privacy-policy',
    '/posts/yt-:id': '/videos/yt-:id',
    '/datadocks-features/live-editing': '/datadocks-features/access-anywhere',
    '/posts/what-is-a-yard-management-system-yms': '/yard-management',
    '/posts/yard-management-vs-dock-scheduling-vs-yms': '/yard-management',
    '/posts/crucial-components-to-successful-yard-management': '/posts/yard-management-process-flow',
    '/posts/how-shippers-and-receivers-are-eliminating-detention-and-demurrage-fees': '/posts/truck-detention-accessorial-fees',
  },

  integrations: [
    {
      name: 'dev-only-pages',
      hooks: {
        'astro:config:setup': ({ injectRoute, command }) => {
          if (command === 'dev') {
            injectRoute({
              pattern: '/sales-one-pager',
              entrypoint: './src/offline-pages/sales-one-pager.astro'
            });
            injectRoute({
              pattern: '/internal/marketing-pdf',
              entrypoint: './src/offline-pages/marketing-pdf.astro'
            });
            injectRoute({
              pattern: '/brand-book',
              entrypoint: './src/offline-pages/brand-book.astro'
            });
          }
        },
        'astro:build:done': async ({ dir }) => {
          const offlinePath = fileURLToPath(new URL('_offline_print', dir));
          if (fs.existsSync(offlinePath)) {
            fs.rmSync(offlinePath, { recursive: true, force: true });
          }

          // Cloudflare _routes.json has a 100-entry limit.
          // Collapse individual /posts/*, /integrations/*, /datadocks-features/* into wildcards.
          const routesPath = fileURLToPath(new URL('_routes.json', dir));
          if (fs.existsSync(routesPath)) {
            const routes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
            const wildcardPrefixes = ['/posts/', '/integrations/', '/datadocks-features/', '/benefits/'];
            routes.exclude = routes.exclude.filter(rule => {
              return !wildcardPrefixes.some(prefix => rule.startsWith(prefix));
            });
            wildcardPrefixes.forEach(prefix => {
              const wildcard = prefix + '*';
              if (!routes.exclude.includes(wildcard)) {
                routes.exclude.push(wildcard);
              }
            });
            fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2));
          }

          // ---------------------------------------------------------------
          // Critical-CSS inlining for EVERY prerendered page.
          //
          // The site ships ONE shared stylesheet (cssCodeSplit stays false):
          // ~163KB raw / ~20KB brotli. As a plain <link rel="stylesheet"> it is
          // render-blocking, so first paint cannot happen until it has been
          // requested, downloaded and parsed. On a real mobile connection that
          // is a whole extra round-trip after the HTML — measured at 1.6Mbps /
          // 150ms RTT / 6x CPU, a blog post went 660ms -> 1824ms FCP with the
          // blocking link instead of inlined critical CSS.
          //
          // This used to be scoped to /posts/ and /datadocks-features/ only,
          // which left the home page, /posts hub, /benefits/*, /integrations/*,
          // /videos/*, the keyword landing pages and every root-level page
          // blocking on that stylesheet — the slowest URLs on the site by a
          // wide margin. Beasties now runs over all of dist: it inlines the
          // above-the-fold CSS into <head> and rewrites the <link> to load the
          // SAME shared file asynchronously, so first paint never waits on it.
          //
          // `reduceInlineStyles: false` is required, not cosmetic:
          //   1. Layout.astro emits the real @font-face rules (Bruta,
          //      DD-Recoleta) and the metric-override fallback faces in an
          //      inline <style>. There is no external copy. With the default
          //      (true) Beasties treats that block as prunable and — because
          //      inlineFonts is false — deletes the faces outright, so the
          //      webfonts vanish, the Bruta preload goes unused, and text falls
          //      back to Georgia/Impact. Leaving inline styles alone keeps them.
          //   2. Feature pages inline pre-rendered diagram SVGs that each carry
          //      their own <style>. Hoisting those into a merged <head> block
          //      detaches diagram CSS from its SVG and mangles the diagrams.
          const distDir = fileURLToPath(dir);
          const beasties = new Beasties({
            path: distDir,          // resolve /_astro/*.css from the build root
            publicPath: '/',
            preload: 'swap',        // async-load the full sheet, apply on load
            pruneSource: false,     // keep the shared external file intact
            inlineFonts: false,     // fonts are handled in Layout.astro
            reduceInlineStyles: false, // never touch inline <style> — see above
            logLevel: 'silent',
          });

          const collectHtml = (dirPath) => {
            const out = [];
            for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
              const full = path.join(dirPath, entry.name);
              if (entry.isDirectory()) {
                out.push(...collectHtml(full));
              } else if (entry.name.endsWith('.html')) {
                out.push(full);
              }
            }
            return out;
          };

          const htmlFiles = collectHtml(distDir);
          let processed = 0;
          let alreadyAsync = 0;
          let missingRealFaces = 0;
          for (const filePath of htmlFiles) {
            const rel = path.relative(distDir, filePath);
            try {
              const html = fs.readFileSync(filePath, 'utf-8');
              // Nothing render-blocking left to fix (e.g. a page with no
              // stylesheet link at all) — leave it byte-for-byte unchanged.
              if (!/<link[^>]+rel="stylesheet"[^>]+href="\/_astro\//.test(html)) {
                alreadyAsync++;
                continue;
              }
              const inlined = await beasties.process(html);
              // Guard the font regression described above: the real webfont
              // faces must survive into the output. If they ever stop doing so,
              // fail loudly at build time instead of silently shipping
              // Georgia/Impact to every visitor.
              if (!/@font-face[^}]*url\(/.test(inlined)) missingRealFaces++;
              fs.writeFileSync(filePath, inlined);
              processed++;
            } catch (err) {
              console.warn(`[critical-css] skipped ${rel}: ${err.message}`);
            }
          }
          console.log(`[critical-css] inlined critical CSS for ${processed}/${htmlFiles.length} pages (${alreadyAsync} had no blocking stylesheet)`);
          if (missingRealFaces > 0) {
            console.warn(`[critical-css] WARNING: ${missingRealFaces} page(s) lost their real @font-face url() — check the Layout.astro font block and reduceInlineStyles`);
          }
        }
      }
    },
    partytown({
      config: {
        forward: BENTO_PARTYTOWN_FORWARD,
      },
    }),
    tailwind(),
    react({
      include: ['**/components/ui/**', '**/micro-apps/LTL*', '**/components/FAQ*', '**/components/CTA*', '**/components/Contact*', '**/components/Integrations*', '**/components/Nav*', '**/benefits/**', '**/home/Testimonials*', '**/hooks/**', '**/lib/utils*'],
    }),
    solid({
      include: ['**/solid/**', '**/node_modules/@kobalte/core/**'],
    }),
    keystatic(), sitemap({
      // Keyword landing pages are noindexed, so keep them out of the sitemap too.
      filter: (page) => !page.includes('/compare/opendock') && !page.includes('/videos/') && !page.includes('/micro-apps/') && !/\/(dock-scheduling|yard-management|warehouse-management|dock-management)-software/.test(page) && !page.includes('/outgrowing-opendock') && !page.endsWith('/404') && !page.endsWith('/404/'),
      serialize(item) {
        // Strip trailing slash from sitemap URLs (except homepage)
        if (item.url !== 'https://datadocks.com/' && item.url.endsWith('/')) {
          item.url = item.url.replace(/\/$/, '');
        }
        // Add lastmod from post frontmatter if available
        const postDate = postDateMap.get(item.url) || postDateMap.get(item.url + '/');
        if (postDate) {
          item.lastmod = postDate.toISOString();
        }
        // Non-blog pages: omit lastmod entirely (absent is better than a build-date lie)
        return item;
      },
      customPages: [
        'https://datadocks.com/yard-management',
        'https://datadocks.com/datadocks-features/dock-dashboard',
        'https://datadocks.com/datadocks-features/carrier-portal',
        'https://datadocks.com/datadocks-features/yard-management',
        'https://datadocks.com/datadocks-features/capacity-limits',
        'https://datadocks.com/datadocks-features/efficiency-reports',
        'https://datadocks.com/datadocks-features/custom-rules',
        'https://datadocks.com/datadocks-features/data-validation',
        'https://datadocks.com/datadocks-features/notifications',
        'https://datadocks.com/datadocks-features/live-editing',
        'https://datadocks.com/datadocks-features/access-anywhere',
        'https://datadocks.com/datadocks-features/integration',
        'https://datadocks.com/datadocks-features/documentation',
      ],
    }),
    // NOTE: the `astro-mermaid` integration was removed deliberately. It used
    // `injectScript('page', ...)`, which appends to the shared page entry chunk
    // and therefore shipped a mermaid loader + a style-injection script to EVERY
    // page on the site, not just the ones with diagrams. Feature-page diagrams
    // are now pre-rendered to static SVG by `npm run diagrams`. If mermaid
    // fences are ever needed in MDX, pre-render them the same way rather than
    // re-adding a global integration.
    mdx()],

});