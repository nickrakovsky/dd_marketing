import { DemoAuth } from './demo-auth';
import { BentoDemoClient } from './demo-bento';
import { createDemoApi, demoResponse } from './demo-api';
import { DemoProcessor } from './demo-processor';
import { D1DemoStore } from './demo-store';
import type { DemoDatabase } from './demo-store';

export interface DemoEnvironment {
  DEMO_BOOKING_ENABLED?: string;
  DEMO_VERIFICATION_PAGE_ENABLED?: string;
  DEMO_SUPPORT_URL?: string;
  CALENDLY_TOKEN?: string;
  CALENDLY_EVENT_TYPE?: string;
  CALENDLY_HOSTS?: string;
  DEMO_CAPTURE_ENABLED?: string;
  DEMO_RECONCILE_ENABLED?: string;
  DEMO_ALLOWED_ORIGIN?: string;
  DEMO_SIGNING_SECRET?: string;
  DEMO_DB?: DemoDatabase;
  PUBLIC_BENTO_SITE_UUID?: string;
  BENTO_PUBLISHABLE_KEY?: string;
  BENTO_SECRET_KEY?: string;
}

export function demoRuntime(env: DemoEnvironment) {
  const { DEMO_DB: db, DEMO_ALLOWED_ORIGIN: origin, DEMO_SIGNING_SECRET: secret,
    PUBLIC_BENTO_SITE_UUID: siteUuid, BENTO_PUBLISHABLE_KEY: publishableKey, BENTO_SECRET_KEY: secretKey } = env;
  if (!db || !secret || secret.length < 32 || !siteUuid || !publishableKey || !secretKey
    || !['https://datadocks.com', 'https://www.datadocks.com'].includes(origin || '')) throw new Error('Demo runtime is not configured');
  const store = new D1DemoStore(db);
  const processor = new DemoProcessor(store, new BentoDemoClient({ siteUuid, publishableKey, secretKey }));
  return { processor, handle: createDemoApi(store, processor, new DemoAuth(secret), origin!) };
}

export async function handleDemoRequest(request: Request, env: DemoEnvironment | undefined, development: boolean) {
  // Local/CI interaction tests inject fakes directly into createDemoApi. The
  // deployed adapter never falls back to local .env credentials.
  if (development || env?.DEMO_CAPTURE_ENABLED !== 'true') return demoResponse({ error: 'demo_flow_disabled' }, 503);
  try { return await demoRuntime(env).handle(request); }
  catch { return demoResponse({ error: 'temporarily_unavailable' }, 503); }
}
