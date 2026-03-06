import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical URLs use datadocks.com for SEO
  site: 'https://datadocks.com',
  // Asset paths use /dd_marketing/ for GitHub Pages hosting
  base: '/dd_marketing',

  integrations: [tailwind(),
    react(),
   sitemap({
      // Strip /dd_marketing/ from sitemap URLs and ensure trailing slash
      serialize(item) {
        item.url = item.url.replace('/dd_marketing/', '/');
        // Ensure trailing slash for consistency with canonical URLs
        if (!item.url.endsWith('/') && !item.url.includes('.')) {
          item.url += '/';
        }
        return item;
      }
    })
  ],
});