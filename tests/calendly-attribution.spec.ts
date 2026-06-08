import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Calendly booking-flow tests, split into two suites:
 *
 *   1. "Calendly entry points (mocked)" — runs on every PR.
 *      Stubs Calendly's CDN and `window.Calendly` so the test never depends
 *      on Calendly's uptime. Asserts that every page surface — desktop nav,
 *      mobile nav, hero email form, footer email form, blog post link,
 *      integrations CTA, about page CTA — calls `Calendly.initPopupWidget`
 *      with our booking URL when clicked.
 *
 *      This catches *our* regressions: a broken click handler, a typo in the
 *      booking URL, a layout change that strips the link, the Layout.astro
 *      script accidentally being removed.
 *
 *   2. "Calendly is actually reachable (live)" — only runs when
 *      RUN_LIVE_CALENDLY=1 is set. Hits Calendly's real CDN and asserts
 *      the iframe loads with a 200 response. Use in a nightly cron, not on
 *      every PR — Calendly outages shouldn't block merges.
 *
 * Local run:
 *   npm run dev (separate terminal)
 *   PLAYWRIGHT_BASE_URL=http://localhost:4321 npx playwright test calendly-attribution
 *
 *   To include the live test:
 *   PLAYWRIGHT_BASE_URL=http://localhost:4321 RUN_LIVE_CALENDLY=1 npx playwright test calendly-attribution
 */

const BOOKING_URL_FRAGMENT = 'calendly.com/nick-rakovsky/datadocks-demo';

type CalendlyCall = { url: string; utm?: Record<string, string> };

declare global {
  interface Window {
    __calendlyCalls?: CalendlyCall[];
    __openCount?: number;
    Calendly?: { initPopupWidget: (opts: { url: string; utm?: Record<string, string> }) => void };
  }
}

/**
 * Replaces the real Calendly widget with a stub that records every
 * `initPopupWidget` invocation, and blocks all assets.calendly.com requests
 * so the test is offline-safe. Also tracks window.open calls so we can
 * detect when interception fails and a click falls through to a new tab.
 */
async function stubCalendly(page: Page) {
  await page.route('https://assets.calendly.com/**', (route) => route.abort());
  await page.addInitScript(() => {
    window.__calendlyCalls = [];
    window.__openCount = 0;
    window.Calendly = {
      initPopupWidget: (opts) => {
        window.__calendlyCalls!.push(opts);
      },
    };
    const realOpen = window.open;
    window.open = ((...args: Parameters<typeof realOpen>) => {
      window.__openCount = (window.__openCount ?? 0) + 1;
      return realOpen.apply(window, args);
    }) as typeof window.open;
  });
}

async function getCalendlyCalls(page: Page): Promise<CalendlyCall[]> {
  return page.evaluate(() => window.__calendlyCalls ?? []);
}

async function getOpenCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__openCount ?? 0);
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

