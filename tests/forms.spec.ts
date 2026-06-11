import { test, expect } from '@playwright/test';
import { BENTO_FORWARDED_METHODS } from '../src/lib/bento-config.mjs';

/**
 * Form submission tests targeting the actual DOM structure in:
 *   - src/components/LeadMagnetForm.astro  (blog lead magnets)
 *   - src/components/home/CTA.astro        (homepage bottom CTA, id="cta-bento-form")
 *   - src/components/home/Hero.astro       (homepage hero, id="hero-bento-form")
 */

test.describe('Bento SDK via Partytown', () => {
  // Validates that the Partytown forward list in astro.config.mjs covers every method
  // we care about. If the SDK fails to load (e.g. blocked by CSP, Partytown misconfig,
  // or forward list drift), the `window.bento.<method>` proxy stubs won't exist and
  // this test fails — the only automated signal we have that Bento is wired up.
  test('forwarded methods are available on window.bento', async ({ page }) => {
    await page.goto('/');

    // Partytown creates proxy stubs on window.bento for every forwarded method,
    // queuing calls until the worker-side SDK is ready. Wait up to 10s — the
    // script is deferred and the worker takes a moment to spin up.
    await page.waitForFunction(
      () => typeof (window as { bento?: unknown }).bento !== 'undefined',
      null,
      { timeout: 10_000 }
    );

    for (const method of BENTO_FORWARDED_METHODS) {
      const type = await page.evaluate(
        (m) => typeof (window as { bento?: Record<string, unknown> }).bento?.[m],
        method
      );
      expect(type, `window.bento.${method} should be a function (forward list drift?)`).toBe('function');
    }
  });

  test('form submit triggers a Bento network request', async ({ page }) => {
    // Capture any outbound request whose URL includes bentonow.com — covers both
    // the main-thread SDK load (fast.bentonow.com) and the server-side proxy
    // (/api/bento-track → app.bentonow.com). This is the end-to-end validation
    // that a form submit actually reaches Bento infrastructure.
    const bentoRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('bentonow.com') || url.includes('/api/bento-track')) {
        bentoRequests.push(url);
      }
    });

    await page.addInitScript(() => {
      window.open = () => null;
    });

    await page.goto('/');

    const heroForm = page.locator('#hero-bento-form');
    await expect(heroForm).toBeVisible();
    await heroForm.locator('input[name="email"]').fill('bento-e2e@datadocks.com');
    await heroForm.locator('button[type="submit"]').click();

    // Give the network a moment to flush (form uses keepalive: true)
    await page.waitForTimeout(1500);

    expect(
      bentoRequests.length,
      `No Bento-bound requests captured — Partytown worker or server proxy may be broken. Saw: ${JSON.stringify(bentoRequests)}`
    ).toBeGreaterThan(0);
  });
});


