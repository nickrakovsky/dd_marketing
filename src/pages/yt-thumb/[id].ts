/**
 * Same-origin YouTube thumbnail proxy.
 *
 * YouTube serves poster images from i.ytimg.com with only `Cache-Control:
 * max-age=7200` (2 hours), which trips PageSpeed's "Serve static assets with
 * an efficient cache policy" audit. We can't set a header on a domain we don't
 * own, so we fetch the image server-side and re-serve it from datadocks.com
 * with a 24-hour browser cache (and a longer edge cache via s-maxage).
 *
 * Usage (see src/lib/yt-thumb.ts):
 *   /yt-thumb/<videoId>            -> WebP sddefault (default), JPEG fallback
 *   /yt-thumb/<videoId>?q=sdwebp   -> vi_webp/sddefault.webp -> sddefault.jpg -> hqdefault.jpg
 *   /yt-thumb/<videoId>?q=maxres   -> maxresdefault.jpg -> sddefault.jpg -> hqdefault.jpg
 *   /yt-thumb/<videoId>?q=sd|mq|hq -> the matching JPEG (hq always exists)
 *
 * YouTube does NOT generate every variant for every video: maxresdefault and
 * the vi_webp WebP variants are frequently missing on older uploads and 404.
 * So each quality maps to an ORDERED fallback chain and we serve the first
 * variant that returns 200, terminating in hqdefault.jpg (which exists for
 * every valid video id). The fallback fetches happen server-side at the edge
 * on a cache miss — the browser always makes exactly one request to /yt-thumb/.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Every upstream variant we know how to fetch, keyed by a short "<name>.<ext>"
// token so we can derive the response Content-Type from the token.
const VARIANTS: Record<string, string> = {
  'hq.jpg': 'https://i.ytimg.com/vi/{id}/hqdefault.jpg',
  'mq.jpg': 'https://i.ytimg.com/vi/{id}/mqdefault.jpg',
  'sd.jpg': 'https://i.ytimg.com/vi/{id}/sddefault.jpg',
  'maxres.jpg': 'https://i.ytimg.com/vi/{id}/maxresdefault.jpg',
  'sd.webp': 'https://i.ytimg.com/vi_webp/{id}/sddefault.webp',
};

// Ordered fallback chains per requested quality. First 200 wins; hqdefault.jpg
// is the guaranteed terminal variant.
const CHAINS: Record<string, string[]> = {
  hq: ['hq.jpg'],
  mq: ['mq.jpg', 'hq.jpg'],
  sd: ['sd.jpg', 'hq.jpg'],
  maxres: ['maxres.jpg', 'sd.jpg', 'hq.jpg'],
  sdwebp: ['sd.webp', 'sd.jpg', 'hq.jpg'],
};

// YouTube video IDs are 11 chars of [A-Za-z0-9_-]. Reject anything else so we
// never proxy arbitrary URLs.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export const GET: APIRoute = async ({ params, url }) => {
  const id = params.id ?? '';
  if (!ID_RE.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  const q = url.searchParams.get('q') ?? 'hq';
  const chain = CHAINS[q] ?? CHAINS.hq;

  for (const variant of chain) {
    const upstreamUrl = VARIANTS[variant].replace('{id}', id);

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        headers: { 'User-Agent': 'DataDocks-Thumb-Proxy/1.0' },
        // Let Cloudflare cache the upstream fetch at the edge for a day too.
        cf: { cacheTtl: 86400, cacheEverything: true },
      } as RequestInit);
    } catch {
      continue; // network error on this variant — try the next in the chain
    }

    if (!upstream.ok) continue; // variant missing (usually 404) — fall through

    const contentType =
      upstream.headers.get('Content-Type') ||
      (variant.endsWith('.webp') ? 'image/webp' : 'image/jpeg');

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // 24h in the browser; 7d at the edge with stale-while-revalidate.
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // No variant in the chain returned 200 (invalid/removed video).
  return new Response('Not found', { status: 404 });
};
