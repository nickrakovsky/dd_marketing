export interface LeadContext {
  source: string;
  landingPage?: string;
  visitorUuid?: string | null;
  attribution?: { first?: Record<string, unknown>; last?: Record<string, unknown> };
  currentTouch?: Record<string, unknown>;
  eventId?: string;
  attemptId?: string;
  occurredAt?: string;
  ctaId?: string;
  ctaPlacement?: string;
  pageCategory?: string;
  metadata?: Record<string, unknown>;
}

/** A locally remembered email is not proof that the lead was saved. */
export async function captureLead(email: string, context: LeadContext, event = 'Demo Subscriber', request: typeof fetch = fetch) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  const { attribution, ...snapshot } = context;
  const response = await request('/api/bento-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...snapshot,
      email: normalizedEmail,
      event,
      firstTouch: attribution?.first,
      lastTouch: attribution?.last,
    }),
    signal: AbortSignal.timeout(15000),
    keepalive: true,
  });
  // Bento queues accepted events. Neither HTTP 200 nor a remembered email is enough.
  if (!response.ok || (await response.json()).ok !== true) {
    throw new Error('We couldn’t confirm your request. Please try again.');
  }
  return normalizedEmail;
}

export function captureDemoLead(email: string, context: LeadContext, request: typeof fetch = fetch) {
  return captureLead(email, context, 'Demo Subscriber', request);
}
