import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // ADD THIS LINE:
  //site: 'https://datadocks.com',
  //base: '/',
  site: 'https://datadocks.com',
  base: '/benefits/see-everything-now',

  integrations: [
    tailwind(), 
    react()
  ],
});
