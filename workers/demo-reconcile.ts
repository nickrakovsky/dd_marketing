import { demoRuntime } from '../src/lib/server/demo-runtime';
import { bookingRuntime } from '../src/lib/server/demo-booking-runtime';
import { reportBooking } from '../src/lib/server/demo-booking-report';
import { D1DemoStore } from '../src/lib/server/demo-store';
import type { DemoEnvironment } from '../src/lib/server/demo-runtime';

export default {
  async scheduled(_event: unknown, env: DemoEnvironment) {
    if (env.DEMO_RECONCILE_ENABLED !== 'true') return;
    // Independent failures: a CRM outage must never stop cancellation reconciliation.
    try { await demoRuntime(env).processor.reconcile(2); }
    catch { console.error('[demo-reconcile] CRM processing unavailable'); }
    if (env.DEMO_BOOKING_ENABLED !== 'true') return;
    const runtime = bookingRuntime(env);
    const credentials = env.PUBLIC_BENTO_SITE_UUID && env.BENTO_PUBLISHABLE_KEY && env.BENTO_SECRET_KEY
      ? { siteUuid: env.PUBLIC_BENTO_SITE_UUID, publishableKey: env.BENTO_PUBLISHABLE_KEY, secretKey: env.BENTO_SECRET_KEY } : undefined;
    for (const id of await runtime.store.due(Date.now(), 2)) {
      try {
        await runtime.processor!.advance(id);
        await reportBooking(runtime.store, new D1DemoStore(env.DEMO_DB!), id, credentials);
      } catch { console.error('[demo-reconcile] Booking processing deferred', id); }
    }
  },
};
