import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import mermaid from 'astro-mermaid';
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

          // Critical-CSS inlining for blog posts ONLY (dist/posts/*.html).
          // The site ships a single shared stylesheet (cssCodeSplit stays false).
          // On /posts/ pages that one file is render-blocking and delays LCP
          // (~577ms). Beasties inlines the above-the-fold CSS into <head> and
          // rewrites the <link> to load the SAME single file asynchronously, so
          // first paint no longer waits on it. Scoped to /posts/ so every other
          // page (home, features, etc.) is left byte-for-byte unchanged.
          const distDir = fileURLToPath(dir);
          const postsDistDir = path.join(distDir, 'posts');
          if (fs.existsSync(postsDistDir)) {
            const beasties = new Beasties({
              path: distDir,          // resolve /_astro/*.css from the build root
              publicPath: '/',
              preload: 'swap',        // async-load the full sheet, apply on load
              pruneSource: false,     // keep the shared external file intact for other pages
              inlineFonts: true,      // fonts already handled in Layout.astro
              logLevel: 'silent',
            });
            const postFiles = fs.readdirSync(postsDistDir).filter(f => f.endsWith('.html'));
            let processed = 0;
            for (const file of postFiles) {
              const filePath = path.join(postsDistDir, file);
              try {
                const html = fs.readFileSync(filePath, 'utf-8');
                const inlined = await beasties.process(html);
                fs.writeFileSync(filePath, inlined);
                processed++;
              } catch (err) {
                console.warn(`[critical-css] skipped ${file}: ${err.message}`);
              }
            }
            console.log(`[critical-css] inlined critical CSS for ${processed}/${postFiles.length} blog posts`);
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
      filter: (page) => !page.includes('/compare/opendock') && !page.includes('/videos/') && !page.includes('/micro-apps/') && !page.endsWith('/404') && !page.endsWith('/404/'),
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
    }), mermaid(), mdx()],

});