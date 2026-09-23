import { fileURLToPath } from 'node:url';
import { assertSources, assertRoutes, assertPublicModule, assertOutput } from '../scripts/publication-boundary.mjs';

// Last integration: inspect final routes and output after all generators/cleanup.
export default function publicationBoundary() {
  let building = false;
  let root;
  return {
    name: 'publication-boundary',
    hooks: {
      'astro:config:setup': ({ command, config, updateConfig }) => {
        building = command === 'build';
        root = fileURLToPath(config.root);
        if (!building) return;
        assertSources(root);
        updateConfig({ vite: { plugins: [{
          name: 'reject-internal-production-imports',
          enforce: 'pre',
          load(id) { assertPublicModule(id, root); },
          generateBundle() {
            for (const id of this.getModuleIds()) assertPublicModule(id, root);
          },
        }] } });
      },
      'astro:routes:resolved': ({ routes }) => { if (building) assertRoutes(routes); },
      'astro:build:done': ({ dir, pages }) => { assertOutput(fileURLToPath(dir), pages); },
    },
  };
}
