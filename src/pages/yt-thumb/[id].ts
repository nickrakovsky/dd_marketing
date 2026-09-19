/**
 * LEGACY YouTube thumbnail proxy: /yt-thumb/<videoId>?q=<quality>
 *
 * Superseded by /yt-thumb/<quality>/<videoId> (see ./[quality]/[id].ts). This
 * route stays because HTML emitted before the switch is edge-cached for up to
 * a month and still points here; removing it would 404 those posters.
 *
 * WARNING: the Cloudflare cache key for this path ignores `?q=`, so every
 * quality for a given video id collapses onto one cached object here. That is
 * the whole reason the canonical form puts the quality in the path. Do not
 * point new callers at this route — use ytThumb() from src/lib/yt-thumb.ts.
 */
import type { APIRoute } from 'astro';
import { serveThumb, DEFAULT_QUALITY } from '../../lib/yt-thumb-proxy';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const id = params.id ?? '';
  const quality = url.searchParams.get('q') ?? DEFAULT_QUALITY;
  return serveThumb(id, quality);
};
