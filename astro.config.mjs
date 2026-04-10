import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

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
    inlineStylesheets: 'always',
  },
  redirects: {
    '/datadocks-vs/opendock': '/datadocks-vs-opendock',
    '/privacy-policy-datadocks': '/privacy-policy',
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
          }
        },
        'astro:build:done': async ({ dir }) => {
          const offlinePath = fileURLToPath(new URL('_offline_print', dir));
          if (fs.existsSync(offlinePath)) {
            fs.rmSync(offlinePath, { recursive: true, force: true });
          }
        }
      }
    },
    tailwind(), react(), keystatic(), sitemap({
      filter: (page) => !page.includes('/home-draft'),
      serialize(item) {
        // Add lastmod from post frontmatter if available
        const postDate = postDateMap.get(item.url);
        if (postDate) {
          item.lastmod = postDate.toISOString();
        }
        // Non-blog pages: omit lastmod entirely (absent is better than a build-date lie)
        return item;
      },
      customPages: [],
    }), mdx()],

});