test.describe('Calendly entry points (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    await stubCalendly(page);
  });

  test('desktop nav "Schedule a Demo" button opens the popup', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/');

    await page.locator(`nav a[href*="${BOOKING_URL_FRAGMENT}"]`).first().click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
    const calls = await getCalendlyCalls(page);
    expect(calls[0].url).toContain(BOOKING_URL_FRAGMENT);
    expect(await getOpenCount(page)).toBe(0);
  });

  test('mobile nav "Schedule a Demo" button opens the popup', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');

    // Open the hamburger menu
    await page.locator('[data-mobile-toggle]').click();

    // The mobile menu has its own Calendly link (Navigation.astro:151)
    const mobileMenu = page.locator('[data-mobile-menu]');
    await expect(mobileMenu).toBeVisible();
    await mobileMenu.locator(`a[href*="${BOOKING_URL_FRAGMENT}"]`).click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
    expect(await getOpenCount(page)).toBe(0);
  });

  test('hero email form submission opens the popup (desktop)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    // Stub the Bento proxy so the form's fetch doesn't hit the real backend
    await page.route('**/api/bento-track', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/');

    const heroForm = page.locator('#hero-bento-form');
    await expect(heroForm).toBeVisible();
    await heroForm.locator('input[name="email"]').fill('test-hero@datadocks.com');
    await heroForm.locator('button[type="submit"]').click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
    const calls = await getCalendlyCalls(page);
    expect(calls[0].url).toContain(BOOKING_URL_FRAGMENT);
  });

  test('hero email form submission opens the popup (mobile)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.route('**/api/bento-track', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/');

    const heroForm = page.locator('#hero-bento-form');
    await expect(heroForm).toBeVisible();
    await heroForm.locator('input[name="email"]').fill('test-hero-mobile@datadocks.com');
    await heroForm.locator('button[type="submit"]').click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
  });

  test('footer CTA email form submission opens the popup', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.route('**/api/bento-track', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/');

    const ctaForm = page.locator('#cta-bento-form');
    await ctaForm.scrollIntoViewIfNeeded();
    await ctaForm.locator('input[name="email"]').fill('test-cta@datadocks.com');
    await ctaForm.locator('button[type="submit"]').click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
  });

  // Auto-discover every blog post that contains a Calendly link. Self-
  // maintaining: a new post with a "Book a demo" link gets a test for free.
  // If you remove a Calendly link from every post the discovery returns []
  // and Playwright would skip silently — that's why the canary `expect`
  // below asserts at least one post was found.
  const POSTS_DIR = join(process.cwd(), 'src/content/posts');
  const postsWithCalendly = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .filter((f) => readFileSync(join(POSTS_DIR, f), 'utf8').includes(BOOKING_URL_FRAGMENT))
    .map((f) => f.replace(/\.mdx$/, ''));

  test('discovery sanity: at least one post contains a Calendly link', () => {
    expect(
      postsWithCalendly.length,
      'No blog posts with Calendly links found — auto-discovery may be looking at the wrong directory'
    ).toBeGreaterThan(0);
  });

  for (const slug of postsWithCalendly) {
    test(`blog post /${slug}: Calendly link is intercepted`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`/posts/${slug}`);

      const link = page.locator(`article a[href*="${BOOKING_URL_FRAGMENT}"]`).first();
      await link.scrollIntoViewIfNeeded();
      await link.click();

      await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
      expect(
        await getOpenCount(page),
        `Blog post /${slug} Calendly link must route through the popup — falling through to window.open loses UTMs`
      ).toBe(0);
    });
  }

  test('about page CTA opens the popup', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/about');

    await page.locator(`a[href*="${BOOKING_URL_FRAGMENT}"]`).first().click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
  });

  test('integrations page CTA opens the popup', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    // Use a known integration slug from src/content/integrations/
    await page.goto('/integrations/microsoft-power-bi');

    await page.locator(`a[href*="${BOOKING_URL_FRAGMENT}"]`).first().click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
  });

  test('first-touch UTMs are forwarded to Calendly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=q4_demo');

    await page.locator(`nav a[href*="${BOOKING_URL_FRAGMENT}"]`).first().click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
    const calls = await getCalendlyCalls(page);
    expect(calls[0].utm?.utmSource).toBe('google');
    expect(calls[0].utm?.utmMedium).toBe('cpc');
    expect(calls[0].utm?.utmCampaign).toBe('q4_demo');
  });

  test('first-touch survives a direct return visit', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // First visit with UTMs
    await page.goto('/?utm_source=linkedin&utm_medium=social&utm_campaign=launch');
    // Direct return visit
    await page.goto('/');

    await page.locator(`nav a[href*="${BOOKING_URL_FRAGMENT}"]`).first().click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
    const calls = await getCalendlyCalls(page);
    expect(
      calls[0].utm?.utmSource,
      'first-touch must persist across direct returns — this is the whole point of localStorage'
    ).toBe('linkedin');
    expect(calls[0].utm?.utmCampaign).toBe('launch');
  });

  test('hero form submission stores email and pre-fills Calendly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.route('**/api/bento-track', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/');

    const heroForm = page.locator('#hero-bento-form');
    await heroForm.locator('input[name="email"]').fill('lead@datadocks.com');
    await heroForm.locator('button[type="submit"]').click();

    await expect.poll(() => getCalendlyCalls(page)).toHaveLength(1);
    const calls = await getCalendlyCalls(page);
    expect(
      (calls[0] as { prefill?: { email?: string } }).prefill?.email,
      'Email captured by form should pre-fill the Calendly booking form'
    ).toBe('lead@datadocks.com');
  });
});

