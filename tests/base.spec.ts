import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Site-wide health checks: console errors, SEO meta, accessibility.
 * Runs against the homepage and one blog post layout.
 */

// Console messages to ignore (known third-party noise, not regressions)
const IGNORED_CONSOLE_PATTERNS = [
  /third-party cookie/i,
  /favicon\.ico/i,
  /download the React DevTools/i,
  /Bento/i, // Bento SDK may log if UUID is missing in test env
];

function isIgnoredConsoleMessage(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Chromium's console text for a failed subresource is just "Failed to load
 * resource: the server responded with a status of 404 ()" — it names no URL, so
 * a CI failure gives you nothing to act on. Record the failing responses
 * separately and report them alongside the console errors.
 *
 * Returns getters for both lists; attach before the first navigation.
 */
function trackPageErrors(page: import('@playwright/test').Page) {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnoredConsoleMessage(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });
  page.on('requestfailed', (req) => {
    failedResponses.push(`NET ${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`);
  });

  return {
    /** Assertion message that names the actual failing URLs. */
    describe: () =>
      [
        `Unexpected console errors:\n${consoleErrors.join('\n')}`,
        failedResponses.length
          ? `\nFailed network responses:\n${failedResponses.join('\n')}`
          : '\n(no failed network responses recorded — error came from page script, not a subresource)',
      ].join('\n'),
    consoleErrors,
  };
}

test.describe('Homepage Health', () => {
  test('no unexpected console errors', async ({ page }) => {
    const tracked = trackPageErrors(page);

    await page.goto('/');
    // Wait for React islands to hydrate (client:visible triggers on viewport)
    await page.waitForTimeout(2000);

    expect(tracked.consoleErrors, tracked.describe()).toHaveLength(0);
  });

  test('has correct title and meta description', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DataDocks/);

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
  });

  test('passes accessibility scan', async ({ page }) => {
    await page.goto('/');
    // Wait for hydration so islands are in the DOM
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      // Exclude color-contrast from automated checks — we handle this
      // manually with our brand palette and WCAG Large Text exemptions
      .disableRules(['color-contrast'])
      .analyze();

    expect(
      results.violations,
      `A11y violations found:\n${results.violations.map((v) => `  [${v.id}] ${v.help} (${v.nodes.length} nodes)`).join('\n')}`
    ).toHaveLength(0);
  });
});


test.describe('Blog Post Health', () => {
  const TEST_POST = '/posts/what-is-dock-scheduling';

  test('no unexpected console errors on a blog post', async ({ page }) => {
    const tracked = trackPageErrors(page);

    await page.goto(TEST_POST);
    await page.waitForTimeout(2000);

    expect(tracked.consoleErrors, tracked.describe()).toHaveLength(0);
  });

  test('has correct structured data for blog post', async ({ page }) => {
    await page.goto(TEST_POST);
    await expect(page).toHaveTitle(/DataDocks/);

    // Blog posts should have article structured data
    const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ldJson).toBeTruthy();
    const schema = JSON.parse(ldJson!);
    // Layout.astro uses @graph pattern
    const graph = schema['@graph'] || [schema];
    const hasArticle = graph.some(
      (item: Record<string, unknown>) =>
        item['@type'] === 'Article' || item['@type'] === 'BlogPosting'
    );
    expect(hasArticle, 'Expected Article or BlogPosting schema').toBe(true);
  });

  test('passes accessibility scan on blog post', async ({ page }) => {
    await page.goto(TEST_POST);
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(
      results.violations,
      `A11y violations found:\n${results.violations.map((v) => `  [${v.id}] ${v.help} (${v.nodes.length} nodes)`).join('\n')}`
    ).toHaveLength(0);
  });
});
