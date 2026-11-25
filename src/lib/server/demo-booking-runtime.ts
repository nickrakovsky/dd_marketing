import { DemoAuth } from './demo-auth';
import { demoResponse } from './demo-api';
import { BookingStore, BookingProcessor } from './demo-booking';
import { createBookingApi } from './demo-booking-api';
import { CalendlyDemoClient } from './demo-calendly';
import { D1DemoStore } from './demo-store';
import type { DemoEnvironment } from './demo-runtime';

export function bookingRuntime(env: DemoEnvironment) {
  const { DEMO_DB: db, DEMO_ALLOWED_ORIGIN: origin, DEMO_SIGNING_SECRET: secret } = env;
  if (!db || !secret || secret.length < 32 || !['https://datadocks.com', 'https://www.datadocks.com'].includes(origin || '')) throw new Error('Missing runtime');
  const store = new BookingStore(db), limits = new D1DemoStore(db);
  let processor: BookingProcessor | null = null;
  if (env.DEMO_BOOKING_ENABLED === 'true') {
    const hosts = (env.CALENDLY_HOSTS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!env.CALENDLY_TOKEN || !/^https:\/\/api\.calendly\.com\/event_types\/[A-Za-z0-9_-]{8,80}$/.test(env.CALENDLY_EVENT_TYPE || '')
      || !hosts.length || !hosts.every(value => /^https:\/\/api\.calendly\.com\/users\/[A-Za-z0-9_-]{8,80}$/.test(value))) throw new Error('Missing Calendly configuration');
    processor = new BookingProcessor(store, new CalendlyDemoClient(env.CALENDLY_TOKEN), { eventType: env.CALENDLY_EVENT_TYPE!, hosts });
  }
  const support = env.DEMO_SUPPORT_URL;
  if (support && (new URL(support).protocol !== 'https:' || new URL(support).username || new URL(support).password)) throw new Error('Invalid support URL');
  return { store, processor, handle: createBookingApi(store, limits, processor, new DemoAuth(secret), origin!, support) };
}
export async function handleBookingRequest(request: Request, env: DemoEnvironment | undefined, development: boolean) {
  if (development || !env || (env.DEMO_CAPTURE_ENABLED !== 'true' && env.DEMO_BOOKING_ENABLED !== 'true')) return demoResponse({ error: 'booking_disabled' }, 503);
  try { return await bookingRuntime(env).handle(request); }
  catch { return demoResponse({ error: 'temporarily_unavailable' }, 503); }
}
