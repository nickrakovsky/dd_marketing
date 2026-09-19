/**
 * Same-origin proxy for the actual Bento SDK bundle.
 *
 * fast.bentonow.com's loader script (proxied at /bento-loader) hard-codes a
 * second script load of https://app.bentonow.com/{site_uuid}.js -- the real
 * ~120 KB SDK bundle. Loading that URL directly, even as a normal (non-
 * Partytown) <script> tag, fails in a real browser with
 * net::ERR_BLOCKED_BY_ORB (Chrome's Opaque Response Blocking). Confirmed the
 * SDK content itself is fine -- a GET with realistic browser headers returns
 * a normal 200 with the full bundle -- so this is Chrome applying a
 * browser-only protection to the exact request shape the dynamically-created
 * script tag produces; ORB is deliberately opaque about the precise trigger.
 * A server-side fetch has no such browser security model, so proxying this
 * hop the same way as /bento-loader sidesteps it entirely.
 *
 * /bento-loader rewrites its response to point here instead of
 * app.bentonow.com directly. This route in turn rewrites ITS response so the
 * SDK's own event-transmission calls land on /bento-events instead of
 * track.bentonow.com -- see src/pages/bento-events/tracking/events.ts for
 * why that third hop needs the same treatment.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const ID_RE = /^[A-Za-z0-9]+$/;

export const GET: APIRoute = async ({ url, locals }) => {
  const siteUuid = url.searchParams.get('site_uuid');
  if (!siteUuid || !ID_RE.test(siteUuid)) {
    return new Response('Missing or invalid site_uuid', { status: 400 });
  }

  const cfEnv = (locals as any)?.runtime?.env;
  const expectedUuid = cfEnv?.PUBLIC_BENTO_SITE_UUID ?? import.meta.env.PUBLIC_BENTO_SITE_UUID;
  if (expectedUuid && siteUuid !== expectedUuid) {
    return new Response('Not found', { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`https://app.bentonow.com/${siteUuid}.js`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://datadocks.com/',
      },
    });
  } catch {
    return new Response('', { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  if (!upstream.ok) {
    return new Response('', { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  let body = await upstream.text();
  // Confirmed live: exactly one occurrence, inside a bentoTrackUrl() helper
  // that returns the bare domain -- the SDK appends "/tracking/events"
  // itself (bento$.post(bentoTrackUrl() + "/tracking/events", ...)). Same
  // pattern as /bento-loader's rewrite: target the exact known string, not a
  // broad domain-wide replace.
  body = body.split('"https://track.bentonow.com"').join('"/bento-events"');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // Same reasoning as /bento-loader: short-lived, not treated as a
      // long-cacheable static asset.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
