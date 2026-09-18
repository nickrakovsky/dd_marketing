import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const schedule = JSON.parse(readFileSync(new URL('../docs/daily-blog-schedule.json', import.meta.url), 'utf8'));
const slots = schedule.slots;
const pageErrors = new WeakMap();
const hubCards = '.latest-insight, resource-archive [data-resource-card]';
const homeCards = '.feed-link, .featured-post';

// Future previews are development-only. Enable their cases when testing Astro dev:
// PLAYWRIGHT_FUTURE_PREVIEWS=1 playwright test tests/blog-rollout.spec.mjs
// Keep them disabled when targeting a normal production build or deployment.
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page, baseURL }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.stack || error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined });
    window.Calendly = { initPopupWidget() {} };
    window.bento = { identify() {}, view() {}, track() {} };
  });
  const origin = new URL(baseURL).origin;
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    // Never submit a lead, launch booking, or contact external analytics in this suite.
    if (request.resourceType() === 'script') return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (request.resourceType() === 'stylesheet') return route.fulfill({ contentType: 'text/css', body: '' });
    return route.abort();
  });
  expect(slots, 'The imported rollout has fifteen scheduled posts').toHaveLength(15);
  for (const slot of slots) {
    expect(slot.slug, `Slot ${slot.slot} has a final slug`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(Number.isFinite(Date.parse(slot.pubDate)), `Slot ${slot.slot} has a publication timestamp`).toBe(true);
  }
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'No page JavaScript errors').toEqual([]);
});

async function paths(locator) {
  return locator.evaluateAll(elements => elements.map(element => new URL(element.href).pathname));
}

async function expectCurrentHub(page, pathname = '/posts') {
  const before = Date.now();
  const response = await page.goto(pathname);
  expect(response.status()).toBe(200);
  const after = Date.now();
  const visiblePaths = await paths(page.locator(hubCards));
  for (const slot of slots) {
    const publication = Date.parse(slot.pubDate);
    // A publication crossing the request boundary is valid in either state.
    if (publication <= before) expect(visiblePaths).toContain(`/posts/${slot.slug}`);
    if (publication > after) expect(visiblePaths).not.toContain(`/posts/${slot.slug}`);
  }
  await expect(page.getByRole('complementary', { name: 'Publication preview' })).toHaveCount(0);
  return visiblePaths;
}

test('canonical homepage and resource hub use the promoted designs and real publication dates', async ({ page }) => {
  const home = await page.goto('/');
  expect(home.status()).toBe(200);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://datadocks.com/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('#hero-title')).toContainText('YOUR OPERATIONS.');
  await expect(page.locator('#book-demo[data-demo-capture]')).toBeVisible();
  const homePaths = await paths(page.locator(homeCards));
  const now = Date.now();
  for (const slot of slots.filter(slot => Date.parse(slot.pubDate) > now)) {
    expect(homePaths).not.toContain(`/posts/${slot.slug}`);
  }
  await expect(page.getByRole('complementary', { name: 'Publication preview' })).toHaveCount(0);

  await expectCurrentHub(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://datadocks.com/posts');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('#why-datadocks')).toHaveCount(1);
  await expect(page.locator('.latest-insight')).toHaveCount(5);
  await expect(page.locator('resource-archive')).toHaveCount(1);
});

test('retired prototype URLs no longer expose duplicate page versions', async ({ page }) => {
  for (const path of ['/index/home-revamp', '/wireframes/modular-editorial']) {
    const response = await page.goto(path);
    expect(response.status(), path).toBe(404);
  }
});

test('an unpublished article cannot be opened through its public URL', async ({ page }) => {
  const future = slots.find(slot => Date.parse(slot.pubDate) > Date.now() + 60_000);
  test.skip(!future, 'The entire rollout has passed its publication dates.');
  const response = await page.goto(`/posts/${future.slug}`);
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { name: future.title, exact: true })).toHaveCount(0);
});

test.describe('development publication previews', () => {
  test.skip(process.env.PLAYWRIGHT_FUTURE_PREVIEWS !== '1', 'Requires the development-only preview routes.');

  test('future hub includes all fifteen exactly once, split between latest five and older resources', async ({ page }) => {
    const response = await page.goto('/preview/daily-blog/posts');
    expect(response.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('complementary', { name: 'Publication preview' })).toBeVisible();
    const newestFirst = [...slots].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
    const latest = await paths(page.locator('.latest-insight'));
    const archive = await paths(page.locator('resource-archive [data-resource-card]'));
    expect(latest).toEqual(newestFirst.slice(0, 5).map(slot => `/posts/${slot.slug}`));
    for (const [index, slot] of newestFirst.slice(0, 5).entries()) {
      const card = page.locator('.latest-insight').nth(index);
      await expect(card.locator('.latest-insight-author')).toHaveText(slot.author);
      await expect(card.locator('.author-avatar')).toHaveCount(1);
      await expect(card.locator('time')).toHaveAttribute('datetime', slot.pubDate);
      await expect(card.locator('.latest-insight-topic')).not.toBeEmpty();
      await expect(card.locator('.latest-insight-type')).toHaveText('Article');
    }
    expect(archive.slice(0, 10)).toEqual(newestFirst.slice(5).map(slot => `/posts/${slot.slug}`));
    for (const slot of slots) {
      expect([...latest, ...archive].filter(path => path === `/posts/${slot.slug}`), slot.title).toHaveLength(1);
    }
  });

  test('future homepage shows the finished feed while ordinary views keep their own cutoff', async ({ page }) => {
    const response = await page.goto('/preview/daily-blog/home');
    expect(response.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('complementary', { name: 'Publication preview' })).toBeVisible();
    const newestFirst = [...slots].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
    expect(await paths(page.locator('.feed-link'))).toEqual(newestFirst.slice(0, 5).map(slot => `/posts/${slot.slug}`));
    const [featuredPath] = await paths(page.locator('.featured-post'));
    expect(featuredPath).toBeTruthy();
    expect(slots.map(slot => `/posts/${slot.slug}`)).not.toContain(featuredPath);
    const authors = await page.locator('.feed-author').allTextContents();
    expect(authors).toContain('Nick Rakovsky');
    expect(authors).toContain('DataDocks Team');
    await expect(page.locator('.all-resources')).toHaveAttribute('href', '/preview/daily-blog/posts');

    // Neither visiting a future view nor adding an arbitrary cutoff query can publish content.
    await expectCurrentHub(page);
    await expectCurrentHub(page, `/posts?asOf=${encodeURIComponent(schedule.previewAsOf)}`);
    await page.goto('/');
    expect(await paths(page.locator('.featured-post'))).toEqual([featuredPath]);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('.all-resources')).toHaveAttribute('href', '/posts');
    const ordinaryPaths = await paths(page.locator(homeCards));
    for (const slot of slots.filter(slot => Date.parse(slot.pubDate) > Date.now())) {
      expect(ordinaryPaths).not.toContain(`/posts/${slot.slug}`);
    }
  });
});
