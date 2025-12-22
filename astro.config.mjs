import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // ADD THIS LINE:
  site: 'https://datadocks.com',

  integrations: [
    tailwind(), 
    react()
  ],

  adapter: vercel()
});