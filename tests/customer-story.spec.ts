import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const VIDEO_ID = 'VpQigBObIlI';
const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const API_URL = 'https://www.youtube.com/iframe_api';
const WIDGET_URL = 'https://www.youtube.com/s/player/test-player/www-widgetapi.vflset/www-widgetapi.js';
const EMBED = '#customer-story lite-youtube';
type PlayerMode = 'ready' | 'api-failure' | 'api-timeout' | 'player-timeout';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', route => {
    // Tests exercise production HTML/CSP without depending on third-party services.
    return new URL(route.request().url()).origin === origin ? route.continue() : route.abort();
  });
});

async function mockYouTube(page: Page, mode: PlayerMode = 'ready') {
  const requests: string[] = [];
  await page.route(API_URL, route => {
    requests.push(route.request().url());
    if (mode === 'api-failure') return route.abort('failed');
    return route.fulfill({
      contentType: 'application/javascript',
      // Reproduce the API's second script request. Supplying YT with page.evaluate
      // would bypass CSP and let the original regression pass unnoticed.
      body: `
        document.documentElement.dataset.ytApiLoaded = 'true';
        window.YT = {
          loaded: false,
          callbacks: [],
          ready(callback) {
            if (this.loaded) callback();
            else this.callbacks.push(callback);
          }
        };
        const widget = document.createElement('script');
        widget.src = ${JSON.stringify(WIDGET_URL)};
        document.head.appendChild(widget);
      `,
    });
  });
  await page.route(WIDGET_URL, route => {
    requests.push(route.request().url());
    return route.fulfill({
      contentType: 'application/javascript',
      body: mode === 'api-timeout'
        ? "document.documentElement.dataset.ytWidgetLoaded = 'true';"
        : `
          document.documentElement.dataset.ytWidgetLoaded = 'true';
          window.YT.Player = class {
            constructor(target, options) {
              this.frame = document.createElement('iframe');
              this.frame.src = 'https://www.youtube-nocookie.com/embed/' + options.videoId;
              this.frame.title = 'Customer story player';
              this.frame.dataset.videoId = options.videoId;
              this.frame.dataset.playsinline = options.playerVars.playsinline;
              target.replaceWith(this.frame);
              ${mode === 'player-timeout' ? '' : 'setTimeout(() => options.events.onReady({ target: this }), 0);'}
            }
            playVideo() { this.frame.dataset.playing = 'true'; }
            getIframe() { return this.frame; }
            destroy() { this.frame.remove(); }
          };
          window.YT.loaded = true;
          window.YT.callbacks.splice(0).forEach(callback => callback());
          if (typeof window.onYouTubeIframeAPIReady === 'function') window.onYouTubeIframeAPIReady();
        `,
    });
  });
  await page.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Customer story player</title>',
  }));
  await page.route(WATCH_URL, route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Watch customer story on YouTube</title>',
  }));
  return requests;
}

async function openHome(page: Page) {
  const response = await page.goto('/');
  // A success without the production policy would not catch the original bug.
  expect(response?.headers()['content-security-policy']).toContain('script-src ');
  await expect(page.locator(`${EMBED} .lty-playbtn`)).toHaveAttribute('role', 'button');
}

async function activateStory(page: Page, entry: 'thumbnail' | 'hero') {
  if (entry === 'hero') {
    await page.getByRole('link', { name: 'Watch a customer story', exact: true }).click();
    await expect(page).toHaveURL(/#customer-story$/);
  } else {
    await page.locator(`${EMBED} .lty-playbtn`).click();
  }
}

async function expectFallback(page: Page) {
  const embed = page.locator(EMBED);
  const link = embed.locator('a.lty-playbtn');
  await expect(embed).toHaveAttribute('data-yt-failed', /.*/);
  await expect(embed).not.toHaveClass(/lyt-activated/);
  await expect(embed.locator('iframe')).toHaveCount(0);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', WATCH_URL);
  await expect(link).not.toHaveAttribute('role', 'button');
  return link;
}

for (const device of ['desktop', 'mobile'] as const) {
  test.describe(`${device} customer story`, () => {
    if (device === 'mobile') {
      test.use({
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      });
    }

    for (const entry of ['thumbnail', 'hero'] as const) {
      test(`${entry} starts playback through both CSP-approved YouTube scripts`, async ({ page }) => {
        const errors: Error[] = [];
        page.on('pageerror', error => errors.push(error));
        const requests = await mockYouTube(page);
        await openHome(page);
        expect(requests).toEqual([]);
        await activateStory(page, entry);
        await expect(page.locator('html')).toHaveAttribute('data-yt-api-loaded', 'true');
        await expect(page.locator('html')).toHaveAttribute('data-yt-widget-loaded', 'true');
        const frame = page.locator(`${EMBED} iframe`);
        await expect(frame).toBeVisible();
        await expect(frame).toHaveAttribute('data-video-id', VIDEO_ID);
        await expect(frame).toHaveAttribute('data-playing', 'true');
        await expect(frame).toHaveAttribute('data-playsinline', '1');
        expect(requests).toEqual([API_URL, WIDGET_URL]);
        expect(errors).toEqual([]);
      });
    }
  });
}

for (const entry of ['thumbnail', 'hero'] as const) {
  test(`${entry} recovers a failed API request with a usable YouTube link`, async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', error => errors.push(error));
    await mockYouTube(page, 'api-failure');
    await openHome(page);
    await activateStory(page, entry);
    const link = await expectFallback(page);
    if (entry === 'hero') await expect(link).toBeFocused();
    await link.click();
    await expect(page).toHaveURL(WATCH_URL);
    expect(errors).toEqual([]);
  });
}

for (const mode of ['api-timeout', 'player-timeout'] as const) {
  test(`${mode} restores the poster and link instead of leaving an empty player`, async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', error => errors.push(error));
    await page.clock.install();
    await mockYouTube(page, mode);
    await openHome(page);
    await activateStory(page, 'thumbnail');
    await expect(page.locator('html')).toHaveAttribute('data-yt-widget-loaded', 'true');
    if (mode === 'player-timeout') await expect(page.locator(`${EMBED} iframe`)).toHaveCount(1);
    await page.clock.fastForward(10_001);
    const link = await expectFallback(page);
    await link.click();
    await expect(page).toHaveURL(WATCH_URL);
    expect(errors).toEqual([]);
  });
}

test('resource-hub shorts expose a visible, clickable fallback when the API fails', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  await mockYouTube(page, 'api-failure');
  await page.goto('/posts');
  const slide = page.locator('.hub-shorts-slide').first();
  await slide.scrollIntoViewIfNeeded();
  const embed = slide.locator('lite-youtube');
  const play = embed.locator('.lty-playbtn');
  await expect(play).toHaveCount(1);
  const videoId = await embed.getAttribute('videoid');
  expect(videoId).toBeTruthy();
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  await page.route(watchUrl, route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Watch resource video on YouTube</title>',
  }));
  await play.click();
  await expect(embed).toHaveAttribute('data-yt-failed', /.*/);
  const fallback = embed.getByRole('link', { name: 'Video unavailable here. Watch on YouTube', exact: true });
  await expect(fallback).toBeVisible();
  // The hub normally makes its play control transparent beneath a custom icon.
  await expect(fallback).toHaveCSS('opacity', '1');
  await expect(fallback).toHaveAttribute('href', watchUrl);
  await fallback.click();
  await expect(page).toHaveURL(watchUrl);
  expect(errors).toEqual([]);
});
