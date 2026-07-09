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
 *   /yt-thumb/<videoId>            -> hqdefault.jpg
 *   /yt-thumb/<videoId>?q=maxres   -> maxresdefault.jpg
 *   /yt-thumb/<videoId>?q=sdwebp   -> vi_webp/sddefault.webp
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const UPSTREAM: Record<string, string> = {
  hq: 'https://i.ytimg.com/vi/{id}/hqdefault.jpg',
  mq: 'https://i.ytimg.com/vi/{id}/mqdefault.jpg',
  sd: 'https://i.ytimg.com/vi/{id}/sddefault.jpg',
  maxres: 'https://i.ytimg.com/vi/{id}/maxresdefault.jpg',
  sdwebp: 'https://i.ytimg.com/vi_webp/{id}/sddefault.webp',
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
  const template = UPSTREAM[q] ?? UPSTREAM.hq;
  const upstreamUrl = template.replace('{id}', id);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'DataDocks-Thumb-Proxy/1.0' },
      // Let Cloudflare cache the upstream fetch at the edge for a day too.
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit);
  } catch {
    return new Response('Upstream error', { status: 502 });
  }

  if (!upstream.ok) {
    return new Response('Not found', { status: 404 });
  }

  const contentType =
    upstream.headers.get('Content-Type') ||
    (q === 'sdwebp' ? 'image/webp' : 'image/jpeg');

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // 24h in the browser; 7d at the edge with stale-while-revalidate.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
