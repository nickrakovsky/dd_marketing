/**
 * Server-side Bento tracking proxy.
 *
 * Ad blockers block all requests to *.bentonow.com.
 * This endpoint lives on datadocks.com (same origin) so it is never blocked.
 *
 * Client sends:  POST /api/bento-track  { email, event, source }
 * Server calls:  POST https://app.bentonow.com/api/v1/batch/events
 *
 * Env vars required in Cloudflare Pages:
 *   PUBLIC_BENTO_SITE_UUID  — site UUID (already exists)
 *   BENTO_PUBLISHABLE_KEY   — publishable API key
 *   BENTO_SECRET_KEY         — secret API key
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // ---------- 1. Parse request body ----------
  let body: { email?: string; event?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email, event, source } = body;
  if (!email || !event) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing email or event' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ---------- 2. Read env vars ----------
  const siteUuid = import.meta.env.PUBLIC_BENTO_SITE_UUID;
  const pubKey = import.meta.env.BENTO_PUBLISHABLE_KEY;
  const secretKey = import.meta.env.BENTO_SECRET_KEY;

  if (!siteUuid || !pubKey || !secretKey) {
    console.error(
      '[bento-track] Missing env vars. Need PUBLIC_BENTO_SITE_UUID, BENTO_PUBLISHABLE_KEY, BENTO_SECRET_KEY.',
    );
    // Still return 200 so the client form flow is not disrupted
    return new Response(
      JSON.stringify({ ok: false, error: 'Server misconfigured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ---------- 3. Call Bento API ----------
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
            type: '$custom',
            email,
            fields: {
              source: source || '/',
            },
            details: {
              custom_event: event,
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[bento-track] Bento API ${res.status}: ${text}`);
      return new Response(
        JSON.stringify({ ok: false, error: `Bento API ${res.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

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
