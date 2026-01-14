import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // "PRODUCTION" CONFIGURATION BREAKS THE SITE::
  //site: 'https://datadocks.com',
  //base: '/',
  //GITHUB PAGES CONFIGURATION:
  site: 'https://nickrakovsky.github.io',
  base: '/dd_marketing',

  integrations: [
    tailwind(), 
    react()
  ],
});
