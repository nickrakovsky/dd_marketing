import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import playformInline from '@playform/inline';
import fs from 'node:fs';
import path from 'node:path';
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
      postDateMap.set(`https://datadocks.com/posts/${slug}`, date);
    }
  }
}

// https://astro.build/config
export default defineConfig({

  site: 'https://datadocks.com',
  base: '/',
  trailingSlash: 'never',

  integrations: [tailwind(), react(), sitemap({
    filter: (page) => !page.includes('/home-draft'),
    serialize(item) {
      // Add lastmod from post frontmatter if available
      const postDate = postDateMap.get(item.url);
      if (postDate) {
        item.lastmod = postDate.toISOString();
      }
      return item;
    },
    customPages: [
      // Webflow pages not yet migrated to Astro
      'https://datadocks.com/datadocks-vs-opendock',
      'https://datadocks.com/datadocks-vs/opendock',
      'https://datadocks.com/support',
      'https://datadocks.com/integrations',
      'https://datadocks.com/integrations/microsoft-power-bi',
      'https://datadocks.com/integrations/microsoft-sso-entra',
      'https://datadocks.com/integrations/netsuite-erp',
      'https://datadocks.com/integrations/oracle-fusion-cloud',
      'https://datadocks.com/integrations/sap-business-bydesign',
      'https://datadocks.com/integrations/sap-s-4hana',
      'https://datadocks.com/datadocks-features/access-anywhere',
      'https://datadocks.com/datadocks-features/capacity-limits',
      'https://datadocks.com/datadocks-features/carrier-portal',
      'https://datadocks.com/datadocks-features/custom-rules',
      'https://datadocks.com/datadocks-features/data-validation',
      'https://datadocks.com/datadocks-features/dock-dashboard',
      'https://datadocks.com/datadocks-features/documentation',
      'https://datadocks.com/datadocks-features/efficiency-reports',
      'https://datadocks.com/datadocks-features/integration',
      'https://datadocks.com/datadocks-features/live-editing',
      'https://datadocks.com/datadocks-features/notifications',
      'https://datadocks.com/datadocks-features/yard-management',
    ],
  }), mdx(), playformInline()],

});