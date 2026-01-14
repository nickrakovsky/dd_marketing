import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // PRODUCTION CONFIGURATION:
  site: 'https://datadocks.com',
  base: '/',
  //TEST CONFIGURATION FOR GITHUB PAGES:
  //site: 'https://nickrakovsky.github.io',
  //base: '/dd_marketing',

  integrations: [
    tailwind(), 
    react()
  ],
});