test.describe('LeadMagnetForm (Blog Posts)', () => {
  // carrier-scorecards embeds multiple LeadMagnetForm instances — confirmed source of truth
  const TEST_POST = '/posts/carrier-scorecards';

  test('submits email to /api/bento-track and shows success state', async ({ page }) => {
    let bentoPayload: Record<string, unknown> | null = null;

    // Intercept the server-side Bento proxy (the real endpoint the form POSTs to)
    await page.route('**/api/bento-track', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        bentoPayload = JSON.parse(req.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Stub window.open so the PDF redirect doesn't open a real tab and doesn't
    // cause the test to flake waiting for a popup event. Capture the URL for assertion.
    await page.addInitScript(() => {
      (window as any).__openedUrls = [];
      window.open = (url?: string | URL) => {
        (window as any).__openedUrls.push(typeof url === 'string' ? url : url?.toString() ?? '');
        return null;
      };
    });

    await page.goto(TEST_POST);

    // LeadMagnetForm renders <form class="lead-magnet-form"> inside
    // <div class="lead-magnet-container">. The post has multiple — target the first visible one.
    const form = page.locator('form.lead-magnet-form').first();
    // STRICT: if this form doesn't exist on the URL, the test must fail — no silent return.
    await expect(form).toBeVisible();

    // Fill and submit
    await form.locator('input[name="email"]').fill('e2e-test@datadocks.com');
    await form.locator('button[type="submit"]').click();

    // After submit the inline script:
    //   1. Hides the form (adds class "hidden", removes "block")
    //   2. Shows .success-message inside the same .lead-magnet-container
    const container = page.locator('.lead-magnet-container').first();
    await expect(container.locator('.success-message')).toBeVisible({ timeout: 5000 });
    await expect(form).toBeHidden();

    // Verify the intercepted Bento payload has the right shape
    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-test@datadocks.com');
    expect((bentoPayload as Record<string, unknown>).event).toBeTruthy();
    expect((bentoPayload as Record<string, unknown>).source).toContain('/posts/carrier-scorecards');

    // The form triggers window.open(redirectUrl) — assert the PDF URL was targeted
    const openedUrls: string[] = await page.evaluate(() => (window as any).__openedUrls || []);
    expect(openedUrls.length).toBeGreaterThan(0);
    expect(openedUrls[0]).toContain('Carrier_Scorecard');
  });
});


test.describe('CTA Form (Homepage — bottom section)', () => {
  test('submits email to /api/bento-track and opens Calendly popup', async ({ page }) => {
    let bentoPayload: Record<string, unknown> | null = null;

    await page.route('**/api/bento-track', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        bentoPayload = JSON.parse(req.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Block the real Calendly widget assets and stub initPopupWidget so we
    // can capture the call without depending on Calendly's CDN.
    await page.route('https://assets.calendly.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      (window as any).__calendlyCalls = [];
      (window as any).Calendly = {
        initPopupWidget: (opts: { url: string }) => {
          (window as any).__calendlyCalls.push(opts);
        },
      };
    });

    await page.goto('/');

    const ctaForm = page.locator('#cta-bento-form');
    await ctaForm.scrollIntoViewIfNeeded();
    await expect(ctaForm).toBeVisible();

    await ctaForm.locator('input[name="email"]').fill('e2e-test@datadocks.com');
    await ctaForm.locator('button[type="submit"]').click();

    // Wait for the form's Calendly popup invocation to land.
    await expect.poll(async () =>
      page.evaluate(() => ((window as any).__calendlyCalls || []).length)
    ).toBeGreaterThan(0);

    const calls: Array<{ url: string }> = await page.evaluate(
      () => (window as any).__calendlyCalls || []
    );
    expect(calls[0].url).toContain('calendly.com');

    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-test@datadocks.com');
    expect((bentoPayload as Record<string, unknown>).event).toBe('Demo Subscriber');
  });
});


test.describe('Hero Form (Homepage — above the fold)', () => {
  test('submits email to /api/bento-track and opens Calendly popup', async ({ page }) => {
    let bentoPayload: Record<string, unknown> | null = null;

    await page.route('**/api/bento-track', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        bentoPayload = JSON.parse(req.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('https://assets.calendly.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      (window as any).__calendlyCalls = [];
      (window as any).Calendly = {
        initPopupWidget: (opts: { url: string }) => {
          (window as any).__calendlyCalls.push(opts);
        },
      };
    });

    await page.goto('/');

    const heroForm = page.locator('#hero-bento-form');
    await expect(heroForm).toBeVisible();

    await heroForm.locator('input[name="email"]').fill('e2e-hero@datadocks.com');
    await heroForm.locator('button[type="submit"]').click();

    await expect.poll(async () =>
      page.evaluate(() => ((window as any).__calendlyCalls || []).length)
    ).toBeGreaterThan(0);

    const calls: Array<{ url: string }> = await page.evaluate(
      () => (window as any).__calendlyCalls || []
    );
    expect(calls[0].url).toContain('calendly.com');

    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-hero@datadocks.com');
  });
});
