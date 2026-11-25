// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../pages/api/bento-track';

const receivedAt = new Date('2026-09-22T10:00:00.000Z');
const env = {
  PUBLIC_BENTO_SITE_UUID: 'test-site',
  BENTO_PUBLISHABLE_KEY: 'test-public-key',
  BENTO_SECRET_KEY: 'test-secret-key',
};
const lead = { email: ' operator@example.com ', event: 'Demo Subscriber' };
const first = {
  utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'yards',
  utm_term: 'yard management', utm_content: 'variant-a', gclid: 'google-click',
  msclkid: 'microsoft-click', referrer: 'www.google.com',
  landing: '/datadocks-vs-opendock', ts: '2026-09-21T09:00:00.000Z',
};
const last = { utm_source: 'partner', utm_medium: 'referral', utm_campaign: 'referral', landing: '/posts' };
const requestMock = vi.fn<typeof fetch>();

async function send(body: unknown, options: { headers?: HeadersInit; runtimeEnv?: Record<string, unknown> | null; raw?: boolean } = {}) {
  const request = new Request('https://datadocks.com/api/bento-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.raw ? String(body) : JSON.stringify(body),
  });
  return await POST({
    request,
    locals: options.runtimeEnv === null ? {} : { runtime: { env: options.runtimeEnv ?? env } },
  } as Parameters<typeof POST>[0]);
}

function sentEvent(index = 0) {
  return JSON.parse(String(requestMock.mock.calls[index][1]?.body)).events[0];
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(receivedAt);
  for (const key of Object.keys(env)) vi.stubEnv(key, '');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  requestMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ results: 1, failed: 0 })));
  vi.stubGlobal('fetch', requestMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Bento proxy payload compatibility', () => {
  it('repairs older forms and preserves the same context as explicit touch payloads', async () => {
    const context = { source: '/benefits/see-everything', landingPage: 'https://datadocks.com/datadocks-vs-opendock', visitorUuid: 'visitor-123' };
    const legacy = await send({ ...lead, ...context, attribution: { first, last } });
    const explicit = await send({ ...lead, ...context, firstTouch: first, lastTouch: last });
    expect(await legacy.json()).toEqual({ ok: true });
    expect(await explicit.json()).toEqual({ ok: true });
    expect(sentEvent(0)).toEqual(sentEvent(1));
    expect(sentEvent()).toMatchObject({
      type: 'Demo Subscriber', email: 'operator@example.com',
      landing_page_url: context.landingPage, visitor_id: 'visitor-123',
      fields: {
        source: context.source, utm_source: 'google', utm_medium: 'cpc',
        utm_campaign: 'yards', utm_term: 'yard management', utm_content: 'variant-a',
        gclid: 'google-click', msclkid: 'microsoft-click', referrer: 'www.google.com',
        first_landing: '/datadocks-vs-opendock',
        last_utm_source: 'partner', last_utm_medium: 'referral', last_utm_campaign: 'referral',
      },
      details: {
        schema_version: 1, received_at: receivedAt.toISOString(), collection_source: 'website_proxy',
        source: context.source, session_landing_url: context.landingPage,
        first_touch: first, last_touch: last,
      },
    });
    expect(sentEvent()).not.toHaveProperty('date');
  });

  it('lets explicit non-empty touch fields override legacy values without dropping the rest', async () => {
    await send({
      ...lead, attribution: { first, last },
      firstTouch: { utm_source: 'bing', utm_campaign: '', utm_medium: null },
      lastTouch: { utm_campaign: 'new-referral' },
    });
    expect(sentEvent().fields).toMatchObject({ utm_source: 'bing', utm_campaign: 'yards', utm_medium: 'cpc', last_utm_campaign: 'new-referral' });
    expect(sentEvent().details.first_touch).toEqual({ ...first, utm_source: 'bing' });
  });

  it.each([
    'Demo Subscriber', 'DataDocks Demo Request', 'YMS Shortlist Request',
    'demo_profile_viewed', 'demo_event_type_viewed', 'demo_date_selected', 'demo_booked',
    '$subscribeLCCP', '$subscribescorecards',
  ])('preserves the existing %s event without adding tags or changing subscription status', async event => {
    expect((await send({ ...lead, event })).status).toBe(200);
    expect(sentEvent().type).toBe(event);
    expect(sentEvent()).not.toHaveProperty('tags');
    expect(sentEvent()).not.toHaveProperty('unsubscribed_at');
  });

  it('retains allowlisted micro-app context and ignores caller-supplied profile fields', async () => {
    await send({
      ...lead, event: 'YMS Shortlist Request',
      metadata: { selectedSystem: 'Example YMS', subCategory: 'Retail', integrationEcosystem: 'NetSuite', arbitrary: { secret: 'do-not-copy' } },
      details: { injected: 'do-not-copy' }, fields: { source: 'do-not-copy' }, tags: 'do-not-copy',
    });
    expect(sentEvent().details.metadata).toEqual({ selectedSystem: 'Example YMS', subCategory: 'Retail', integrationEcosystem: 'NetSuite' });
    expect(JSON.stringify(sentEvent())).not.toContain('do-not-copy');
    expect(sentEvent().fields).toMatchObject({ dd_tool_selected_system: 'Example YMS', dd_tool_subcategory: 'Retail' });
  });

  it.each([undefined, null, '', '   '])('leaves an unknown source (%s) unset even when the landing page is known', async source => {
    await send({ ...lead, source, attribution: null, visitorUuid: null, landingPage: 'https://datadocks.com/' });
    expect(sentEvent().fields).not.toHaveProperty('source');
    expect(sentEvent().fields.dd_demo_request_page).toBe('unknown');
    expect(sentEvent().details).not.toHaveProperty('source');
    expect(sentEvent().details).not.toHaveProperty('first_touch');
  });

  it('retains a genuinely supplied homepage and drops arbitrary URL parameters/fragments', async () => {
    await send({
      ...lead, source: '/?email=private@example.com#personal', firstTouch: { landing: '/posts?email=private@example.com' },
      landingPage: 'https://datadocks.com/?utm_source=bing&msclkid=123&email=private@example.com#personal',
    });
    expect(sentEvent().fields).toMatchObject({ source: '/', first_landing: '/posts', dd_demo_request_page: '/' });
    expect(sentEvent().landing_page_url).toBe('https://datadocks.com/?utm_source=bing&msclkid=123');
    expect(JSON.stringify(sentEvent())).not.toContain('private@example.com');
    expect(JSON.stringify(sentEvent())).not.toContain('#personal');
  });

  it('accepts additive context fields and keeps occurrence time separate from receipt time', async () => {
    await send({
      ...lead, eventId: 'event-123', attemptId: 'attempt-123', ctaId: 'homepage-top',
      ctaPlacement: 'hero', pageCategory: 'homepage', occurredAt: '2026-09-22T09:59:00Z',
    });
    expect(sentEvent().date).toBe('2026-09-22T09:59:00Z');
    expect(sentEvent().details).toMatchObject({
      event_id: 'event-123', attempt_id: 'attempt-123', cta_id: 'homepage-top',
      cta_placement: 'hero', page_category: 'homepage', occurred_at: '2026-09-22T09:59:00Z', received_at: receivedAt.toISOString(),
    });
  });
});

