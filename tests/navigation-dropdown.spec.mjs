import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Navigation checks never submit leads or send external analytics.
  await page.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).hostname === new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4321').hostname
      && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    return route.abort();
  });
});

for (const width of [1024, 1440]) {
  test(`Escape closes a hovered desktop dropdown and restores focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const trigger = page.locator('[data-dropdown-trigger]');
    const menu = page.locator('[data-dropdown-menu]');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', await menu.getAttribute('id'));
    await trigger.hover();
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    // Focus restoration and an already-hovering pointer must not reopen it.
    await page.waitForTimeout(400);
    await expect(menu).toBeHidden();
  });

  test(`desktop dropdown supports keyboard opening and natural Tab exit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const trigger = page.locator('[data-dropdown-trigger]');
    const menu = page.locator('[data-dropdown-menu]');
    await trigger.focus();
    await trigger.press('Enter');
    await expect(menu).toBeVisible();
    await trigger.press('Space');
    await expect(menu).toBeHidden();
    await trigger.press('ArrowDown');
    await expect(menu.getByRole('link', { name: 'Increase Capacity', exact: true })).toBeFocused();
    await menu.getByRole('link', { name: 'Digitize Operations', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('nav').getByRole('link', { name: 'Features', exact: true })).toBeFocused();
    await expect(menu).toBeHidden();
  });
}

test('outside interaction and switching to a phone close the desktop menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/posts');
  const trigger = page.locator('[data-dropdown-trigger]');
  const menu = page.locator('[data-dropdown-menu]');
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.locator('main h1').click();
  await expect(menu).toBeHidden();
  await trigger.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  const toggle = page.locator('[data-mobile-toggle]');
  await toggle.click();
  await expect(page.locator('[data-mobile-menu]')).toBeVisible();
  await page.locator('[data-mobile-dropdown-trigger]').click();
  await expect(page.locator('[data-mobile-dropdown]')).toBeVisible();
  await toggle.click();
  await expect(page.locator('[data-mobile-menu]')).toBeHidden();
});
