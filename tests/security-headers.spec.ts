import { test, expect } from '@playwright/test';

const ARTICLE = '/posts/dwell-time-in-trucking';
const REPRESENTATIVE_ROUTES = ['/', '/integrations', '/posts', ARTICLE];

test.describe('Enforced inline event policy', () => {
  test('static and Worker HTML share the enforced policy and security headers', async ({ request }) => {
    for (const pathname of REPRESENTATIVE_ROUTES) {
      const response = await request.get(pathname);
      expect(response.status(), pathname).toBe(200);
      const headers = response.headers();
      const policy = headers['content-security-policy'];
      expect(policy, pathname).toContain("script-src-attr 'none'");
      expect(policy, pathname).toContain("frame-ancestors 'self'");
      expect(policy, pathname).not.toMatch(/unsafe-inline|unsafe-eval/);
      expect(headers['x-content-type-options'], pathname).toBe('nosniff');
      // Includes build-generated CSS tags, not just the Astro source templates.
      expect(await response.text(), pathname).not.toMatch(/\s(?:onload|onclick)\s*=\s*["']/i);
    }
  });

  test('injected click attributes are blocked while event listeners still execute', async ({ page }) => {
    await page.goto('/integrations');
    await page.evaluate(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        if (event.disposition === 'enforce' && event.effectiveDirective === 'script-src-attr') {
          document.documentElement.dataset.cspAttrBlocked = 'true';
        }
      });
      const button = document.createElement('button');
      button.id = 'csp-attribute-probe';
      button.textContent = 'CSP attribute probe';
      button.setAttribute('onclick', "this.dataset.attributeRan = 'true'");
      button.addEventListener('click', () => { button.dataset.listenerRan = 'true'; });
      document.body.appendChild(button);
    });
    const button = page.locator('#csp-attribute-probe');
    await button.click();
    await expect(button).toHaveAttribute('data-listener-ran', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-csp-attr-blocked', 'true');
    await expect(button).not.toHaveAttribute('data-attribute-ran', 'true');
  });

  for (const pathname of ['/', '/integrations']) {
    test(`delayed full CSS applies without blocking critical CSS on ${pathname}`, async ({ page }) => {
      let release!: () => void;
      const held = new Promise<void>(resolve => { release = resolve; });
      await page.route('**/_astro/*.css', async route => {
        await held;
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: `${await response.text()}\n#csp-css-probe { color: rgb(1, 2, 3); }`,
        });
      });
      try {
        await page.goto(pathname, { waitUntil: 'domcontentloaded' });
        const sheet = page.locator('link[data-dd-async-css][href^="/_astro/"]').first();
        await expect(sheet).toHaveCount(1);
        // Static pages retain preload priority; Worker pages retain print-media loading.
        expect(await sheet.getAttribute('rel')).toMatch(/^(?:preload|stylesheet)$/);
        await expect(page.locator('head style').first()).toHaveCount(1);
        await expect(page.locator('h1').first()).toBeVisible();
        await page.evaluate(() => {
          const probe = document.createElement('span');
          probe.id = 'csp-css-probe';
          probe.textContent = 'CSS probe';
          document.body.appendChild(probe);
        });
        release();
        await expect(page.locator('#csp-css-probe')).toHaveCSS('color', 'rgb(1, 2, 3)');
        await expect(page.locator('link[data-dd-async-css][href^="/_astro/"]')).toHaveCount(0);
      } finally {
        release();
      }
    });
  }

  test('already loaded print and preload CSS recover when the listener arrives late', async ({ page, request }) => {
    const html = await (await request.get('/integrations')).text();
    const loader = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))
      .map(match => match[1]).find(script => script.includes('data-dd-async-css'));
    expect(loader).toBeTruthy();
    await page.route('**/__csp-test/print.css', route => route.fulfill({
      contentType: 'text/css', body: '#print-probe { color: rgb(1, 2, 3); }',
    }));
    await page.route('**/__csp-test/preload.css', route => route.fulfill({
      contentType: 'text/css', body: '#preload-probe { color: rgb(4, 5, 6); }',
    }));
    await page.route('**/__csp-test/loader.js', async route => {
      // Miss both resource load events deliberately, as can happen with cached CSS.
      await page.waitForFunction(() => {
        const print = document.querySelector<HTMLLinkElement>('#print-sheet');
        const preload = document.querySelector<HTMLLinkElement>('#preload-sheet');
        return !!print?.sheet && !!preload && performance.getEntriesByName(preload.href, 'resource').length > 0;
      });
      await route.fulfill({ contentType: 'application/javascript', body: loader! });
    });
    await page.route('**/__csp-test/late-loader', route => route.fulfill({
      contentType: 'text/html',
      headers: { 'Content-Security-Policy': "script-src-attr 'none'" },
      body: `<!doctype html><html><head>
        <link id="print-sheet" rel="stylesheet" media="print" data-dd-async-css href="/__csp-test/print.css">
        <link id="preload-sheet" rel="preload" as="style" data-dd-async-css="preload" href="/__csp-test/preload.css">
        <script src="/__csp-test/loader.js"></script></head><body>
        <span id="print-probe">Print CSS</span><span id="preload-probe">Preload CSS</span></body></html>`,
    }));
    await page.goto('/__csp-test/late-loader');
    await expect(page.locator('#print-probe')).toHaveCSS('color', 'rgb(1, 2, 3)');
    await expect(page.locator('#preload-probe')).toHaveCSS('color', 'rgb(4, 5, 6)');
  });

  test('full citation closes the mobile sheet and keeps anchor navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ARTICLE);
    const reference = page.locator('#content [data-smartlink-type="academic"][data-smartlink-bibref^="#ref-"]').first();
    await expect(reference).toHaveCount(1);
    await reference.click();
    const citation = page.locator('#sl-mobile-actions').getByRole('link', { name: 'Full citation' });
    await expect(citation).toBeVisible();
    const target = await citation.getAttribute('href');
    await citation.click();
    await expect(page.locator('#smartlink-scrim')).toBeHidden();
    expect(new URL(page.url()).hash).toBe(target);
  });
});
