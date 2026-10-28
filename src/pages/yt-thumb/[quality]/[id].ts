/**
 * Canonical YouTube thumbnail proxy: /yt-thumb/<quality>/<videoId>
 *
 * The quality is a PATH segment, not a query parameter, because the Cloudflare
 * cache key for this route ignores the query string — see the comment in
 * src/lib/yt-thumb-proxy.ts for the measured collision that caused.
 *
 * Unknown qualities 404 rather than falling back. Every distinct path is a
 * distinct cache key, so silently accepting arbitrary values would let anyone
 * inflate the edge cache with unbounded junk keys for a valid video id.
 * (The legacy ../[id].ts route keeps its permissive fallback: its cache key
 * ignores the query string anyway, so bad values there create no new entries.)
 */
import type { APIRoute } from 'astro';
import { serveThumb, isKnownQuality, isValidId } from '../../../lib/yt-thumb-proxy';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  const quality = params.quality ?? '';

  if (!isValidId(id) || !isKnownQuality(quality)) {
    return new Response('Not found', { status: 404 });
  }

  return serveThumb(id, quality);
};