test.describe('Calendly funnel tracking', () => {
  test('all four funnel events fire to dataLayer', async ({ page }) => {
    await page.goto('/?utm_source=meta&utm_campaign=funnel_test');

    const stages = [
      { calendly: 'calendly.profile_page_viewed', dd: 'demo_profile_viewed' },
      { calendly: 'calendly.event_type_viewed', dd: 'demo_event_type_viewed' },
      { calendly: 'calendly.date_and_time_selected', dd: 'demo_date_selected' },
      { calendly: 'calendly.event_scheduled', dd: 'demo_booked' },
    ];

    for (const stage of stages) {
      await page.evaluate((calendlyEvent) => {
        const ev = new MessageEvent('message', {
          data: { event: calendlyEvent },
          origin: 'https://calendly.com',
        });
        window.dispatchEvent(ev);
      }, stage.calendly);
    }

    const dataLayer = await page.evaluate(
      () => (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer || []
    );

    for (const stage of stages) {
      const entry = dataLayer.find((e) => e.event === stage.dd);
      expect(entry, `${stage.dd} missing from dataLayer — funnel tracking is broken`).toBeDefined();
      expect(entry?.first_utm_source).toBe('meta');
      expect(entry?.funnel_stage).toBe(stage.dd);
    }
  });

  test('funnel events fire to Bento when email is known', async ({ page }) => {
    const bentoCalls: Array<{ email: string; event: string }> = [];
    await page.route('**/api/bento-track', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        bentoCalls.push({ email: body.email, event: body.event });
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/');
    // Simulate prior form capture
    await page.evaluate(() => (window as Window).ddGetEmail && localStorage.setItem('dd_known_email', 'abandoner@datadocks.com'));

    // User views the calendar then drops off — never books
    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { event: 'calendly.date_and_time_selected' },
        origin: 'https://calendly.com',
      }));
    });

    // Allow keepalive fetch to flush
    await page.waitForTimeout(500);

    const stalled = bentoCalls.find((c) => c.event === 'demo_date_selected');
    expect(
      stalled,
      'Bento should receive demo_date_selected for known emails — this is what enables abandonment follow-up'
    ).toBeDefined();
    expect(stalled?.email).toBe('abandoner@datadocks.com');
  });

  test('funnel stages dedupe within a page load', async ({ page }) => {
    await page.goto('/');

    // Simulate Calendly firing the same stage 3 times (e.g. user opens, closes,
    // reopens the popup). We should only see ONE entry in dataLayer per stage.
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(new MessageEvent('message', {
          data: { event: 'calendly.date_and_time_selected' },
          origin: 'https://calendly.com',
        }));
      }
    });

    const dataLayer = await page.evaluate(
      () => (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer || []
    );
    const dateSelected = dataLayer.filter((e) => e.event === 'demo_date_selected');
    expect(
      dateSelected,
      'demo_date_selected should fire exactly once per page load even when Calendly emits multiple times'
    ).toHaveLength(1);
  });

  test('messages from non-calendly.com origins are ignored', async ({ page }) => {
    await page.goto('/');

    // An attacker injects a message claiming to be Calendly but from a
    // different origin. Substring origin matching ('calendly.com') would have
    // accepted https://calendly.com.evil.example — strict matching rejects it.
    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { event: 'calendly.event_scheduled' },
        origin: 'https://calendly.com.evil.example',
      }));
    });

    const dataLayer = await page.evaluate(
      () => (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer || []
    );
    expect(
      dataLayer.find((e) => e.event === 'demo_booked'),
      'demo_booked should NOT fire for messages from non-calendly.com origins'
    ).toBeUndefined();
  });

  test('funnel events do NOT hit Bento for anonymous visitors', async ({ page }) => {
    let bentoHit = false;
    await page.route('**/api/bento-track', async (route) => {
      bentoHit = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/');
    // No email captured — anonymous visitor
    await page.evaluate(() => localStorage.removeItem('dd_known_email'));

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { event: 'calendly.date_and_time_selected' },
        origin: 'https://calendly.com',
      }));
    });

    await page.waitForTimeout(500);
    expect(bentoHit, 'Anonymous visitors should not generate Bento records — no email to send to').toBe(false);
  });
});

/**
 * Live test — only runs when RUN_LIVE_CALENDLY=1. Hits Calendly's real CDN.
 * Use this in a nightly cron, not on every PR. If this fails on its own it
 * means Calendly is degraded (or our handle changed); you'd want to know
 * but it shouldn't block PR merges.
 */
test.describe('Calendly is actually reachable (live)', () => {
  test.skip(
    !process.env.RUN_LIVE_CALENDLY,
    'Live Calendly test skipped — set RUN_LIVE_CALENDLY=1 to enable'
  );

  test('the booking URL returns 200 from calendly.com', async ({ request }) => {
    // Direct HTTP fetch — much faster and more reliable than driving the
    // browser through their full widget flow. If this returns anything other
    // than 200, the booking handle is broken (renamed, deleted, paused) and
    // every demo CTA on the site is dead.
    const res = await request.get(`https://${BOOKING_URL_FRAGMENT}`);
    expect(
      res.status(),
      `Calendly booking URL https://${BOOKING_URL_FRAGMENT} returned ${res.status()} — bookings are broken`
    ).toBe(200);
  });
});
