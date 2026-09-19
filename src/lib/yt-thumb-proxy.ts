/**
 * Shared implementation for the YouTube thumbnail proxy routes.
 *
 * YouTube serves poster images from i.ytimg.com with only `Cache-Control:
 * max-age=7200` (2 hours), which trips PageSpeed's "Serve static assets with
 * an efficient cache policy" audit. We can't set a header on a domain we don't
 * own, so we fetch the image server-side and re-serve it from datadocks.com
 * with a long browser + edge cache.
 *
 * YouTube does NOT generate every variant for every video: maxresdefault and
 * the vi_webp WebP variants are frequently missing on older uploads and 404.
 * So each quality maps to an ORDERED fallback chain and we serve the first
 * variant that returns 200, terminating in hqdefault.jpg (which exists for
 * every valid video id). The fallback fetches happen server-side at the edge
 * on a cache miss — the browser always makes exactly one request.
 *
 * WHY THE QUALITY LIVES IN THE URL PATH (see src/pages/yt-thumb/):
 * The Cloudflare cache key for this route ignores the query string, so the
 * original `/yt-thumb/<id>?q=<quality>` form collapsed every quality for a
 * given video id onto ONE cached object — verified live: cache-busted requests
 * for ?q=maxres, ?q=maxreswebp and ?q=sdwebp all returned the byte-identical
 * 53,552-byte WebP, though sdwebp should be 23.4 KB. Whichever variant
 * populated the cache first was then served to every caller, so a page asking
 * for a large 16:9 poster could be handed a small 4:3 one (or vice versa).
 * Putting the quality in the path gives each variant its own cache key.
 */

// Every upstream variant we know how to fetch, keyed by a short "<name>.<ext>"
// token so we can derive the response Content-Type from the token.
const VARIANTS: Record<string, string> = {
  'hq.jpg': 'https://i.ytimg.com/vi/{id}/hqdefault.jpg',
  'mq.jpg': 'https://i.ytimg.com/vi/{id}/mqdefault.jpg',
  'sd.jpg': 'https://i.ytimg.com/vi/{id}/sddefault.jpg',
  'maxres.jpg': 'https://i.ytimg.com/vi/{id}/maxresdefault.jpg',
  'sd.webp': 'https://i.ytimg.com/vi_webp/{id}/sddefault.webp',
  'maxres.webp': 'https://i.ytimg.com/vi_webp/{id}/maxresdefault.webp',
};

// Ordered fallback chains per requested quality. First 200 wins; hqdefault.jpg
// is the guaranteed terminal variant.
const CHAINS: Record<string, string[]> = {
  hq: ['hq.jpg'],
  mq: ['mq.jpg', 'hq.jpg'],
  sd: ['sd.jpg', 'hq.jpg'],
  maxres: ['maxres.jpg', 'sd.jpg', 'hq.jpg'],
  // Same 1280x720 16:9 frame as `maxres`, but WebP first — typically ~70% fewer
  // bytes for an identical image (measured 171 KB JPEG -> 52 KB WebP). Falls
  // back through the exact `maxres` chain, so framing never changes.
  maxreswebp: ['maxres.webp', 'maxres.jpg', 'sd.jpg', 'hq.jpg'],
  sdwebp: ['sd.webp', 'sd.jpg', 'hq.jpg'],
};

export const DEFAULT_QUALITY = 'hq';

// YouTube video IDs are 11 chars of [A-Za-z0-9_-]. Reject anything else so we
// never proxy arbitrary URLs.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

/**
 * Own-property lookup only. A bare `CHAINS[q]` would resolve inherited keys
 * like "constructor" to a function, which then blows up the `for..of` below.
 */
export function isKnownQuality(quality: string): boolean {
  return Object.prototype.hasOwnProperty.call(CHAINS, quality);
}

export async function serveThumb(id: string, quality: string): Promise<Response> {
  if (!isValidId(id)) {
    return new Response('Not found', { status: 404 });
  }

  const chain = isKnownQuality(quality) ? CHAINS[quality] : CHAINS[DEFAULT_QUALITY];

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
        // 30d in the browser; 30d at the edge with stale-while-revalidate.
        // Thumbnails are immutable per (video id, quality), so a long browser
        // TTL is safe and clears PageSpeed's "efficient cache policy" audit.
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
        // The variant actually served, so a cache collision is diagnosable
        // from the response alone rather than by diffing content-length.
        'X-Thumb-Variant': variant,
      },
    });
  }

  // Fallback: if upstream fetches could not complete (e.g. local dev, sandbox,
  // or a network hiccup), redirect the browser straight to YouTube's public
  // thumbnail so images never break or blackscreen.
  return new Response(null, {
    status: 307,
    headers: {
      Location: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
