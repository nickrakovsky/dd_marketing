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
      // Strip /dd_marketing/ and trailing slashes from sitemap URLs
      serialize(item) {
        item.url = item.url.replace('/dd_marketing/', '/').replace(/\/$/, '');
        // Keep root URL with slash
        if (item.url === '') item.url = '/';
        return item;
      }
    })
  ],
});