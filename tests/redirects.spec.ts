import { test, expect } from '@playwright/test';

const comparisonRedirects = [
  ['/Posts', '/posts'],
  ['/Datadocks', '/'],
  ['/posts/comparison', '/comparison'],
  ['/posts/datadocks-vs-opendock', '/datadocks-vs-opendock'],
] as const;

const trackingQuery = '?utm_source=redirect-regression&utm_campaign=comparison%20test';

test.describe('Legacy marketing redirects', () => {
  for (const [source, destination] of comparisonRedirects) {
    for (const method of ['GET', 'HEAD']) {
      for (const suffix of ['', '/', '.html', trackingQuery, `/${trackingQuery}`, `.html${trackingQuery}`]) {
        test(`${method} ${source}${suffix} returns a permanent redirect`, async ({ request }) => {
          // Following redirects here would hide the original duplicate-page bug.
          const response = await request.fetch(`${source}${suffix}`, {
            method,
            maxRedirects: 0,
          });

          expect(response.status()).toBe(301);
          const location = response.headers().location;
          expect(location, 'The response must redirect the client, not serve the destination HTML').toBeTruthy();

          const redirectURL = new URL(location, response.url());
          expect(redirectURL.origin).toBe(new URL(response.url()).origin);
          expect(redirectURL.pathname).toBe(destination);
          expect(redirectURL.search).toBe(suffix.includes('?') ? trackingQuery : '');
        });
      }
    }

    test(`${destination} remains directly available`, async ({ request }) => {
      const response = await request.get(destination, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
    });
  }

  test('published articles still render and unknown article URLs remain missing', async ({ request }) => {
    const article = await request.get('/posts/what-is-dock-scheduling', { maxRedirects: 0 });
    expect(article.status()).toBe(200);
    expect(article.headers()['content-type']).toContain('text/html');

    const missing = await request.get('/posts/comparison-redirect-regression-missing', { maxRedirects: 0 });
    expect(missing.status()).toBe(404);
  });

  test('retired previews stay missing and cannot redirect to public content', async ({ request }) => {
    for (const pathname of ['/wireframes/tabbed-hub', '/wireframes/tabbed-hub.html', '/WIREframes/tabbed-hub', '/%77ireframes/tabbed-hub']) {
      const response = await request.get(pathname, { maxRedirects: 0 });
      expect(response.status()).toBe(404);
      expect(response.headers()['x-robots-tag']).toContain('noindex');
      expect(response.headers().location).toBeUndefined();
    }
    for (const pathname of ['/Posts/unknown', '/Datadocks/unknown']) {
      const response = await request.get(pathname, { maxRedirects: 0 });
      expect(response.status()).toBe(404);
    }
  });
});
