import { describe, expect, it, vi } from 'vitest';
import { captureDemoLead } from './home-demo-capture';

const context = {
  source: '/index/home-revamp',
  landingPage: 'https://datadocks.com/posts/example',
  attribution: { first: { utm_source: 'search' }, last: { utm_source: 'email' } },
};

describe('email capture before booking', () => {
  it('does not resolve until the server confirms the lead is saved', async () => {
    let complete!: (response: Response) => void;
    const request = vi.fn<typeof fetch>(() => new Promise(resolve => { complete = resolve; }));
    const launch = vi.fn();
    const pending = captureDemoLead(' operator@example.com ', context, request).then(launch);
    await Promise.resolve();
    expect(launch).not.toHaveBeenCalled();
    complete(new Response(JSON.stringify({ ok: true })));
    await pending;
    expect(launch).toHaveBeenCalledWith('operator@example.com');
    const payload = JSON.parse(String(request.mock.calls[0][1]?.body));
    expect(payload.firstTouch).toEqual(context.attribution.first);
    expect(payload.lastTouch).toEqual(context.attribution.last);
    expect(payload.event).toBe('Demo Subscriber');
  });

  it.each([200, 503])('rejects failed capture even when HTTP status is %s', async status => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status }));
    await expect(captureDemoLead('operator@example.com', context, request)).rejects.toThrow();
  });

  it('does not accept a successful HTTP response with malformed JSON', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('unavailable'));
    await expect(captureDemoLead('operator@example.com', context, request)).rejects.toThrow();
  });

  it('keeps network failures from progressing to booking', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    await expect(captureDemoLead('operator@example.com', context, request)).rejects.toThrow();
  });

  it('does not send an empty or invalid email', async () => {
    const request = vi.fn<typeof fetch>();
    await expect(captureDemoLead(' ', context, request)).rejects.toThrow();
    await expect(captureDemoLead('not-an-email', context, request)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
