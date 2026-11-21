import fs from 'node:fs';
import { test, expect } from '@playwright/test';

const slugs = fs.readdirSync(new URL('../src/assets/feature-diagrams/', import.meta.url))
  .filter(name => name.endsWith('.svg')).map(name => name.slice(0, -4));

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).hostname === new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4321').hostname
      && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    return route.abort();
  });
});

for (const slug of slugs) {
  test(`${slug}: readable SVG labels and contained scrolling from phone to desktop`, async ({ page }) => {
    await page.goto(`/datadocks-features/${slug}`, { waitUntil: 'domcontentloaded' });
    const region = page.locator('[data-feature-diagram]');
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('aria-label', /workflow diagram/);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await region.scrollIntoViewIfNeeded();
      const measurement = await region.evaluate(element => {
        const svg = element.querySelector('svg');
        const sizes = [...svg.querySelectorAll('text')].filter(text => text.textContent.trim()).map(text => {
          const matrix = text.getScreenCTM();
          return parseFloat(getComputedStyle(text).fontSize) * Math.hypot(matrix.a, matrix.b);
        });
        return { minFont: Math.min(...sizes), labels: sizes.length,
          width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
          overflowing: element.scrollWidth > element.clientWidth + 1 };
      });
      expect(measurement.labels).toBeGreaterThan(0);
      expect(measurement.minFont).toBeGreaterThanOrEqual(13.9);
      expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.width + 2);
      const hint = page.locator(`#${await region.getAttribute('aria-describedby')}`);
      if (measurement.overflowing) await expect(hint).toBeVisible();
      else await expect(hint).toBeHidden();
    }
  });
}

test('a phone user can focus and pan the long documentation diagram with arrow keys', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/datadocks-features/documentation', { waitUntil: 'domcontentloaded' });
  const region = page.locator('[data-feature-diagram]');
  await region.focus();
  await expect(region).toBeFocused();
  await expect(page.getByText('Scroll to explore the full diagram.', { exact: true })).toBeVisible();
  const screenshot = testInfo.outputPath('phone-diagram.png');
  await region.screenshot({ path: screenshot });
  await testInfo.attach('phone-diagram', { path: screenshot, contentType: 'image/png' });
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollX)).toBe(0);
});
