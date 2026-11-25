import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] || 'https://datadocks.com').origin;
const directory = 'csp-diagnostics';
fs.mkdirSync(directory, { recursive: true });
const reports = [];
const browser = await chromium.launch({ headless: process.env.CSP_HEADED !== '1' });
try {
  {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      const violations = [];
      Object.defineProperty(window, '__ddReloadViolations', { value: violations });
      document.addEventListener('securitypolicyviolation', event => violations.push({
        directive: event.effectiveDirective, disposition: event.disposition,
        blockedURI: event.blockedURI, line: event.lineNumber,
        policy: event.originalPolicy.replace(/'nonce-[^']+'/g, "'nonce-[response]'"),
      }));
    });
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await session.send('Network.enable');
    // Playwright request routing disables the HTTP cache. Block known vendor
    // endpoints through CDP so this check exercises actual browser revalidation.
    await session.send('Network.setBlockedURLs', { urls: [
      '*://*.bentonow.com/*', '*://*.leadfeeder.com/*', '*://*.lfeeder.com/*',
      '*://*.calendly.com/*', '*://*.cloudflareinsights.com/*',
      '*://www.googletagmanager.com/*', '*://*.google-analytics.com/*',
    ] });
    const responses = [];
    session.on('Network.responseReceivedExtraInfo', event => {
      const header = Object.entries(event.headers).find(([name]) => name.toLowerCase() === 'content-security-policy');
      if (event.statusCode === 304 || header) responses.push({ status: event.statusCode, policy: header?.[1]?.replace(/'nonce-[^']+'/g, "'nonce-[response]'") });
    });
    const logs = [];
    page.on('console', message => {
      if (message.text().includes('Content Security Policy')) logs.push(message.text().replace(/'nonce-[^']+'/g, "'nonce-[response]'"));
    });
    await page.goto(`${origin}/`, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    const initialViolations = await page.evaluate(() => window.__ddReloadViolations);
    await page.reload({ waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    const reloadViolations = await page.evaluate(() => window.__ddReloadViolations);
    const scripts = await page.locator('script').evaluateAll(elements => elements.filter(element => !element.src).map(element => ({ text: element.textContent || '', noncePresent: Boolean(element.nonce) })));
    const cloudflareScripts = scripts.filter(script => script.text.includes('zaraz is loaded twice')).map(script => ({ hash: 'sha256-' + createHash('sha256').update(script.text).digest('base64'), noncePresent: script.noncePresent }));
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.__ddReloadUnapprovedScriptRan = true';
      document.head.appendChild(script);
    });
    await page.waitForTimeout(100);
    const probeBlocked = await page.evaluate(() => window.__ddReloadUnapprovedScriptRan !== true && window.__ddReloadViolations.some(event => event.disposition === 'enforce' && event.directive.startsWith('script-src')));
    const report = { production: true, responses, initialViolations, reloadViolations, cloudflareScripts, logs, probeBlocked };
    reports.push(report);
    console.log(JSON.stringify(report));
    await context.close();
  }

  // Verify the proposed on-wire 304 transformation with actual HTTP caching.
  // CDP response interception sees the merged cache response, so it cannot
  // faithfully simulate changing a 304 before the browser updates its cache.
  const application = 'window.applicationScriptRan = true';
  const digest = createHash('sha256').update(application).digest('base64');
  const policy = nonce => `script-src 'self' 'sha256-${digest}'${nonce ? ` 'nonce-${nonce}'` : ''}; script-src-attr 'none'; object-src 'none'; base-uri 'self'`;
  const requests = [];
  const server = createServer((request, response) => {
    const preservePolicy = request.url === '/fixed';
    const conditional = Boolean(request.headers['if-modified-since']);
    requests.push({ path: request.url, conditional, status: conditional ? 304 : 200 });
    response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    response.setHeader('Last-Modified', 'Sun, 01 Feb 2026 00:00:00 GMT');
    if (conditional) {
      if (!preservePolicy) response.setHeader('Content-Security-Policy', policy());
      response.writeHead(304);
      response.end();
      return;
    }
    const nonce = randomBytes(16).toString('base64');
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('Content-Security-Policy', policy(nonce));
    response.end(`<!doctype html><html><head><script>${application}</script><script nonce="${nonce}">window.cloudflareScriptRan = true</script></head><body>Cached CSP fixture</body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    for (const preservePolicy of [false, true]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const pathname = preservePolicy ? '/fixed' : '/broken';
      const url = `http://127.0.0.1:${address.port}${pathname}`;
      await page.goto(url);
      const initial = await page.evaluate(() => ({ application: window.applicationScriptRan === true, cloudflare: window.cloudflareScriptRan === true }));
      await page.reload();
      const afterReload = await page.evaluate(() => ({ application: window.applicationScriptRan === true, cloudflare: window.cloudflareScriptRan === true }));
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.textContent = 'window.unapprovedFixtureScriptRan = true';
        document.head.appendChild(script);
      });
      const probeBlocked = await page.evaluate(() => window.unapprovedFixtureScriptRan !== true);
      const wire = requests.filter(request => request.path === pathname);
      assert.deepEqual(initial, { application: true, cloudflare: true });
      assert.deepEqual(afterReload, { application: true, cloudflare: preservePolicy });
      assert.ok(wire.some(request => request.conditional && request.status === 304), 'Fixture must exercise HTTP 304.');
      assert.ok(probeBlocked, 'Unapproved inline code must remain blocked.');
      const report = { fixture: true, preservePolicy, initial, afterReload, probeBlocked, requests: wire };
      reports.push(report);
      console.log(JSON.stringify(report));
      await context.close();
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
} finally {
  fs.writeFileSync(`${directory}/revalidation.json`, JSON.stringify(reports, null, 2));
  await browser.close();
}
