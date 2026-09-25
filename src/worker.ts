import type { SSRManifest } from 'astro';
import { isInternalPath } from './lib/internal-paths.mjs';
import { createExports as createAstroExports } from '@astrojs/cloudflare/entrypoints/server.js';

export function createExports(manifest: SSRManifest) {
  const { default: worker } = createAstroExports(manifest);
  return {
    default: {
      async fetch(...args: Parameters<typeof worker.fetch>) {
        // Block private artifacts before the adapter's static-asset fallback.
        // Production Pages excludes Worker files; this also protects local Pages.
        const pathname = new URL(args[0].url).pathname;
        if (isInternalPath(pathname)) {
          return new Response('Not found', {
            status: 404,
            headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
          });
        }
        return worker.fetch(...args);
      },
    },
  };
}
