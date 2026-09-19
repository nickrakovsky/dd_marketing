/**
 * Same-origin proxy for the Bento SDK's actual event-transmission endpoint.
 *
 * The loaded SDK (see /bento-sdk) funnels every event -- identify, track,
 * tag, view, updateFields -- through one internal `transmit` function that
 * POSTs to bentoTrackUrl() + "/tracking/events", i.e.
 * https://track.bentonow.com/tracking/events. That domain also sends no
 * Access-Control-Allow-Origin header, so the browser blocks it with the
 * same CORS error as the first two hops (confirmed live). This is the
 * single call site for all event types in the SDK bundle, so unlike the
 * first two hops there is no further chained domain beyond this one.
 *
 * The request itself is a plain, unauthenticated form-urlencoded POST with
 * no secrets -- the site_uuid is already public in the page source, and is
 * carried inside the form body Bento's own SDK constructs (events[0][site]=...).
 * That makes this safe to proxy as a generic pass-through: forward the exact
 * body and content-type Bento's SDK sent, relay back whatever it returns.
 *
 * /bento-sdk rewrites bentoTrackUrl()'s return value to "/bento-events" so
 * the SDK's own "+ /tracking/events" concatenation lands on this route.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') || 'application/x-www-form-urlencoded; charset=UTF-8';
  const body = await request.text();

  try {
    const upstream = await fetch('https://track.bentonow.com/tracking/events', {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body,
    });
    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch {
    // Fire-and-forget analytics: swallow upstream failures rather than
    // surface an error the SDK's own retry/queueing logic would react to.
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
