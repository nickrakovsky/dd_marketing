import { needsWorkEmail } from '../demo-qualification';
import type { DemoLeadSnapshot } from '../demo-lead-contract';
import { digest } from './demo-auth';
import type { DemoAuth } from './demo-auth';
import type { DemoProcessor } from './demo-processor';
import { DemoError } from './demo-types';
import type { DemoStore, Lead } from './demo-types';
import { emailAddress, leadContext, readBody, requestKey } from './demo-validation';

export function demoResponse(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...headers,
  } });
}

export function createDemoApi(store: DemoStore, processor: DemoProcessor, auth: DemoAuth, origin: string, now = Date.now) {
  async function snapshot(lead: Lead, session: { hash: string; expires: number }): Promise<DemoLeadSnapshot> {
    return {
      status: lead.phase === 'review' ? 'review_required'
        : lead.phase === 'ready' ? 'ready' : lead.phase === 'captured' ? 'captured' : 'pending',
      operation: lead.workKey ? 'work-email' : 'capture',
      leadToken: await auth.receipt(lead.id, session), requestId: lead.workKey || lead.captureKey,
      email: lead.workEmail || lead.email,
      originalPersonalEmail: needsWorkEmail(lead.email) ? lead.email : '', context: lead.context,
    };
  }
  return async (request: Request) => {
    try {
      if (request.method !== 'POST') throw new DemoError('method_not_allowed', 405);
      if (new URL(request.url).origin !== origin || request.headers.get('origin') !== origin
        || (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) {
        throw new DemoError('origin_not_allowed', 403);
      }
      // The edge supplies this header. Never use browser-supplied forwarded IPs.
      const ip = request.headers.get('cf-connecting-ip');
      if (!ip) throw new DemoError('edge_required', 503);
      const bucket = Math.floor(now() / 3600000);
      if (!await store.rateLimit(await auth.rateKey(ip, bucket), 180, (bucket + 1) * 3600000)) throw new DemoError('rate_limited', 429);
      const body = await readBody(request);
      const session = await auth.session(request);
      if (body.action === 'session') {
        return demoResponse({ ok: true }, 200, session ? {} : { 'Set-Cookie': await auth.newSession() });
      }
      if (!session) throw new DemoError('session_required', 401);
      if (!await store.rateLimit(`session:${session.hash}:${bucket}`, 120, (bucket + 1) * 3600000)) throw new DemoError('rate_limited', 429);
      let lead: Lead | null;
      if (body.action === 'capture') {
        const captureKey = requestKey(body.requestId);
        const email = emailAddress(body.email);
        const context = leadContext(body.context, origin);
        const id = await digest(`${session.hash}:${captureKey}`);
        lead = await store.get(id);
        if (!lead) {
          if (!await store.rateLimit(`capture:${session.hash}:${bucket}`, 10, (bucket + 1) * 3600000)) throw new DemoError('rate_limited', 429);
          const time = now();
          lead = await store.create({ id, sessionHash: session.hash, captureKey, email, context,
            phase: 'capture', createdAt: time, operationStartedAt: time, nextAttemptAt: 0, attempts: 0 });
        }
        if (lead.email !== email || JSON.stringify(lead.context) !== JSON.stringify(context)) throw new DemoError('operation_conflict', 409);
        lead = await processor.advance(lead.id);
      } else if (body.action === 'resume') {
        lead = await store.latest(session.hash);
        if (lead) lead = await processor.advance(lead.id);
      } else if (body.action === 'work-email' || body.action === 'status') {
        const id = await auth.leadId(body.leadToken, session);
        lead = await store.get(id);
        if (!lead || lead.sessionHash !== session.hash) throw new DemoError('not_found', 404);
        lead = await processor.advance(id, body.action === 'work-email'
          ? { email: emailAddress(body.email, true), requestId: requestKey(body.requestId) } : undefined);
      } else throw new DemoError('invalid_action');
      return demoResponse({ lead: lead ? await snapshot(lead, session) : null });
    } catch (error) {
      if (error instanceof DemoError) return demoResponse({ error: error.code }, error.status, error.status === 429 ? { 'Retry-After': '60' } : {});
      // Never echo upstream payloads, subscriber details or secret-bearing errors.
      console.error('[demo-lead] Request could not complete');
      return demoResponse({ error: 'temporarily_unavailable' }, 503);
    }
  };
}
