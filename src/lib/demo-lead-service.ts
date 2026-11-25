import { needsWorkEmail, normalizeDemoEmail } from './demo-qualification';
import type { CaptureRequest, DemoLeadService, WorkEmailRequest } from './demo-qualification';
import type { DemoLeadSnapshot } from './demo-lead-contract';

export class DemoSubmissionUncertain extends Error {
  name = 'DemoSubmissionUncertain';
}

function parseSnapshot(value: unknown): DemoLeadSnapshot {
  try {
    const lead = value as DemoLeadSnapshot | null;
    if (!lead || !['pending', 'captured', 'ready', 'review_required'].includes(lead.status)
      || !['capture', 'work-email'].includes(lead.operation) || typeof lead.leadToken !== 'string' || !lead.leadToken
      || typeof lead.requestId !== 'string' || !lead.requestId
      || typeof lead.email !== 'string' || normalizeDemoEmail(lead.email) !== lead.email
      || typeof lead.originalPersonalEmail !== 'string' || !lead.context?.source
      || (lead.status === 'ready' && needsWorkEmail(lead.email))
      || (lead.status === 'captured' && (lead.operation !== 'capture' || !needsWorkEmail(lead.email)))) throw new Error('Invalid state');
    return lead;
  } catch { throw new DemoSubmissionUncertain('Could not confirm saved progress'); }
}

/** Called on interaction in stage 3, never on every page view. No local PII store. */
export function createHttpDemoLeadService(request: typeof fetch = fetch, sharedSession?: () => Promise<void>) {
  let session: Promise<void> | undefined;
  async function post(body: Record<string, unknown>) {
    let response: Response;
    try {
      response = await request('/api/demo-lead', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000), keepalive: true,
      });
    } catch { throw new DemoSubmissionUncertain('Please check your saved progress again'); }
    if (!response.ok) {
      if (response.status >= 500 || response.status === 409 || response.status === 429) throw new DemoSubmissionUncertain('Please check your saved progress again');
      throw new Error('Demo request was not accepted');
    }
    try { return await response.json() as { lead?: unknown }; }
    catch { throw new DemoSubmissionUncertain('Could not confirm saved progress'); }
  }
  function start() {
    if (sharedSession) return sharedSession();
    if (!session) session = post({ action: 'session' }).then(() => undefined).catch(error => { session = undefined; throw error; });
    return session;
  }
  const service: DemoLeadService & { recover(): Promise<DemoLeadSnapshot | null> } = {
    async capture(input: CaptureRequest) {
      await start();
      const lead = parseSnapshot((await post({ action: 'capture', ...input })).lead);
      if (lead.operation !== 'capture' || lead.email !== input.email) throw new DemoSubmissionUncertain('Reload to restore your latest progress');
      return { leadToken: lead.leadToken, status: lead.status };
    },
    async useWorkEmail(input: WorkEmailRequest) {
      await start();
      const lead = parseSnapshot((await post({ action: 'work-email', email: input.email, requestId: input.requestId, leadToken: input.leadToken })).lead);
      if (lead.operation !== 'work-email' || lead.email !== input.email || lead.status === 'captured') throw new DemoSubmissionUncertain('Could not confirm saved progress');
      return lead.status === 'ready' ? { status: 'ready', email: lead.email } : { status: lead.status };
    },
    async recover() {
      await start();
      const value = (await post({ action: 'resume' })).lead;
      return value === null ? null : parseSnapshot(value);
    },
  };
  return service;
}
