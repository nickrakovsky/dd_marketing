import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({

  site: 'https://datadocks.com',
  base: '/',

  integrations: [tailwind(), react(), sitemap({
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
  }), mdx()],

});