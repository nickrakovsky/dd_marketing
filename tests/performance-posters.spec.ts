import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false, serviceWorkers: 'block', viewport: { width: 390, height: 844 } });

test('hub posters remain named, usable video links without JavaScript', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) return route.abort();
    if (url.pathname.startsWith('/yt-thumb/')) {
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="gray"/></svg>',
      });
    }
    return route.continue();
  });

  await page.goto('/posts');
  const shorts = page.locator('.hub-shorts-slide');
  const deepDives = page.locator('.deep-dive-card');
  expect(await shorts.count()).toBeGreaterThan(0);
  expect(await deepDives.count()).toBeGreaterThan(0);

  for (const cards of [shorts, deepDives]) {
    for (const card of await cards.all()) {
      const link = card.getByRole('link');
      const title = await card.getAttribute('data-short-title') || await card.locator('h3').innerText();
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAccessibleName(`Watch: ${title}`);
      await expect(link).toHaveAttribute('href', /^\/videos\//);
      await expect(link.locator('img')).toHaveAttribute('loading', 'lazy');
    }
  }

  for (const selector of ['.hub-shorts-fallback', '.deep-dive-fallback']) {
    const link = page.locator(selector).first();
    const href = await link.getAttribute('href');
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect.poll(() => link.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await link.click();
    await expect(page).toHaveURL(new URL(href!, baseURL!).href);
    await page.goto('/posts');
  }
});
