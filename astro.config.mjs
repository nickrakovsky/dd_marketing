import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // "PRODUCTION" CONFIGURATION BREAKS THE SITE::
  //site: 'https://datadocks.com',
  //base: '/',
  //GITHUB PAGES CONFIGURATION:
  site: 'https://nickrakovsky.github.io',
  base: '/dd_marketing',

  integrations: [tailwind(), 
    react(), 
   sitemap({
      // 2. THE FIX: Manually rewrite URLs for the sitemap only
      serialize(item) {
        // Replace the GitHub URL with the Production URL
        item.url = item.url.replace(
          'https://nickrakovsky.github.io/dd_marketing', 
          'https://datadocks.com'
        );
        return item;
      }
    })
  ],
});