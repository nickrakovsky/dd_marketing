/**
 * Same-origin proxy for the Bento SDK loader script.
 *
 * fast.bentonow.com's response is a small loader that immediately creates a
 * SECOND dynamic <script src="https://app.bentonow.com/{site_uuid}.js">
 * for the real ~120 KB SDK bundle. Loading fast.bentonow.com directly used
 * to fail via Partytown (it sends no CORS headers, and Partytown must
 * fetch() a script's source to run it in its sandboxed worker); Bento is no
 * longer loaded through Partytown at all (see Layout.astro), which fixes
 * that specific failure mode, but doesn't help with the ad-blocker
 * domain-blocking /api/bento-track's own comment already warns about, and
 * doesn't touch the second hop at all.
 *
 * So this proxy still exists, for the same reason /api/bento-track and
 * /yt-thumb/ exist: fetch the third party server-side and re-serve it
 * same-origin, so ad-blocker domain rules against *.bentonow.com can't catch
 * it. It also rewrites the embedded app.bentonow.com reference to point at
 * /bento-sdk instead -- see that file's comment for why the second hop
 * needs its own proxy for a completely different reason (ORB, not CORS).
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

  let body = await upstream.text();
  // Confirmed live: exactly one occurrence, https://app.bentonow.com/{siteUuid}.js
  // -- Bento's server renders the UUID in server-side, not as a client-side
  // template. Target the exact known URL rather than a broad domain-wide
  // replace, so this can't accidentally touch something unrelated if Bento
  // ever changes unrelated parts of the loader.
  const secondHop = `https://app.bentonow.com/${siteUuid}.js`;
  body = body.split(secondHop).join(`/bento-sdk?site_uuid=${siteUuid}`);

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
