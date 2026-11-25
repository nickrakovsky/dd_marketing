import { buildBentoEvent } from '../bento-track-payload';
import { needsWorkEmail, normalizeDemoEmail } from '../demo-qualification';
import type { DemoLeadContext } from '../demo-qualification';
import { DemoError } from './demo-types';

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DemoError('invalid_request');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max
    || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new DemoError('invalid_request');
  return value;
}
export function requestKey(value: unknown) {
  const key = text(value, 80);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(key)) throw new DemoError('invalid_request_id');
  return key;
}
export function emailAddress(value: unknown, work = false) {
  let email: string;
  try { email = normalizeDemoEmail(text(value, 254)); }
  catch { throw new DemoError('invalid_email'); }
  if (work && needsWorkEmail(email)) throw new DemoError('personal_work_email');
  return email;
}
export function leadContext(value: unknown, origin: string): DemoLeadContext {
  const input = record(value);
  if (input.leadEvent !== undefined && !['Demo Subscriber', 'DataDocks Demo Request'].includes(String(input.leadEvent))) throw new DemoError('invalid_context');
  try {
    const event = buildBentoEvent({ ...input, email: 'validation@example.com', event: input.leadEvent || 'Demo Subscriber' });
    const details = event.details as Record<string, unknown>;
    if (typeof details.source !== 'string') throw new Error('Missing source');
    if (event.landing_page_url && new URL(String(event.landing_page_url)).origin !== origin) throw new Error('Invalid landing origin');
    if (details.session_landing_url && new URL(String(details.session_landing_url)).origin !== origin) throw new Error('Invalid session landing origin');
    // Reuse the canonical validator/mapping rather than keeping a narrower schema.
    return {
      source: details.source,
      ...(event.landing_page_url ? { landingPage: String(event.landing_page_url) } : {}),
      ...(details.landing_page_mode ? { landingPageMode: details.landing_page_mode as 'page' | 'session' } : {}),
      ...(input.landingPageMode === 'page' && details.session_landing_url ? { sessionLandingPage: String(details.session_landing_url) } : {}),
      ...(event.visitor_id ? { visitorUuid: String(event.visitor_id) } : {}),
      ...(details.first_touch ? { firstTouch: details.first_touch as Record<string, unknown> } : {}),
      ...(details.last_touch ? { lastTouch: details.last_touch as Record<string, unknown> } : {}),
      ...(input.currentTouch !== undefined ? { currentTouch: details.current_touch as Record<string, unknown> || {} } : {}),
      ...(details.metadata ? { metadata: details.metadata as Record<string, unknown> } : {}),
      ...Object.fromEntries([
        ['eventId', details.event_id], ['attemptId', details.attempt_id], ['occurredAt', details.occurred_at],
        ['ctaId', details.cta_id], ['ctaPlacement', details.cta_placement], ['pageCategory', details.page_category],
      ].filter(([, value]) => value !== undefined)),
      ...(input.leadEvent ? { leadEvent: input.leadEvent as DemoLeadContext['leadEvent'] } : {}),
    };
  } catch { throw new DemoError('invalid_context'); }
}

/** Bound the actual streamed body; Content-Length alone is not authoritative. */
export async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new DemoError('json_required', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new DemoError('invalid_request');
  let size = 0;
  const chunks: Uint8Array[] = [];
  let chunk = await reader.read();
  while (!chunk.done) {
    size += chunk.value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new DemoError('request_too_large', 413); }
    chunks.push(chunk.value);
    chunk = await reader.read();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return record(JSON.parse(new TextDecoder().decode(bytes))); }
  catch { throw new DemoError('invalid_json'); }
}
