// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { CalendlyDemoClient } from './demo-calendly';
const eventUri = 'https://api.calendly.com/scheduled_events/event-12345678';
const inviteeUri = `${eventUri}/invitees/invitee-12345678`;
it.each(['https://apiXcalendlyXcom/scheduled_events/12345678', 'https://evil.test/scheduled_events/12345678', 'https://api.calendly.com.evil.test/scheduled_events/12345678', `${eventUri}?query=1`, `${eventUri}/../other`, 'http://api.calendly.com/scheduled_events/12345678'])('rejects untrusted API reference %s before contacting it', async uri => {
  const request = vi.fn();
  await expect(new CalendlyDemoClient('secret', request).inspect(uri, inviteeUri)).rejects.toThrow(); expect(request).not.toHaveBeenCalled();
});
it('reads only the exact two API resources with server authorization and no redirects', async () => {
  const request = vi.fn(async (url: RequestInfo | URL) => new Response(JSON.stringify({ resource: String(url) === eventUri ? {
    uri: eventUri, start_time: '2026-10-01T10:00:00Z', status: 'active', event_type: 'type',
    event_memberships: [{ user: 'host' }], invitees_counter: { active: 1, limit: 1 },
  } : { event: eventUri, email: 'Buyer@company.com', status: 'active', created_at: '2026-09-24T10:00:00Z',
    tracking: { utm_content: 'ddbs.attempt' }, rescheduled: false } })));
  const evidence = await new CalendlyDemoClient('secret', request).inspect(eventUri, inviteeUri);
  expect(evidence).toMatchObject({ email: 'buyer@company.com', nonce: 'ddbs.attempt', activeInvitees: 1 });
  expect(request).toHaveBeenCalledWith(eventUri, expect.objectContaining({ redirect: 'error', headers: expect.objectContaining({ Authorization: 'Bearer secret' }) }));
});
it('requires cancellation write success without interpreting it as verified booking state', async () => {
  const request = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
  await new CalendlyDemoClient('secret', request).cancel(eventUri, 'Visitor wanted support');
  expect(request).toHaveBeenCalledWith(`${eventUri}/cancellation`, expect.objectContaining({ method: 'POST', body: '{"reason":"Visitor wanted support"}' }));
});
