import { test, expect } from '@playwright/test';

/**
 * Form submission tests targeting the actual DOM structure in:
 *   - src/components/LeadMagnetForm.astro  (blog lead magnets)
 *   - src/components/home/CTA.astro        (homepage bottom CTA, id="cta-bento-form")
 *   - src/components/home/Hero.astro       (homepage hero, id="hero-bento-form")
 */

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
  test('submits email to /api/bento-track and opens Calendly', async ({ page }) => {
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

    // Capture the URL that window.open is called with instead of actually opening a tab.
    // This avoids waiting for a flaky popup page event.
    await page.addInitScript(() => {
      (window as any).__openedUrls = [];
      window.open = (url?: string | URL) => {
        (window as any).__openedUrls.push(typeof url === 'string' ? url : url?.toString() ?? '');
        return null;
      };
    });

    await page.goto('/');

    // The bottom CTA is an Astro component with id="cta-bento-form"
    // (src/components/home/CTA.astro line 21)
    const ctaForm = page.locator('#cta-bento-form');
    await ctaForm.scrollIntoViewIfNeeded();
    // STRICT: form must exist — no conditional guard.
    await expect(ctaForm).toBeVisible();

    await ctaForm.locator('input[name="email"]').fill('e2e-test@datadocks.com');
    await ctaForm.locator('button[type="submit"]').click();

    // The CTA.astro script calls window.open(calendlyUrl, '_blank', 'noopener')
    // Retrieve the captured URL from the stubbed window.open — no popup event dependency.
    const openedUrls: string[] = await page.evaluate(() => (window as any).__openedUrls || []);
    expect(openedUrls.length).toBeGreaterThan(0);
    expect(openedUrls[0]).toContain('calendly.com');

    // Verify the Bento payload
    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-test@datadocks.com');
    expect((bentoPayload as Record<string, unknown>).event).toBe('Demo Subscriber');
  });
});


test.describe('Hero Form (Homepage — above the fold)', () => {
  test('submits email to /api/bento-track and opens Calendly', async ({ page }) => {
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

    await page.addInitScript(() => {
      (window as any).__openedUrls = [];
      window.open = (url?: string | URL) => {
        (window as any).__openedUrls.push(typeof url === 'string' ? url : url?.toString() ?? '');
        return null;
      };
    });

    await page.goto('/');

    // The hero form has id="hero-bento-form" (src/components/home/Hero.astro)
    const heroForm = page.locator('#hero-bento-form');
    // STRICT: this is above the fold — if it doesn't exist the routing/content model broke.
    await expect(heroForm).toBeVisible();

    await heroForm.locator('input[name="email"]').fill('e2e-hero@datadocks.com');
    await heroForm.locator('button[type="submit"]').click();

    // Hero form also calls window.open with the Calendly URL
    const openedUrls: string[] = await page.evaluate(() => (window as any).__openedUrls || []);
    expect(openedUrls.length).toBeGreaterThan(0);
    expect(openedUrls[0]).toContain('calendly.com');

    // Verify Bento payload
    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-hero@datadocks.com');
  });
});
