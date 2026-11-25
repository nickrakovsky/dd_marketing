// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoApi } from './demo-api';
import { DemoAuth } from './demo-auth';
import { DemoProcessor } from './demo-processor';
import { handleDemoRequest } from './demo-runtime';
import { context, fakeBento, testDatabase } from './demo-test-fixtures';
import { createHttpDemoLeadService } from '../demo-lead-service';
import { createDemoCaptureFlow } from '../demo-qualification';
import worker from '../../../workers/demo-reconcile';

const origin = 'https://www.datadocks.com';
let database: ReturnType<typeof testDatabase>;
let bento: ReturnType<typeof fakeBento>;
let handle: ReturnType<typeof createDemoApi>;
let cookie: string;
let now: number;
let processor: DemoProcessor;

async function post(body: unknown, overrides: Record<string, string> = {}) {
  return handle(new Request(`${origin}/api/demo-lead`, { method: 'POST', headers: {
    origin, 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1', cookie, ...overrides,
  }, body: JSON.stringify(body) }));
}
async function capture(email = 'buyer@gmail.com', requestId = 'capture-key') {
  return post({ action: 'capture', email, requestId, context });
}
beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Real network prohibited'); }));
  database = testDatabase(); bento = fakeBento(); now = 1000000; cookie = '';
  processor = new DemoProcessor(database.store, bento, () => now);
  handle = createDemoApi(database.store, processor, new DemoAuth('test-secret-'.repeat(4), () => now), origin, () => now);
  cookie = (await post({ action: 'session' })).headers.get('set-cookie')!.split(';')[0];
});
afterEach(() => { database.close(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('session-bound demo API', () => {
  it('captures once across retries and rejects changed payloads under the same request key', async () => {
    const first = await (await capture()).json();
    expect(first.lead.status).toBe('captured');
    expect(await (await capture()).json()).toEqual(first);
    expect((await capture('someone@company.com')).status).toBe(409);
    expect(bento.capture).toHaveBeenCalledTimes(1);
    expect(first.lead).not.toHaveProperty('baseline');
    expect(first.lead).not.toHaveProperty('sessionHash');
    expect(first.lead).not.toHaveProperty('reason');
  });
  it('sets a secure HTTP-only cookie and reuses it on refresh', async () => {
    const response = await post({ action: 'session' }, { cookie: '' });
    expect(response.headers.get('set-cookie')).toContain('Secure; HttpOnly; SameSite=Strict');
    expect((await post({ action: 'session' })).headers.has('set-cookie')).toBe(false);
    expect((await capture()).headers.get('cache-control')).toBe('no-store');
  });
  it('recovers pending progress through a new browser service and keeps attribution from capture', async () => {
    const request: typeof fetch = async (_url, init) => post(JSON.parse(init!.body as string));
    const service = createHttpDemoLeadService(request);
    const flow = createDemoCaptureFlow(service, context, () => 'capture-key');
    bento.capture.mockResolvedValueOnce(undefined);
    expect(await flow.submit('buyer@gmail.com')).toMatchObject({ step: 'work-email', busy: false });
    await flow.settled();
    const saved = (await database.store.latest((await new DemoAuth('test-secret-'.repeat(4), () => now).session(new Request(origin, { headers: { cookie } })))!.hash))!;
    await bento.capture(saved);
    now += 6000;
    await processor.reconcile();
    const recovery = await createHttpDemoLeadService(request).recover();
    const restored = createDemoCaptureFlow(service, { source: '/other-page', landingPage: `${origin}/other-page` }, () => 'work-key', recovery);
    expect(restored.getState().step).toBe('work-email');
    expect(await restored.submit('buyer@company.com')).toMatchObject({ step: 'ready', email: 'buyer@company.com' });
    await restored.settled();
    expect((await database.store.get(saved.id))?.context).toEqual(context);
  });
  it('does not block booking or resend capture after a lost HTTP response', async () => {
    const request: typeof fetch = async (_url, init) => {
      const body = JSON.parse(init!.body as string);
      const response = await post(body);
      if (body.action === 'capture') throw new Error('response lost');
      return response;
    };
    const flow = createDemoCaptureFlow(createHttpDemoLeadService(request), context, () => 'capture-key');
    expect(await flow.submit('buyer@company.com')).toMatchObject({ step: 'ready' });
    await flow.settled();
    await flow.submit('buyer@company.com');
    expect(bento.capture).toHaveBeenCalledTimes(1);
  });
  it('rejects a forged or cross-session receipt before reaching Bento', async () => {
    const { lead } = await (await capture()).json();
    const body = { action: 'work-email', email: 'buyer@company.com', requestId: 'work-key', leadToken: lead.leadToken };
    expect((await post({ ...body, leadToken: `${lead.leadToken.slice(0, -1)}x` })).status).toBe(403);
    cookie = (await post({ action: 'session' }, { cookie: '' })).headers.get('set-cookie')!.split(';')[0];
    expect((await post(body)).status).toBe(403);
    expect(bento.changeEmail).not.toHaveBeenCalled();
  });
  it('requires a nonexpired signed session before creating any capture', async () => {
    expect((await post({ action: 'capture', requestId: 'capture-key', email: 'buyer@gmail.com', context }, { cookie: '' })).status).toBe(401);
    now += 86400001;
    expect((await capture()).status).toBe(401);
    expect(bento.capture).not.toHaveBeenCalled();
  });
  it.each<Record<string, string>>([
    { origin: 'https://evil.example' }, { origin: '' }, { 'sec-fetch-site': 'cross-site' },
    { 'cf-connecting-ip': '' }, { 'content-type': 'text/plain' },
  ])('rejects unauthorized/non-JSON requests before mutations: %j', async headers => {
    expect((await post({ action: 'capture', email: 'buyer@gmail.com', requestId: 'capture-key', context }, headers)).ok).toBe(false);
    expect(bento.capture).not.toHaveBeenCalled();
  });
  it.each([
    { email: 'invalid' }, { requestId: 'bad' }, { context: { ...context, source: '//evil.example' } },
    { context: { ...context, landingPage: 'https://evil.example/' } },
  ])('validates capture inputs: %j', async fields => {
    expect((await post({ action: 'capture', email: 'buyer@gmail.com', requestId: 'capture-key', context, ...fields })).status).toBe(400);
    expect(bento.capture).not.toHaveBeenCalled();
  });
  it('bounds the actual request body and rejects arbitrary operation names', async () => {
    expect((await post({ action: 'capture', junk: 'x'.repeat(17000) })).status).toBe(413);
    expect((await post({ action: 'delete' })).status).toBe(400);
  });
  it('removes non-attribution query data and ignores replacement context on work update', async () => {
    const { lead } = await (await post({ action: 'capture', requestId: 'capture-key', email: 'buyer@gmail.com', context: {
      ...context, landingPage: `${origin}/carrier?email=private&token=secret&utm_source=test#fragment`,
    } })).json();
    expect(lead.context.landingPage).toBe(`${origin}/carrier?utm_source=test`);
    expect((await post({ action: 'work-email', leadToken: lead.leadToken, requestId: 'work-key', email: 'other@yahoo.com' })).status).toBe(400);
    const result = await (await post({ action: 'work-email', leadToken: lead.leadToken, requestId: 'work-key', email: 'buyer@company.com', context: { source: '/evil' }, originalPersonalEmail: 'stranger@gmail.com' })).json();
    expect(result.lead.originalPersonalEmail).toBe('buyer@gmail.com');
    expect(result.lead.context.source).toBe('/carrier');
  });
  it('retains the canonical context through capture and work-email qualification', async () => {
    const { lead } = await (await post({ action: 'capture', requestId: 'context-key', email: 'buyer@gmail.com', context: {
      source: '/carrier', ctaId: 'micro-result', ctaPlacement: 'micro-app', pageCategory: 'feature',
      eventId: 'event-key', attemptId: 'attempt-key', occurredAt: '2026-09-23T12:00:00.000Z',
      currentTouch: { msclkid: 'bing-click', utm_source: 'bing' },
      metadata: { requirements: { dockDoors: '5', currentTools: ['Spreadsheet'] } },
      leadEvent: 'DataDocks Demo Request',
    } })).json();
    expect(lead.context).toMatchObject({ ctaId: 'micro-result', attemptId: 'attempt-key', currentTouch: { msclkid: 'bing-click' }, metadata: { requirements: { dockDoors: '5' } } });
    expect(lead.context).not.toHaveProperty('landingPage');
    const updated = await (await post({ action: 'work-email', leadToken: lead.leadToken, requestId: 'work-key', email: 'buyer@company.com' })).json();
    expect(updated.lead.context).toEqual(lead.context);
  });
  it('limits new captures separately from verification retries', async () => {
    for (let n = 0; n < 10; n++) expect((await capture(`buyer${n}@company.com`, `capture-${n}`)).status).toBe(200);
    expect((await capture('last@company.com', 'capture-last')).status).toBe(429);
    expect((await capture('buyer0@company.com', 'capture-0')).status).toBe(200);
  });
  it('returns a failure when persistence fails, without exposing error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(database.store, 'create').mockRejectedValue(new Error('secret user@example.com'));
    const result = await capture();
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain('secret');
    expect(bento.capture).not.toHaveBeenCalled();
  });
});

describe('production activation boundary', () => {
  it('never connects in development, with missing config, or when disabled', async () => {
    const request = new Request(`${origin}/api/demo-lead`, { method: 'POST' });
    expect((await handleDemoRequest(request, { DEMO_CAPTURE_ENABLED: 'true' }, true)).status).toBe(503);
    expect((await handleDemoRequest(request, undefined, false)).status).toBe(503);
    expect((await handleDemoRequest(request, { DEMO_CAPTURE_ENABLED: 'true' }, false)).status).toBe(503);
    await worker.scheduled({}, {});
    expect(fetch).not.toHaveBeenCalled();
  });
});
