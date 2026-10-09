import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { captureDemoLead } from './home-demo-capture';
import { CALENDLY_BOOKING_URL, CALENDLY_BOOKING_FRAGMENT, CALENDLY_BRAND_COLOR } from './calendly-config.mjs';
import { VENDOR_ASSETS } from './vendor-assets.mjs';

// Execute the actual inline attribution/booking script without opening a browser
// or making any network requests.
const layout = readFileSync('src/layouts/Layout.astro', 'utf8');
const attributionScript = [...layout.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .find(script => script.includes('window.ddGetAttribution ='));
if (!attributionScript) throw new Error('Layout attribution script is missing');

const campaignPaths = ['/outbound-dock-management', '/inbound-dock-management'];
const originalTouch = { landing: '/', utm_source: 'newsletter', utm_medium: 'email' };
type Message = { origin: string; data: { event: string } };
interface AttributionWindow {
  location: URL;
  addEventListener: (name: string, listener: (event: Message) => void) => void;
  ddGetDemoLandingPage: () => string;
  ddGetAttribution: () => { first: Record<string, unknown>; last: Record<string, unknown> };
  ddSetEmail: (email: string) => void;
}

function setup({
  mode = 'page',
  url = 'https://datadocks.com/',
  storedLanding,
  blockedStorage = false,
}: {
  mode?: 'session' | 'page';
  url?: string;
  storedLanding?: string;
  blockedStorage?: boolean;
} = {}) {
  const session = new Map(storedLanding ? [['dd_landing_page', storedLanding]] : []);
  const local = new Map([['dd_first_touch', JSON.stringify(originalTouch)]]);
  const storage = (values: Map<string, string>) => ({
    getItem(key: string) {
      if (blockedStorage) throw new Error('Storage is unavailable');
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (blockedStorage) throw new Error('Storage is unavailable');
      values.set(key, value);
    },
  });
  const listeners = new Map<string, (event: Message) => void>();
  // The inline script installs the attribution methods when it runs in this mock window.
  const browser = {
    location: new URL(url),
    addEventListener: (name: string, listener: (event: Message) => void) => listeners.set(name, listener),
  } as unknown as AttributionWindow;
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"ok":true}'));
  runInNewContext(attributionScript!, {
    window: browser,
    document: {
      referrer: '',
      cookie: '',
      documentElement: { dataset: { demoAttribution: mode } },
      addEventListener: vi.fn(),
    },
    sessionStorage: storage(session),
    localStorage: storage(local),
    URL,
    URLSearchParams,
    fetch: request,
    CALENDLY_BOOKING_URL,
    CALENDLY_BOOKING_FRAGMENT,
    CALENDLY_BRAND_COLOR,
    VENDOR_ASSETS,
  });
  return { browser, request, listeners, session };
}

describe.each(campaignPaths)('campaign demo page attribution: %s', campaign => {
  const campaignName = campaign.slice(1);
  const campaignURL = `https://datadocks.com${campaign}?utm_source=google&utm_medium=cpc&utm_campaign=${campaignName}&gclid=test-click`;
  const sisterCampaign = campaignPaths.find(path => path !== campaign)!;
  it.each([undefined, 'https://datadocks.com/', `https://datadocks.com${sisterCampaign}`])(
    'identifies the campaign for capture and booking with prior landing %s',
    async storedLanding => {
      const { browser, request, listeners, session } = setup({ storedLanding, url: campaignURL });
      await captureDemoLead('operator@example.com', {
        source: browser.location.pathname,
        landingPage: browser.ddGetDemoLandingPage(),
        attribution: browser.ddGetAttribution(),
      }, request);
      browser.ddSetEmail('operator@example.com');
      listeners.get('message')!({
        origin: 'https://calendly.com',
        data: { event: 'calendly.event_scheduled' },
      });

      expect(request).toHaveBeenCalledTimes(2);
      const payloads = request.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
      expect(payloads.map(payload => payload.event)).toEqual(['Demo Subscriber', 'demo_booked']);
      for (const payload of payloads) {
        expect(payload).toMatchObject({
          source: campaign,
          landingPage: campaignURL,
          firstTouch: originalTouch,
          lastTouch: { landing: campaign, utm_source: 'google', utm_campaign: campaignName },
        });
      }
      expect(session.get('dd_landing_page')).toBe(storedLanding || campaignURL);
    },
  );

  it('still identifies the campaign when browser storage is unavailable', async () => {
    const { browser, request } = setup({ blockedStorage: true, url: campaignURL });
    await captureDemoLead('operator@example.com', {
      source: browser.location.pathname,
      landingPage: browser.ddGetDemoLandingPage(),
      attribution: browser.ddGetAttribution(),
    }, request);
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({
      source: campaign,
      landingPage: campaignURL,
    });
  });
});

it('preserves session-landing attribution on pages that do not opt in', () => {
  const { browser } = setup({
    mode: 'session',
    url: 'https://datadocks.com/',
    storedLanding: 'https://datadocks.com/posts/example',
  });
  expect(browser.ddGetDemoLandingPage()).toBe('https://datadocks.com/posts/example');
});
