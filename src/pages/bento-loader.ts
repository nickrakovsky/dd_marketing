/**
 * Same-origin proxy for the Bento SDK loader script.
 *
 * The direct URL, https://fast.bentonow.com/?site_uuid=..., is loaded via
 * <script type="text/partytown" src="..."> in Layout.astro so the SDK runs in
 * a Partytown Web Worker instead of the main thread. To run script content
 * inside that worker, Partytown's main-thread bootstrap must fetch() the
 * script's source itself -- and fast.bentonow.com sends no
 * Access-Control-Allow-Origin header, so that fetch is CORS-blocked. The
 * script has never actually loaded: confirmed live via Playwright
 * (net::ERR_FAILED on the request, while a plain curl to the same URL
 * returns 200 with no CORS headers at all, from any Origin).
 *
 * This mirrors the same fix already applied to /api/bento-track (see its
 * comment: "Ad blockers block all requests to *.bentonow.com. This endpoint
 * lives on datadocks.com so it is never blocked") and to /yt-thumb/ --
 * fetch the third party server-side and re-serve it same-origin, so neither
 * CORS nor domain-based ad-blocker rules can catch it.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const siteUuid = url.searchParams.get('site_uuid');
  if (!siteUuid) {
    return new Response('Missing site_uuid', { status: 400 });
  }

  const cfEnv = (locals as any)?.runtime?.env;
  const expectedUuid = cfEnv?.PUBLIC_BENTO_SITE_UUID ?? import.meta.env.PUBLIC_BENTO_SITE_UUID;
  if (expectedUuid && siteUuid !== expectedUuid) {
    return new Response('Not found', { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`https://fast.bentonow.com/?site_uuid=${siteUuid}`, {
      headers: { 'User-Agent': 'DataDocks-Proxy/1.0' },
    });
  } catch {
    return new Response('', {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (!upstream.ok) {
    return new Response('', {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const body = await upstream.text();
  return new Response(body, {
    status: 200,
    headers: {
      // Served as script content regardless of whatever content-type Bento's
      // own response declares (observed: it sends application/json for a
      // response body that is plain JS -- harmless for a classic script tag,
      // but worth being explicit about here since this is meant to be run as
      // a script rather than just relayed byte-for-byte).
      'Content-Type': 'application/javascript; charset=utf-8',
      // Short-lived: this is a live third-party SDK loader, not a static
      // asset, so we don't assume it's safe to cache the way an image or
      // font is. An hour caps how often we re-fetch it without risking real
      // staleness if Bento ships a change.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
