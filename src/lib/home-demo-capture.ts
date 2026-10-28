interface DemoContext {
  source: string;
  landingPage: string;
  visitorUuid?: string | null;
  attribution?: { first: Record<string, unknown>; last: Record<string, unknown> };
}

/** A locally remembered email is not proof that the lead was saved. */
export async function captureDemoLead(email: string, context: DemoContext, request: typeof fetch = fetch) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  const response = await request('/api/bento-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      event: 'Demo Subscriber',
      source: context.source,
      landingPage: context.landingPage,
      visitorUuid: context.visitorUuid,
      firstTouch: context.attribution?.first,
      lastTouch: context.attribution?.last,
    }),
    signal: AbortSignal.timeout(15000),
    keepalive: true,
  });
  // This endpoint can return HTTP 200 with ok:false. Check both layers.
  if (!response.ok || (await response.json()).ok !== true) {
    throw new Error('We couldn’t save your email. Please try again.');
  }
  return normalizedEmail;
}
