/**
 * Same-origin Bento proxy; explicit submissions do not require the Bento SDK.
 * Runtime Cloudflare secrets: PUBLIC_BENTO_SITE_UUID, BENTO_PUBLISHABLE_KEY,
 * BENTO_SECRET_KEY. import.meta.env is the fallback for local development.
 */
import type { APIRoute } from 'astro';
import { BentoInputError, buildBentoEvent, isRecord } from '../../lib/bento-track-payload';

export const prerender = false;
const MAX_BODY_BYTES = 16 * 1024;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    throw new BentoInputError('Request too large', 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new BentoInputError('Invalid JSON');
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      const { value } = chunk;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BentoInputError('Request too large', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  // A basic cross-site guard, not authentication or a substitute for edge rate limits.
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin)
    || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ ok: false, error: 'Cross-site request rejected', delivery: 'not_sent' }, 403);
  }

  let event: ReturnType<typeof buildBentoEvent>;
  try {
    event = buildBentoEvent(await readBody(request));
  } catch (error) {
    const inputError = error instanceof BentoInputError;
    console.warn('[bento-track] invalid_request');
    return json({
      ok: false,
      error: inputError ? error.message : 'Invalid JSON',
      delivery: 'not_sent',
    }, inputError ? error.status : 400);
  }

  const cfEnv = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
  const siteUuid = cfEnv?.PUBLIC_BENTO_SITE_UUID ?? import.meta.env.PUBLIC_BENTO_SITE_UUID;
  const pubKey = cfEnv?.BENTO_PUBLISHABLE_KEY ?? import.meta.env.BENTO_PUBLISHABLE_KEY;
  const secretKey = cfEnv?.BENTO_SECRET_KEY ?? import.meta.env.BENTO_SECRET_KEY;
  if (![siteUuid, pubKey, secretKey].every(value => typeof value === 'string' && value.length > 0)) {
    console.error('[bento-track] missing_configuration');
    return json({ ok: false, error: 'Server misconfigured', delivery: 'not_sent' });
  }

  // Preserve HTTP 200 + ok:false for upstream/configuration failures: callers must
  // check the JSON flag (as captureDemoLead does). Do not silently change that contract.
  try {
    const response = await fetch(`https://app.bentonow.com/api/v1/batch/events?site_uuid=${encodeURIComponent(String(siteUuid))}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${pubKey}:${secretKey}`)}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DataDocks-Proxy/1.3',
      },
      body: JSON.stringify({ events: [event] }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error('[bento-track] upstream_http_error', { event: event.type, status: response.status });
      return json({
        ok: false,
        error: `Bento API ${response.status}`,
        delivery: response.status >= 500 || response.status === 408 ? 'unknown' : 'rejected',
      });
    }

    const result: unknown = await response.json();
    // The older SDK documents results alone; newer responses also include failed.
    // One submitted event must be explicitly accepted, with no reported rejection.
    if (!isRecord(result) || result.results !== 1
      || (result.failed !== undefined && result.failed !== 0)) {
      const rejected = isRecord(result) && result.results === 0;
      console.error('[bento-track] upstream_unaccepted', { event: event.type });
      return json({
        ok: false,
        error: 'Bento did not confirm acceptance',
        delivery: rejected ? 'rejected' : 'unknown',
      });
    }

    console.info('[bento-track] accepted', { event: event.type });
    return json({ ok: true });
  } catch {
    // Never log raw response bodies, emails, credentials or fetch error messages.
    // A timeout/malformed response can follow acceptance: do not automatically retry
    // until durable deduplication exists. Client IDs in details alone do not provide it.
    console.error('[bento-track] upstream_uncertain', { event: event.type });
    return json({ ok: false, error: 'Upstream response unavailable', delivery: 'unknown' });
  }
};
