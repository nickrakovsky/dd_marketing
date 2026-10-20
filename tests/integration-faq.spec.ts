import { test, expect } from '@playwright/test';

test.describe('Integration FAQ without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('answers are ordinary HTML and native disclosure controls remain usable', async ({ page, request }) => {
    const response = await request.get('/integrations');
    expect(response.status()).toBe(200);
    const body = (await response.text())
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ');
    // JSON-LD and island props alone must not satisfy the content check.
    expect(body).toContain('Customer success is at the core of our business model.');
    expect(body).toContain('most standard integrations are completed within 2-4 weeks.');
    expect(body).toContain('During implementation');

    await page.goto('/integrations');
    const questions = page.locator('details.faq-details');
    await expect(questions).toHaveCount(7);
    const first = questions.first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await expect(first.getByText(/Customer success is at the core/)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(first).not.toHaveAttribute('open', '');
  });
});
