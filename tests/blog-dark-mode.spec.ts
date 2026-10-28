import { test, expect, type Locator } from '@playwright/test';

const ARTICLE = '/posts/what-is-dock-scheduling';
const CHARCOAL = 'rgb(24, 24, 24)';
const PAPER = 'rgb(255, 248, 233)';

// These samples have solid backgrounds. Resolve transparent ancestors so the
// assertion measures the rendered text pairing, rather than CSS token values.
async function textContrast(locator: Locator) {
  const sample = await locator.evaluate((element) => {
    const rgba = (value: string) => {
      const channels = value.match(/[\d.]+/g)!.map(Number);
      return [...channels.slice(0, 3), channels[3] ?? 1];
    };
    const over = (front: number[], back: number[]) =>
      front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
    const backgrounds: number[][] = [];
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
      backgrounds.push(rgba(getComputedStyle(ancestor).backgroundColor));
    }
    const background = backgrounds.reverse().reduce((back, front) => over(front, back), [255, 255, 255]);
    const style = getComputedStyle(element);
    return {
      foreground: over(rgba(style.color), background),
      background,
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: Number.parseInt(style.fontWeight, 10),
    };
  });
  const luminance = (rgb: number[]) => {
    const linear = rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const values = [luminance(sample.foreground), luminance(sample.background)].sort((a, b) => b - a);
  return { ...sample, ratio: (values[0] + 0.05) / (values[1] + 0.05) };
}

test.describe('Blog dark mode', () => {
  test('uses charcoal for an unsaved dark preference and keeps reading text legible', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(ARTICLE);

    await expect(page.locator('html')).toHaveAttribute('data-blog-theme', 'timeless-charcoal');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('main')).toHaveCSS('background-color', CHARCOAL);
    await expect(page.locator('[data-nav]')).toHaveCSS('background-color', CHARCOAL);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#181818');

    for (const selector of ['#content > p', '.article-author-bio', '.article-dates']) {
      const text = page.locator(selector).first();
      await expect(text).toBeVisible();
      const { ratio } = await textContrast(text);
      expect(ratio, `${selector} needs normal-text contrast`).toBeGreaterThanOrEqual(4.5);
    }

    const demo = page.locator('[data-nav] a').filter({ hasText: 'Schedule a Demo' }).filter({ visible: true });
    await expect(demo).toBeVisible();
    const cta = await textContrast(demo);
    const isLargeText = cta.fontSize >= 24 || (cta.fontSize >= 18.667 && cta.fontWeight >= 700);
    expect(cta.ratio, 'The navigation CTA must meet contrast at its rendered size').toBeGreaterThanOrEqual(isLargeText ? 3 : 4.5);
    expect(Math.min(...cta.foreground), 'CTA lettering remains pale, as required by the brand').toBeGreaterThan(200);
  });

  test('honours saved light mode even when the operating system prefers dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto(ARTICLE);

    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('main')).toHaveCSS('background-color', PAPER);
    await expect(page.locator('[data-nav]')).toHaveCSS('background-color', PAPER);
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(253, 79, 0)');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FFF8E9');
  });

  test('persists manual changes across reloads and another interactive article', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(ARTICLE);
    await expect(page.locator('main')).toHaveCSS('background-color', PAPER);
    await page.locator('#theme-toggle').click();
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('main')).toHaveCSS('background-color', CHARCOAL);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#181818');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('main')).toHaveCSS('background-color', CHARCOAL);
    await page.goto('/posts/inventory-and-cash');
    await expect(page.locator('main')).toHaveCSS('background-color', CHARCOAL);
    const figure = page.locator('#dd-payment-timing');
    await figure.getByLabel('Agreed 30-day terms', { exact: true }).check();
    await expect(figure.locator('.scenario.credit').first()).toBeVisible();
    await expect(figure.locator('.scenario.delivery').first()).toBeHidden();
    for (const selector of ['.choices label:has(input:checked) span', '.payment-section > p']) {
      const { ratio } = await textContrast(figure.locator(selector).first());
      expect(ratio, `Interactive figure ${selector} needs normal-text contrast`).toBeGreaterThanOrEqual(4.5);
    }

    await page.locator('#theme-toggle').click();
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('main')).toHaveCSS('background-color', PAPER);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FFF8E9');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('main')).toHaveCSS('background-color', PAPER);
  });

  test('keeps the theme toggle usable when browser storage is unavailable', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() { throw new DOMException('Storage is unavailable', 'SecurityError'); },
      });
    });
    await page.goto(ARTICLE);
    await expect(page.locator('main')).toHaveCSS('background-color', CHARCOAL);
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('main')).toHaveCSS('background-color', PAPER);
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FFF8E9');

    // Without persistence, a fresh load must still honour the OS preference.
    await page.reload();
    await expect(page.locator('main')).toHaveCSS('background-color', CHARCOAL);
  });
});
