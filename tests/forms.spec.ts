import { test, expect } from '@playwright/test';
import { BENTO_FORWARDED_METHODS } from '../src/lib/bento-config.mjs';

/**
 * Form submission tests targeting the actual DOM structure in:
 *   - src/components/LeadMagnetForm.astro  (blog lead magnets)
 *   - src/components/home/CTA.astro        (homepage bottom CTA, id="cta-bento-form")
 *   - src/components/pages/HomePage.astro  (homepage hero, id="book-demo")
 */

test.describe('Bento SDK', () => {
  // Bento is no longer loaded via Partytown (see Layout.astro and
  // src/pages/bento-loader.ts/bento-sdk.ts/bento-events/ for why: Bento's own
  // loading chain is CORS/ORB-blocked at three separate hops, and Partytown's
  // unconditional shim creation was masking that by making window.bento
  // "exist" as a dead stub regardless of whether the real SDK ever loaded).
  // window.bento now only becomes real once /bento-loader -> /bento-sdk
  // actually execute, which requires PUBLIC_BENTO_SITE_UUID to be set.
  //
  // That env var is Production-only in Cloudflare Pages (confirmed: absent
  // from local dev and from preview deployments alike) -- deliberately, so
  // CI runs against a preview URL don't transmit real events into Bento.
  // Since this suite runs against the preview URL, Bento's script tag is
  // never even rendered here, and that's correct, not a bug. So this test
  // first checks whether the page rendered the block at all (via
  // window.bentoSettings, set synchronously in the same conditional as the
  // script tag) and skips with a clear reason if not, rather than waiting
  // out a timeout for something this environment was never going to have.
  // Where the env var IS present (production), it verifies the real SDK
  // object, not a stub -- every forwarded method must be an actual function.
  test('forwarded methods are available on window.bento, where Bento is configured', async ({ page }) => {
    await page.goto('/');

    const configured = await page.evaluate(() => typeof (window as { bentoSettings?: unknown }).bentoSettings !== 'undefined');
    test.skip(!configured, 'PUBLIC_BENTO_SITE_UUID not set in this environment (expected on preview deploys) — Bento script is not rendered');

    // Real network round trip (this env -> /bento-loader -> /bento-sdk), not
    // a synchronously-created stub, so give it a few seconds.
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
      expect(type, `window.bento.${method} should be a function (SDK failed to load, or forward list drift?)`).toBe('function');
    }
  });

  test('form submit sends the demo capture request to the Bento proxy', async ({ page }) => {
    // Assert the actual form POST, not an unrelated SDK asset request.
    // Fulfill it locally so tests never create a real lead.
    await page.route('**/api/bento-track', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.route('https://assets.calendly.com/**', route => route.abort());
    await page.addInitScript(() => {
      window.open = () => null;
      window.Calendly = { initPopupWidget() {} };
    });
    await page.goto('/');

    const heroForm = page.locator('form#book-demo');
    await expect(heroForm).toBeVisible();
    await heroForm.locator('input[name="email"]').fill('bento-e2e@example.com');
    const [request] = await Promise.all([
      page.waitForRequest(req => new URL(req.url()).pathname === '/api/bento-track' && req.method() === 'POST'),
      heroForm.locator('button[type="submit"]').click(),
    ]);
    expect(request.postDataJSON()).toMatchObject({
      email: 'bento-e2e@example.com',
      event: 'Demo Subscriber',
      source: '/',
    });
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

    const heroForm = page.locator('form#book-demo');
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
