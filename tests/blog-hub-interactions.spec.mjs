import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const pageErrors = new WeakMap();

test.beforeEach(async ({ page, baseURL }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.stack || error.message));
  await page.addInitScript(() => {
    // Let Partytown use its supported fallback when browser workers are blocked.
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined });
    window.Calendly = { initPopupWidget() {} };
    window.bento = { identify() {}, view() {}, track() {} };
  });
  const origin = new URL(baseURL).origin;
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    // These tests submit no forms. Prevent all writes and external analytics.
    if (request.resourceType() === 'script') return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (request.resourceType() === 'stylesheet') return route.fulfill({ contentType: 'text/css', body: '' });
    return route.abort();
  });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'No page JavaScript errors').toEqual([]);
});

const hubPath = '/posts';

test('mobile desktop schedule supports detail, full-week view, keyboard scrolling, and focus restoration', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(hubPath);
  const trigger = page.locator('[data-open-desktop-schedule]');
  await trigger.click();
  const dialog = page.locator('dialog#desktop-screenshot-modal');
  const zoom = dialog.locator('[data-schedule-zoom]');
  const viewport = dialog.locator('[data-schedule-viewport]');
  await expect(dialog).toBeVisible();
  await expect(viewport).toHaveAttribute('data-zoomed', '');
  await expect(zoom).toHaveText('Show full week');
  await expect.poll(() => viewport.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  const backgroundScroll = await page.evaluate(() => scrollY);
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.mouse.wheel(0, 300);
  expect(await page.evaluate(() => scrollY)).toBe(backgroundScroll);

  await zoom.click();
  await expect(viewport).not.toHaveAttribute('data-zoomed');
  await expect(zoom).toHaveText('Zoom to read');
  expect(await viewport.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await zoom.click();
  await expect.poll(() => viewport.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(backgroundScroll);
  await trigger.click();
  await dialog.getByRole('button', { name: 'Close desktop schedule' }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('desktop schedule opens in full-week view and can be enlarged', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(hubPath);
  const trigger = page.locator('#mac-fullscreen-btn');
  await trigger.click();
  const dialog = page.locator('dialog#desktop-screenshot-modal');
  const zoom = dialog.locator('[data-schedule-zoom]');
  const viewport = dialog.locator('[data-schedule-viewport]');
  await expect(dialog).toBeVisible();
  await expect(viewport).not.toHaveAttribute('data-zoomed');
  expect(await viewport.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await zoom.click();
  await expect.poll(() => viewport.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('schedule dismissal restores visible trigger after viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(hubPath);
  const mobileTrigger = page.locator('[data-open-desktop-schedule]');
  const desktopTrigger = page.locator('#mac-fullscreen-btn');
  const dialog = page.locator('dialog#desktop-screenshot-modal');
  await mobileTrigger.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(desktopTrigger).toBeFocused();
  await desktopTrigger.click();
  await page.setViewportSize({ width: 375, height: 667 });
  await dialog.getByRole('button', { name: 'Close desktop schedule' }).click();
  await expect(dialog).toBeHidden();
  await expect(mobileTrigger).toBeFocused();
});

test('archive preserves filtering and sorting across phone disclosure and tablet resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(hubPath);
  const archive = page.locator('resource-archive');
  const toggle = archive.locator('[data-toggle-filters]');
  const type = archive.locator('[name="content-type"]');
  const topic = archive.locator('[name="topic"]');
  const sort = archive.locator('[name="sort"]');
  const cards = archive.locator('[data-resource-card]:not([hidden])');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(type).toBeHidden();
  const total = await cards.count();
  await toggle.click();
  await expect(type).toBeVisible();
  await type.selectOption('article');
  const chosenTopic = await cards.first().getAttribute('data-topic');
  await topic.selectOption(chosenTopic);
  const filtered = await cards.evaluateAll(elements => elements.map(el => ({ type: el.dataset.type, topic: el.dataset.topic })));
  expect(filtered.length).toBeGreaterThan(0);
  expect(filtered.length).toBeLessThan(total);
  expect(filtered.every(card => card.type === 'article' && card.topic === chosenTopic)).toBe(true);
  await sort.selectOption('oldest');
  const dates = await cards.evaluateAll(elements => elements.map(el => Number(el.dataset.date)));
  expect(dates).toEqual([...dates].sort((a, b) => a - b));
  await expect(archive.locator('[data-active-options]')).toHaveText('3');

  await sort.focus();
  await page.keyboard.press('Escape');
  await expect(type).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(toggle).toBeHidden();
  await expect(type).toBeVisible();
  await expect(type).toBeFocused();
  await expect(type).toHaveValue('article');
  await expect(topic).toHaveValue(chosenTopic);
  await expect(sort).toHaveValue('oldest');

  // The desktop reset disappears on phones; focus must move to the collapsed disclosure.
  await archive.locator('.archive-desktop-reset').focus();
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(type).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();

  // The mobile reset disappears on tablets; keep focus inside the visible controls.
  await archive.locator('.archive-mobile-reset').focus();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(type).toBeVisible();
  await expect(type).toBeFocused();
  await expect(type).toHaveValue('article');
  await expect(topic).toHaveValue(chosenTopic);
  await expect(sort).toHaveValue('oldest');
  await expect(cards).toHaveCount(filtered.length);

  // Preserve the expanded phone state when returning from a larger viewport.
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(type).toBeVisible();
  await expect(type).toBeFocused();
  await archive.locator('.archive-mobile-reset').click();
  await expect(type).toHaveValue('all');
  await expect(topic).toHaveValue('all');
  await expect(sort).toHaveValue('newest');
  await expect(cards).toHaveCount(total);
  await expect(archive.locator('[data-active-options]')).toBeHidden();
  await expect(type).toBeFocused();

  const outsideInput = page.locator('#cta-bento-form input[name="email"]');
  await outsideInput.focus();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(outsideInput).toBeFocused();
});