describe('Bento acceptance and uncertain delivery', () => {
  it('supports older results-only acceptance responses', async () => {
    requestMock.mockResolvedValueOnce(new Response('{"results":1}'));
    const response = await send(lead);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each([
    [{ results: 0, failed: 1 }, 'rejected'],
    [{ results: 0 }, 'rejected'],
    [{ results: 1, failed: 1 }, 'unknown'],
    [{ results: 1, failed: '0' }, 'unknown'],
    [{ results: '1' }, 'unknown'],
    [{ results: 2 }, 'unknown'],
    [{ success: true }, 'unknown'],
    [null, 'unknown'],
  ])('does not mistake HTTP 200 with %j for acceptance', async (body, delivery) => {
    requestMock.mockResolvedValueOnce(new Response(JSON.stringify(body)));
    const response = await send(lead);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: false, delivery });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it.each([[401, 'rejected'], [429, 'rejected'], [408, 'unknown'], [500, 'unknown'], [503, 'unknown']])('handles upstream HTTP %s without retrying or logging its body', async (status, delivery) => {
    requestMock.mockResolvedValueOnce(new Response('operator@example.com test-secret-key', { status }));
    const response = await send(lead);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: false, delivery });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/operator@example.com|test-secret-key/);
  });

  it('reports a malformed success body as uncertain, without replaying the event', async () => {
    requestMock.mockResolvedValueOnce(new Response('operator@example.com invalid-json'));
    expect(await (await send(lead)).json()).toMatchObject({ ok: false, delivery: 'unknown' });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('operator@example.com');
  });

  it('bounds the upstream request and treats timeout/network failure as uncertain', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValueOnce(AbortSignal.abort());
    requestMock.mockImplementationOnce(async (_url, init) => {
      expect(init?.signal?.aborted).toBe(true);
      throw new Error('operator@example.com connection lost');
    });
    expect(await (await send(lead)).json()).toMatchObject({ ok: false, delivery: 'unknown' });
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('operator@example.com');
  });

  it('uses runtime credentials and logs only an event name on success', async () => {
    await send(lead);
    expect(requestMock.mock.calls[0][0]).toBe('https://app.bentonow.com/api/v1/batch/events?site_uuid=test-site');
    expect(requestMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Basic ${btoa('test-public-key:test-secret-key')}`, 'User-Agent': 'DataDocks-Proxy/1.3' });
    expect(console.info).toHaveBeenCalledWith('[bento-track] accepted', { event: 'Demo Subscriber' });
  });

  it('retains the local-development credential fallback', async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    expect(await (await send(lead, { runtimeEnv: null })).json()).toEqual({ ok: true });
  });

  it('reports missing configuration without making an upstream call', async () => {
    expect(await (await send(lead, { runtimeEnv: {} })).json()).toMatchObject({ ok: false, delivery: 'not_sent' });
    expect(requestMock).not.toHaveBeenCalled();
  });
});

describe('Bento proxy input boundaries', () => {
  it.each([
    null, [], {}, { ...lead, email: ['operator@example.com'] }, { ...lead, email: 'invalid' },
    { ...lead, event: '$subscribe' }, { ...lead, event: ['Demo Subscriber'] },
    { ...lead, attribution: [] }, { ...lead, firstTouch: 'not-an-object' },
    { ...lead, lastTouch: { utm_source: {} } }, { ...lead, metadata: { selectedSystem: {} } },
    { ...lead, metadata: { selectedSystem: 'x'.repeat(513) } },
    { ...lead, source: '//external.example/' }, { ...lead, source: 12 },
    { ...lead, landingPage: 'javascript:alert(1)' }, { ...lead, visitorUuid: {} },
    { ...lead, occurredAt: 'yesterday' }, { ...lead, ctaId: 'x'.repeat(129) },
  ])('rejects malformed or unsupported input before reaching Bento: %j', async body => {
    const response = await send(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, delivery: 'not_sent' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('handles malformed JSON', async () => {
    expect((await send('{broken', { raw: true })).status).toBe(400);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('enforces actual UTF-8 body size even without Content-Length', async () => {
    expect((await send({ ...lead, unused: 'é'.repeat(9000) })).status).toBe(413);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized declared body before reading it', async () => {
    expect((await send(lead, { headers: { 'content-length': '20000' } })).status).toBe(413);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it.each([
    ['origin', 'https://external.example'], ['origin', 'null'], ['sec-fetch-site', 'cross-site'],
  ])('rejects browser cross-site requests with %s: %s', async (name, value) => {
    expect((await send(lead, { headers: { [name]: value } })).status).toBe(403);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('permits same-origin browser submissions', async () => {
    expect(await (await send(lead, { headers: { origin: 'https://datadocks.com', 'sec-fetch-site': 'same-origin' } })).json()).toEqual({ ok: true });
  });
});

describe('stage 4 submission evidence', () => {
  it('preserves explicit requirements while ignoring unknown answer keys', async () => {
    await send({ ...lead, metadata: { requirements: {
      appointmentsPerWeek: '250-500', wms: 'none', currentTools: ['spreadsheet'],
      painPoints: [], parentCarrierMix: { dedicated: 0.5, company: 0.25, customer: 0.25 },
      dataCapture: { bol: 'pre-arrival' }, unknownAnswer: 'discard',
    } } });
    expect(sentEvent().details.metadata.requirements).toEqual({
      appointmentsPerWeek: '250-500', wms: 'none', currentTools: ['spreadsheet'], painPoints: [],
      parentCarrierMix: { dedicated: 0.5, company: 0.25, customer: 0.25 }, dataCapture: { bol: 'pre-arrival' },
    });
    expect(sentEvent().fields).toMatchObject({ dd_declared_appointments_per_week: '250-500', dd_declared_wms: 'none' });
  });

  it.each([
    { requirements: { wms: {} } }, { requirements: { painPoints: 'a,b' } },
    { requirements: { currentTools: Array(21).fill('tool') } },
    { requirements: { parentCarrierMix: { dedicated: -1 } } },
    { requirements: { dataCapture: { bol: 'unrecognised' } } },
  ])('rejects invalid or unbounded requirements %j', async metadata => {
    expect((await send({ ...lead, metadata })).status).toBe(400);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it.each([
    [{ gclid: 'click', utm_medium: 'referral' }, 'paid_traffic'],
    [{ msclkid: 'click' }, 'paid_traffic'],
    [{ utm_medium: 'email', utm_source: 'newsletter' }, 'email'],
    [{ referrer: 'www.google.com' }, 'organic_search'],
    [{ referrer: 'www.bing.com' }, 'organic_search'],
    [{ referrer: 'www.datadocks.com' }, 'internal'],
    [{ referrer: 'partner.example' }, 'referral'],
    [{ landing: '/' }, 'direct_or_unknown'],
  ])('keeps raw current evidence separate from the heuristic %j', async (currentTouch, channel) => {
    await send({ ...lead, firstTouch: { utm_medium: 'referral', utm_source: 'www.google.com' }, currentTouch });
    expect(sentEvent().details).toMatchObject({ current_touch: currentTouch, current_channel: channel, channel_rule_version: 1, attribution_availability: { session_landing: 'unknown' } });
    expect(sentEvent().fields).toMatchObject({ utm_medium: 'referral', utm_source: 'www.google.com' });
  });
});
