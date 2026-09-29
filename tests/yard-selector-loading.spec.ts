import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', async route => {
    const request = route.request();
    if (new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method())) {
      return route.continue();
    }
    return route.abort();
  });
});

const categoryName = 'Select Road Freight, Trailers or Containers category';
const subtypeName = 'Select Warehouse & Distribution Center Yards sub-category';
const deferredModule = /\/Yard(?:TypeMatches|SystemDetailPanel)[.]/;

async function openSelector(page: Page) {
  await page.goto('/posts/best-yard-management-options');
  const selector = page.locator('astro-island[component-url*="YardTypeSelector"]');
  await selector.scrollIntoViewIfNeeded();
  await expect(selector).not.toHaveAttribute('ssr', '');
  return selector;
}

for (const moduleName of ['YardTypeMatches', 'YardSystemDetailPanel']) {
  test(`category opens while ${moduleName} is still downloading`, async ({ page }) => {
    let release!: () => void;
    const downloadGate = new Promise<void>(resolve => { release = resolve; });
    const requests: string[] = [];
    page.on('request', request => {
      if (deferredModule.test(new URL(request.url()).pathname)) requests.push(request.url());
    });
    await page.route(`**/*${moduleName}*`, async route => {
      await downloadGate;
      await route.continue();
    });

    try {
      const selector = await openSelector(page);
      expect(requests).toEqual([]);
      await selector.getByRole('button', { name: categoryName, exact: true }).tap();
      const subtype = selector.getByRole('button', { name: subtypeName, exact: true });
      await expect(subtype).toBeVisible();
      await expect(subtype).toBeEnabled();
      await expect(selector.getByText('Loading recommendations…', { exact: true })).toHaveCount(0);
      expect(requests.some(url => url.includes(moduleName))).toBe(true);

      await subtype.tap();
      await expect(selector.getByText('Loading recommendations…', { exact: true })).toBeVisible();
      await expect(subtype).toBeDisabled();
      release();
      await expect(selector.getByRole('heading', { name: 'DataDocks', exact: true })).toBeVisible();
      await expect(selector.getByRole('button', { name: 'Book a Demo', exact: true })).toBeVisible();
      await expect(selector.getByRole('alert')).toHaveCount(0);
    } finally {
      release();
    }
  });
}

test('going back cancels a pending selection without losing the loaded modules', async ({ page }) => {
  let release!: () => void;
  const downloadGate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/*YardTypeMatches*', async route => {
    await downloadGate;
    await route.continue();
  });
  try {
    const selector = await openSelector(page);
    const category = selector.getByRole('button', { name: categoryName, exact: true });
    const subtype = selector.getByRole('button', { name: subtypeName, exact: true });
    await category.tap();
    await expect(subtype).toBeEnabled();
    await subtype.tap();
    await expect(selector.getByText('Loading recommendations…', { exact: true })).toBeVisible();
    await selector.getByRole('button', { name: 'Go back', exact: true }).tap();
    await expect(category).toBeVisible();
    await expect(category).toBeEnabled();
    release();
    await category.tap();
    await expect(subtype).toBeEnabled();
    await subtype.tap();
    await expect(selector.getByRole('heading', { name: 'DataDocks', exact: true })).toBeVisible();
    await expect(selector.getByRole('alert')).toHaveCount(0);
  } finally {
    release();
  }
});

test('failed downloads preserve category navigation and report errors at the results step', async ({ page }) => {
  await page.route('**/*YardTypeMatches*', route => route.abort('failed'));
  const selector = await openSelector(page);
  const category = selector.getByRole('button', { name: categoryName, exact: true });
  await category.tap();
  const subtype = selector.getByRole('button', { name: subtypeName, exact: true });
  await expect(subtype).toBeEnabled();
  await expect(selector.getByRole('alert')).toHaveCount(0);
  await subtype.tap();
  await expect(selector.getByRole('alert')).toContainText('Recommendations could not load');
  await expect(subtype).toBeEnabled();
  await selector.getByRole('button', { name: 'Go back', exact: true }).tap();
  await expect(category).toBeVisible();
  await expect(selector.getByRole('alert')).toHaveCount(0);
});
