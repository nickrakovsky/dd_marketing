import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] || 'https://datadocks.com').origin;
const directory = 'csp-diagnostics';
fs.mkdirSync(directory, { recursive: true });
const reports = [];
const browser = await chromium.launch({ headless: process.env.CSP_HEADED !== '1' });
try {
  for (const simulateFix of [false, true]) {
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
      if (event.statusCode === 304 || header) responses.push({ status: event.statusCode, policy: header?.[1]?.replace(/'nonce-[^']+'/g, "'nonce-[response]'"), headersWereModified: simulateFix && event.statusCode === 304 });
    });
    if (simulateFix) {
      await session.send('Fetch.enable', { patterns: [{ urlPattern: `${origin}/`, requestStage: 'Response' }] });
      session.on('Fetch.requestPaused', async event => {
        if (event.responseStatusCode === 304) {
          await session.send('Fetch.continueResponse', {
            requestId: event.requestId, responseCode: 304,
            responsePhrase: event.responseStatusText || 'Not Modified',
            responseHeaders: (event.responseHeaders || []).filter(header => header.name.toLowerCase() !== 'content-security-policy'),
          });
        } else await session.send('Fetch.continueResponse', { requestId: event.requestId });
      });
    }
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
    const report = { simulateFix, responses, initialViolations, reloadViolations, cloudflareScripts, logs, probeBlocked };
    reports.push(report);
    console.log(JSON.stringify(report));
    await context.close();
  }
} finally {
  fs.writeFileSync(`${directory}/revalidation.json`, JSON.stringify(reports, null, 2));
  await browser.close();
}
