import type { LeadContext } from './home-demo-capture';
import type { DemoLeadSnapshot } from './demo-lead-contract';

/** Shared by inline and dialog capture. Only the requested domains are gated. */
export const PERSONAL_DEMO_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'icloud.com']);

export function normalizeDemoEmail(value: string): string {
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
  const at = email.lastIndexOf('@');
  return `${email.slice(0, at)}@${email.slice(at + 1).toLowerCase()}`;
}

export function needsWorkEmail(email: string): boolean {
  return PERSONAL_DEMO_DOMAINS.has(normalizeDemoEmail(email).split('@')[1]);
}

export function facilityBookingUrl(email?: string): string {
  const url = new URL('https://booking.datadocks.com/sessions/new');
  if (email) url.searchParams.set('email', normalizeDemoEmail(email));
  return url.toString();
}

/** Canonical context supplied by the Bento data package; legacy touches stay readable. */
export interface DemoLeadContext extends LeadContext {
  firstTouch?: Record<string, unknown>;
  lastTouch?: Record<string, unknown>;
  leadEvent?: 'Demo Subscriber' | 'DataDocks Demo Request';
}

export interface CaptureRequest {
  email: string;
  requestId: string;
  context: DemoLeadContext;
}

export interface WorkEmailRequest extends CaptureRequest {
  /** Server-issued receipt, not an email or browser-provided contact identifier. */
  leadToken: string;
  originalPersonalEmail: string;
}

export type WorkEmailResult = { status: 'pending' | 'review_required' } | { status: 'ready'; email: string };
export type CaptureResult = { leadToken: string; status?: 'pending' | 'captured' | 'ready' | 'review_required' };

/**
 * The server adapter is deliberately separate from the interaction. It must
 * enforce this same domain policy, authorize the receipt, and make retries
 * idempotent. `ready` means identity reconciliation has completed, not queued.
 */
export interface DemoLeadService {
  capture(request: CaptureRequest): Promise<CaptureResult>;
  useWorkEmail(request: WorkEmailRequest): Promise<WorkEmailResult>;
}

export interface DemoCaptureState {
  /** Booking eligibility only. CRM completion never controls this step. */
  step: 'email' | 'work-email' | 'ready';
  busy: boolean;
  email: string;
  originalPersonalEmail: string;
  message: string;
}

/** Qualification runs synchronously; receipt-authorized CRM work runs separately. */
export function createDemoCaptureFlow(
  service: DemoLeadService,
  context: DemoLeadContext,
  createRequestId: () => string = () => crypto.randomUUID(),
  recovered?: DemoLeadSnapshot | null,
) {
  let state: DemoCaptureState = { step: 'email', busy: false, email: '', originalPersonalEmail: '', message: '' };
  let capture: Promise<CaptureResult | null> | undefined;
  let background: Promise<unknown> = Promise.resolve();
  let workSubmitted = false;
  if (recovered) {
    context = recovered.context;
    capture = Promise.resolve({ leadToken: recovered.leadToken, status: recovered.status });
    workSubmitted = recovered.operation === 'work-email';
    state = { ...state, step: needsWorkEmail(recovered.email) ? 'work-email' : 'ready',
      email: needsWorkEmail(recovered.email) ? '' : recovered.email,
      originalPersonalEmail: recovered.originalPersonalEmail,
      message: needsWorkEmail(recovered.email) ? 'Enter your work email to choose a demo time.' : 'Choose a time for your software demo.',
    };
  }
  const listeners = new Set<(state: Readonly<DemoCaptureState>) => void>();
  const snapshot = () => Object.freeze({ ...state });
  const update = (changes: Partial<DemoCaptureState>) => {
    state = { ...state, ...changes };
    listeners.forEach(listener => listener(snapshot()));
  };
  return {
    getState: snapshot,
    getContext: () => context,
    /** Diagnostics/tests only; callers must never await this before booking. */
    settled: () => background,
    subscribe(listener: (state: Readonly<DemoCaptureState>) => void) {
      listeners.add(listener); listener(snapshot());
      return () => { listeners.delete(listener); };
    },
    submit(value: string): Promise<Readonly<DemoCaptureState>> {
      if (state.step === 'ready') return Promise.resolve(snapshot());
      let email: string;
      try { email = normalizeDemoEmail(value); }
      catch { update({ message: 'Enter a valid email address.' }); return Promise.resolve(snapshot()); }
      if (state.step === 'work-email' && needsWorkEmail(email)) {
        update({ message: 'Please enter your work email to choose a demo time.' });
        return Promise.resolve(snapshot());
      }
      const request = { email, requestId: createRequestId(), context };
      if (state.step === 'email') {
        // Begin capture once, but do not claim it was saved until the provider confirms.
        capture = Promise.resolve().then(() => service.capture(request)).catch(() => null);
        background = capture;
        update(needsWorkEmail(email)
          ? { step: 'work-email', originalPersonalEmail: email, email: '', message: 'Thanks — enter your work email to choose a demo time.' }
          : { step: 'ready', email, message: 'Choose a time for your software demo.' });
      } else {
        const originalPersonalEmail = state.originalPersonalEmail;
        if (!workSubmitted) {
          workSubmitted = true;
          background = (capture || Promise.resolve(null)).then(receipt => {
            if (!receipt?.leadToken) return; // Never guess authorization or duplicate capture after an uncertain result.
            return service.useWorkEmail({ ...request, leadToken: receipt.leadToken, originalPersonalEmail });
          }).catch(() => undefined);
        }
        update({ step: 'ready', email, message: 'Choose a time for your software demo.' });
      }
      return Promise.resolve(snapshot());
    },
  };
}

export type DemoCaptureFlow = ReturnType<typeof createDemoCaptureFlow>;
