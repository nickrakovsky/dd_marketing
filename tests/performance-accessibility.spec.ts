import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Focus on the reported failures rather than duplicating the full site audit.
const rules = ['aria-allowed-role', 'aria-required-children', 'aria-required-parent', 'heading-order'];

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined });
  });
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    // Exercise local UI without analytics, form submissions, or video requests.
    if (request.resourceType() === 'script') return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (request.resourceType() === 'stylesheet') return route.fulfill({ contentType: 'text/css', body: '' });
    return route.abort();
  });
});

async function expectReportedRulesToPass(page: Page, selector: string) {
  const result = await new AxeBuilder({ page }).include(selector).withRules(rules).analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
}

test('customer slides keep valid native semantics while navigating', async ({ page }) => {
  await page.goto('/');
  const carousel = page.locator('[data-quotes]');
  await carousel.scrollIntoViewIfNeeded();
  await expect(carousel).toHaveAttribute('data-enhanced', '');
  await expectReportedRulesToPass(page, '[data-quotes]');
  await carousel.getByRole('button', { name: 'Next testimonial' }).click();
  await expect(carousel.locator('.quote-slide').nth(0)).toHaveAttribute('aria-hidden', 'true');
  await expect(carousel.locator('.quote-slide').nth(1)).toHaveAttribute('aria-hidden', 'false');
  await expectReportedRulesToPass(page, '[data-quotes]');
});

test('shorts defer posters until nearby and retain keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/posts');
  await page.waitForFunction(() => customElements.get('hub-shorts'));
  const carousel = page.locator('hub-shorts');
  await expect(carousel.locator('lite-youtube')).toHaveCount(0);
  const track = carousel.locator('#hub-shorts-track');
  await track.scrollIntoViewIfNeeded();
  await expect(carousel.locator('.hub-shorts-slide').first().locator('lite-youtube')).toHaveCount(1);
  await expectReportedRulesToPass(page, '.hub-shorts');
  await track.focus();
  await page.keyboard.press('ArrowDown');
  await expect(carousel.locator('[data-short-count]')).toHaveText(/^2 \/ /);
  await expect(carousel.locator('.hub-shorts-slide').nth(1).locator('lite-youtube')).toHaveCount(1);
  await page.keyboard.press('ArrowUp');
  await expect(carousel.locator('[data-short-count]')).toHaveText(/^1 \/ /);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`comparison roles and headings survive expansion at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/comparison');
    const comparison = page.locator('#comparison-table');
    const table = comparison.getByRole('table', { name: 'Dock Scheduling Side-by-Side Features Comparison' });
    await table.scrollIntoViewIfNeeded();
    await expect(comparison.locator('astro-island[ssr]')).toHaveCount(0);
    await expectReportedRulesToPass(page, 'main');

    await comparison.getByRole('button', { name: 'Expand all', exact: true }).click();
    await expect(table.getByRole('rowheader').first()).toBeVisible();
    await expectReportedRulesToPass(page, '#comparison-table');
    await comparison.getByRole('button', { name: 'Add another competitor' }).click();
    await expect(table.getByRole('columnheader')).toHaveCount(4);
    await expectReportedRulesToPass(page, '#comparison-table');
    await comparison.getByRole('button', { name: 'Collapse all', exact: true }).click();
    await expect(table.getByRole('rowheader')).toHaveCount(0);
    await expectReportedRulesToPass(page, '#comparison-table');

    const explorer = page.locator('#requirements-tool');
    await explorer.scrollIntoViewIfNeeded();
    await expect(explorer.locator('astro-island[ssr]')).toHaveCount(0);
    if (viewport.width < 768) {
      await explorer.getByRole('heading', { level: 3 }).first().getByRole('button').click();
    }
    await expectReportedRulesToPass(page, 'main');
  });
}
