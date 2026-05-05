import { test, expect } from '@playwright/test';

/**
 * Form submission tests targeting the actual DOM structure in:
 *   - src/components/LeadMagnetForm.astro  (blog lead magnets)
 *   - src/components/home/CTA.astro        (homepage bottom CTA, id="cta-bento-form")
 */

test.describe('LeadMagnetForm (Blog Posts)', () => {
  // carrier-scorecards is a confirmed post that embeds LeadMagnetForm
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

    // Block window.open so the redirect PDF doesn't actually open a tab
    await page.addInitScript(() => {
      window.open = () => null;
    });

    await page.goto(TEST_POST);

    // LeadMagnetForm renders a <form class="lead-magnet-form"> inside a
    // <div class="lead-magnet-container">. There may be multiple on the page;
    // target the first one that's visible.
    const form = page.locator('form.lead-magnet-form').first();
    await expect(form).toBeVisible();

    // Fill out the email input (name="email" in LeadMagnetForm.astro line 49)
    await form.locator('input[name="email"]').fill('e2e-test@datadocks.com');
    await form.locator('button[type="submit"]').click();

    // After submit the inline script:
    //   1. Hides the form (adds class "hidden")
    //   2. Shows .success-message inside the same .lead-magnet-container
    const container = page.locator('.lead-magnet-container').first();
    await expect(container.locator('.success-message')).toBeVisible({ timeout: 5000 });
    await expect(form).toBeHidden();

    // Verify the intercepted payload has the right shape
    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-test@datadocks.com');
    expect((bentoPayload as Record<string, unknown>).event).toBeTruthy();
    expect((bentoPayload as Record<string, unknown>).source).toContain('/posts/carrier-scorecards');
  });
});


test.describe('CTA Form (Homepage)', () => {
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

    // Capture the URL that window.open is called with instead of actually opening
    let openedUrl = '';
    await page.addInitScript(() => {
      window.open = (url?: string | URL) => {
        (window as any).__lastOpenedUrl = typeof url === 'string' ? url : url?.toString() ?? '';
        return null;
      };
    });

    await page.goto('/');

    // The bottom-of-page CTA is an Astro component with id="cta-bento-form"
    // (src/components/home/CTA.astro line 21)
    const ctaForm = page.locator('#cta-bento-form');
    await ctaForm.scrollIntoViewIfNeeded();
    await expect(ctaForm).toBeVisible();

    await ctaForm.locator('input[name="email"]').fill('e2e-test@datadocks.com');
    await ctaForm.locator('button[type="submit"]').click();

    // The CTA.astro script calls window.open(calendlyUrl, '_blank', 'noopener')
    openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl || '');
    expect(openedUrl).toContain('calendly.com');

    // Verify the Bento payload
    expect(bentoPayload).not.toBeNull();
    expect((bentoPayload as Record<string, unknown>).email).toBe('e2e-test@datadocks.com');
    expect((bentoPayload as Record<string, unknown>).event).toBe('Demo Subscriber');
  });
});
