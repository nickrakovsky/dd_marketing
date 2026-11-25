import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import base from '../../astro.config.mjs';

const site = fileURLToPath(new URL('../../', import.meta.url));
const staging = fileURLToPath(new URL('../blog-staging/', import.meta.url));
const preview = {
  name: 'local-staging-preview',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/preview/staging', entrypoint: './internal/staging-preview/index.astro' });
      injectRoute({ pattern: '/preview/staging/[slug]', entrypoint: './internal/staging-preview/article.astro' });
    },
  },
};

export default {
  ...base,
  devToolbar: { enabled: false },
  vite: {
    ...base.vite,
    server: { fs: { allow: [site, fs.realpathSync(`${site}node_modules`), staging] }, strictPort: true },
  },
  integrations: [...base.integrations.slice(0, -1), preview, base.integrations.at(-1)],
};
