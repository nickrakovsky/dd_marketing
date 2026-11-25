// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { BentoDemoClient, BentoRejected } from './demo-bento';
import { testLead } from './demo-test-fixtures';
import { CAPTURE_FIELD, PERSONAL_FIELD } from './demo-types';

afterEach(() => vi.restoreAllMocks());
const credentials = { siteUuid: 'test-site', publishableKey: 'test-key', secretKey: 'test-secret' };
function setup(value: unknown, status = 200) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(value), { status }));
  return { request, client: new BentoDemoClient(credentials, request) };
}
it('posts only one capture with attribution, personal field and verification marker', async () => {
  const { client, request } = setup({ results: 1, failed: 0 });
  const lead = testLead();
  await client.capture(lead);
  const [url, options] = request.mock.calls[0];
  expect(String(url)).toBe('https://app.bentonow.com/api/v1/batch/events?site_uuid=test-site');
  expect(JSON.parse(options!.body as string).events[0]).toMatchObject({ type: 'Demo Subscriber', email: lead.email,
    fields: { [CAPTURE_FIELD]: lead.id, [PERSONAL_FIELD]: lead.email, utm_source: 'test' } });
  expect(options?.redirect).toBe('error');
  expect(options?.signal).toBeInstanceOf(AbortSignal);
});
it('does not overwrite first-touch, original email or visitor fields on preexisting contacts', async () => {
  const { client, request } = setup({ results: 1 });
  await client.capture(testLead({ preexisting: true }));
  const event = JSON.parse(request.mock.calls[0][1]!.body as string).events[0];
  expect(event.fields).not.toHaveProperty('utm_source');
  expect(event.fields).toMatchObject({ dd_demo_request_page: '/carrier', dd_email_provider_group: 'gmail_yahoo_icloud' });
  expect(event.fields).not.toHaveProperty(PERSONAL_FIELD);
  expect(event).not.toHaveProperty('visitor_id');
});
it('sends a change_email command without subscription or destructive commands', async () => {
  const { client, request } = setup({ results: 1 });
  await client.changeEmail('buyer@gmail.com', 'buyer@company.com');
  expect(JSON.parse(request.mock.calls[0][1]!.body as string)).toEqual({ command: [{ command: 'change_email', email: 'buyer@gmail.com', query: 'buyer@company.com' }] });
});
it('reads the stable identity and subscription/tags fields used to verify a rename', async () => {
  const { client } = setup({ data: { attributes: { uuid: 'uuid', email: 'buyer@company.com', fields: {}, unsubscribed_at: null, cached_tag_ids: [1, 'two'] } } });
  expect(await client.find({ uuid: 'uuid' })).toMatchObject({ uuid: 'uuid', unsubscribedAt: null, tags: ['1', 'two'] });
});
it.each([{}, { data: null }])('accepts only explicit missing-contact response shapes: %j', async response => {
  expect(await setup(response).client.find({ email: 'missing@company.com' })).toBeNull();
});
it.each([{ error: 'unexpected' }, { data: [] }, { data: { attributes: { uuid: 'u', email: 'a@b.com' } } }])('rejects ambiguous subscriber data: %j', async response => {
  await expect(setup(response).client.find({ email: 'buyer@company.com' })).rejects.toThrow();
});
it('does not treat HTTP 404 as proof that a contact is missing', async () => {
  await expect(setup({}, 404).client.find({ email: 'buyer@company.com' })).rejects.toThrow();
});
it('separates a definite POST rejection from an uncertain response', async () => {
  await expect(setup({}, 422).client.capture(testLead())).rejects.toBeInstanceOf(BentoRejected);
  await expect(setup({ results: 0 }).client.capture(testLead())).rejects.not.toBeInstanceOf(BentoRejected);
});

it('uses the canonical data snapshot and keeps micro-app demo intent', async () => {
  const { client, request } = setup({ results: 1 });
  await client.capture(testLead({ context: { source: '/comparison', leadEvent: 'DataDocks Demo Request',
    currentTouch: { msclkid: 'click' }, ctaId: 'yard-selector', attemptId: 'attempt-key',
    metadata: { selectedSystem: 'DataDocks', requirements: { dockDoors: '5' } },
  } }));
  const event = JSON.parse(request.mock.calls[0][1]!.body as string).events[0];
  expect(event).toMatchObject({ type: 'DataDocks Demo Request', details: { cta_id: 'yard-selector', attempt_id: 'attempt-key', current_touch: { msclkid: 'click' }, metadata: { requirements: { dockDoors: '5' } } } });
});
