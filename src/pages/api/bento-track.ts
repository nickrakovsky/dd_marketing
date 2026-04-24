/**
 * Server-side Bento tracking proxy.
 *
 * Ad blockers block all requests to *.bentonow.com.
 * This endpoint lives on datadocks.com (same origin) so it is never blocked.
 *
 * Client sends:  POST /api/bento-track  { email, event, source, landingPage, visitorUuid }
 * Server calls:  POST https://app.bentonow.com/api/v1/batch/events
 *
 * Env vars required in Cloudflare Pages:
 *   PUBLIC_BENTO_SITE_UUID  — site UUID (also readable at build time)
 *   BENTO_PUBLISHABLE_KEY   — publishable API key (runtime secret)
 *   BENTO_SECRET_KEY        — secret API key (runtime secret)
 *
 * NOTE: On Cloudflare Pages, runtime secrets are only available via
 * locals.runtime.env, NOT import.meta.env. We fall back to import.meta.env
 * for local dev (where locals.runtime is undefined).
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // ---------- 1. Parse request body ----------
  let body: {
    email?: string;
    event?: string;
    source?: string;
    landingPage?: string;
    visitorUuid?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email, event, source, landingPage, visitorUuid } = body;
  if (!email || !event) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing email or event' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ---------- 2. Read env vars ----------
  // FIX: On Cloudflare Pages SSR, runtime secrets must come from
  // locals.runtime.env, not import.meta.env (which is build-time only).
  // Fall back to import.meta.env for local dev.
  const cfEnv = (locals as any)?.runtime?.env;
  const siteUuid  = cfEnv?.PUBLIC_BENTO_SITE_UUID  ?? import.meta.env.PUBLIC_BENTO_SITE_UUID;
  const pubKey    = cfEnv?.BENTO_PUBLISHABLE_KEY    ?? import.meta.env.BENTO_PUBLISHABLE_KEY;
  const secretKey = cfEnv?.BENTO_SECRET_KEY         ?? import.meta.env.BENTO_SECRET_KEY;

  if (!siteUuid || !pubKey || !secretKey) {
    console.error(
      '[bento-track] Missing env vars.',
      'siteUuid:', !!siteUuid,
      'pubKey:', !!pubKey,
      'secretKey:', !!secretKey,
      'cfEnv available:', !!cfEnv,
    );
    return new Response(
      JSON.stringify({ ok: false, error: 'Server misconfigured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ---------- 3. Build fields payload ----------
  // FIX: event type goes directly as the event name ("Demo Subscriber"),
  // not wrapped in type:"$custom" + details.custom_event.
  // FIX: include landing_page_url and bento_uuid for identity stitching
  // so server-side subscribers are linked to the visitor's anonymous session.
  const fields: Record<string, string> = {
    source: source || '/',
  };
  if (landingPage) {
    fields['landing_page_url'] = landingPage;
  }
  if (visitorUuid) {
    // Bento uses this to stitch the anonymous SDK session to the identified subscriber
    fields['bento_uuid'] = visitorUuid;
  }

  // ---------- 4. Call Bento API ----------
  const basicAuth = btoa(`${pubKey}:${secretKey}`);
  const bentoUrl = `https://app.bentonow.com/api/v1/batch/events?site_uuid=${siteUuid}`;

  try {
    const res = await fetch(bentoUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DataDocks-AstroSite/1.0',
      },
      body: JSON.stringify({
        events: [
          {
            type: event,   // "Demo Subscriber" — used directly, not wrapped
            email,
            fields,
          },
        ],
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(`[bento-track] Bento API ${res.status}: ${responseText}`);
      return new Response(
        JSON.stringify({ ok: false, error: `Bento API ${res.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[bento-track] OK for ${email}: ${responseText}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[bento-track] Fetch error: ${message}`);
    return new Response(
      JSON.stringify({ ok: false, error: 'Upstream error' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
