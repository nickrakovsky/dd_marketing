import type { SSRManifest } from 'astro';
import { isInternalPath } from './lib/internal-paths.mjs';
import { CAMPAIGN_ROBOTS, isCampaignLandingPath } from './lib/campaign-pages.mjs';
import { createExports as createAstroExports } from '@astrojs/cloudflare/entrypoints/server.js';

export function createExports(manifest: SSRManifest) {
  const { default: worker } = createAstroExports(manifest);
  return {
    default: {
      async fetch(...args: Parameters<typeof worker.fetch>) {
        // Block private artifacts before the adapter's static-asset fallback.
        // Production Pages excludes Worker files; this also protects local Pages.
        const url = new URL(args[0].url);
        const pathname = url.pathname;
        if (isInternalPath(pathname)) {
          return new Response('Not found', {
            status: 404,
            headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
          });
        }
        // These prerendered redirects also match /posts/* Worker routing.
        // The adapter's ASSETS.fetch follows them internally and serves a 200
        // duplicate, so return the redirect before entering its asset fallback.
        const legacyPath = pathname.replace(/\/$/, '');
        if (legacyPath === '/posts/comparison' || legacyPath === '/posts/datadocks-vs-opendock') {
          url.pathname = legacyPath.slice('/posts'.length);
          return new Response(null, {
            status: 301,
            headers: { Location: url.href },
          });
        }
        const response = await worker.fetch(...args);
        if (!isCampaignLandingPath(pathname)) return response;
        // Cover redirects and adapter/static fallback responses as well as SSR.
        const headers = new Headers(response.headers);
        headers.set('X-Robots-Tag', CAMPAIGN_ROBOTS);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      },
    },
  };
}
