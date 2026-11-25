import { describe, expect, it, vi } from 'vitest';
import { createDemoCaptureFlow, facilityBookingUrl, needsWorkEmail } from './demo-qualification';
import type { DemoLeadService } from './demo-qualification';

const context = { source: '/carrier', currentTouch: { msclkid: 'click' }, ctaId: 'nav', attemptId: 'attempt-id' };
function setup() {
  const capture = vi.fn<DemoLeadService['capture']>().mockResolvedValue({ leadToken: 'receipt', status: 'captured' });
  const useWorkEmail = vi.fn<DemoLeadService['useWorkEmail']>().mockImplementation(async ({ email }) => ({ status: 'ready', email }));
  let id = 0;
  const flow = createDemoCaptureFlow({ capture, useWorkEmail }, context, () => `request-${++id}`);
  return { flow, capture, useWorkEmail };
}

describe('booking qualification independent of CRM delivery', () => {
  it.each(['person@gmail.com', 'person@YAHOO.COM', ' person@iCloud.com '])('gates %s exactly', email => expect(needsWorkEmail(email)).toBe(true));
  it.each(['person@company.com', 'gmail.com@company.com', 'person@gmail.com.example.org'])('allows %s', email => expect(needsWorkEmail(email)).toBe(false));
  it('rejects invalid input without writes', async () => {
    const { flow, capture } = setup();
    expect(await flow.submit('invalid')).toMatchObject({ step: 'email', message: 'Enter a valid email address.' });
    expect(capture).not.toHaveBeenCalled();
  });
  it('opens eligibility immediately even when capture never completes', async () => {
    const { flow, capture } = setup(); capture.mockImplementation(() => new Promise(() => {}));
    expect(await flow.submit(' buyer@Company.COM ')).toMatchObject({ step: 'ready', email: 'buyer@company.com', busy: false });
    expect(capture).toHaveBeenCalledExactlyOnceWith({ email: 'buyer@company.com', requestId: 'request-1', context });
    await flow.submit('buyer@company.com'); expect(capture).toHaveBeenCalledTimes(1);
  });
  it.each(['pending', 'review_required'] as const)('does not block qualifying work emails on %s', async status => {
    const { flow, capture, useWorkEmail } = setup();
    capture.mockResolvedValue({ status, leadToken: 'receipt' }); useWorkEmail.mockResolvedValue({ status });
    await flow.submit('buyer@gmail.com');
    expect(await flow.submit('buyer@company.com')).toMatchObject({ step: 'ready', email: 'buyer@company.com' });
    await flow.settled(); expect(useWorkEmail).toHaveBeenCalledTimes(1);
  });
  it('qualifies while personal capture is in flight and serializes only CRM operations', async () => {
    const { flow, capture, useWorkEmail } = setup();
    let complete!: (result: { leadToken: string; status: 'pending' }) => void;
    capture.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    expect(await flow.submit('buyer@gmail.com')).toMatchObject({ step: 'work-email', originalPersonalEmail: 'buyer@gmail.com' });
    expect(await flow.submit('buyer@yahoo.com')).toMatchObject({ step: 'work-email' });
    expect(await flow.submit('buyer@company.com')).toMatchObject({ step: 'ready' });
    expect(useWorkEmail).not.toHaveBeenCalled();
    complete({ leadToken: 'receipt', status: 'pending' }); await flow.settled();
    expect(useWorkEmail).toHaveBeenCalledExactlyOnceWith({ email: 'buyer@company.com', originalPersonalEmail: 'buyer@gmail.com', leadToken: 'receipt', requestId: 'request-2', context });
    await flow.submit('buyer@company.com'); expect(capture).toHaveBeenCalledTimes(1); expect(useWorkEmail).toHaveBeenCalledTimes(1);
  });
  it('allows booking after capture failure without an unauthorized rename or duplicate capture', async () => {
    const { flow, capture, useWorkEmail } = setup(); capture.mockRejectedValue(new Error('offline'));
    await flow.submit('buyer@gmail.com'); await flow.submit('buyer@company.com'); await flow.settled();
    expect(flow.getState().step).toBe('ready'); expect(useWorkEmail).not.toHaveBeenCalled(); expect(capture).toHaveBeenCalledTimes(1);
    expect(flow.getState().message).not.toMatch(/saved|confirmed/i);
  });
  it('does not replace booking identity with a late or erroneous CRM response', async () => {
    const { flow, useWorkEmail } = setup(); useWorkEmail.mockResolvedValue({ status: 'ready', email: 'wrong@company.com' });
    await flow.submit('buyer@gmail.com'); await flow.submit('buyer@company.com'); await flow.settled();
    expect(flow.getState().email).toBe('buyer@company.com');
  });
  it('can restore an internally flagged identity without a visitor review gate or another write', async () => {
    const { capture, useWorkEmail } = setup();
    const flow = createDemoCaptureFlow({ capture, useWorkEmail }, context, undefined, {
      status: 'review_required', operation: 'work-email', email: 'buyer@company.com', originalPersonalEmail: 'buyer@gmail.com',
      leadToken: 'receipt', requestId: 'old-key', context,
    });
    expect(await flow.submit('')).toMatchObject({ step: 'ready', email: 'buyer@company.com' }); expect(capture).not.toHaveBeenCalled();
  });
  it('encodes the facility email on the fixed destination', () => {
    const url = new URL(facilityBookingUrl('buyer+shipping@company.com'));
    expect(url.origin + url.pathname).toBe('https://booking.datadocks.com/sessions/new');
    expect(url.searchParams.get('email')).toBe('buyer+shipping@company.com');
  });
});
