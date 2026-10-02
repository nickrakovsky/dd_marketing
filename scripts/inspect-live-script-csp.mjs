import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// Inspect public page startup only. Do not submit forms or send vendor events.
const origin = new URL(process.argv[2] || 'https://datadocks.com').origin;
if (new URL(origin).protocol !== 'https:') throw new Error('Use an HTTPS site URL.');
const target = process.argv[3];
const directory = 'csp-diagnostics';
fs.mkdirSync(directory, { recursive: true });
const reports = [];
const browser = await chromium.launch();
const safeUrl = value => {
  try { const url = new URL(value); return `${url.origin}${url.pathname}`; }
  catch { return value; }
};
try {
  for (const serviceWorkers of ['allow', 'block']) {
    const context = await browser.newContext({ serviceWorkers, viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
      const data = { violations: [], scripts: [] };
      Object.defineProperty(window, '__ddCspDiagnostics', { value: data });
      const seen = new WeakMap();
      const record = node => {
        if (!(node instanceof HTMLScriptElement)) return;
        const text = node.textContent || '';
        if (seen.get(node) === text) return;
        seen.set(node, text);
        data.scripts.push({ text, src: node.getAttribute('src'), type: node.type, id: node.id, noncePresent: Boolean(node.nonce) });
      };
      document.addEventListener('securitypolicyviolation', event => data.violations.push({
        directive: event.effectiveDirective, disposition: event.disposition,
        blockedURI: event.blockedURI, source: event.sourceFile, line: event.lineNumber,
        column: event.columnNumber, sample: event.sample,
        policy: event.originalPolicy.replace(/'nonce-[^']+'/g, "'nonce-[response]'"),
      }));
      new MutationObserver(mutations => {
        for (const mutation of mutations) {
          record(mutation.target);
          for (const node of mutation.addedNodes) {
            record(node);
            node.querySelectorAll?.('script').forEach(record);
          }
        }
      }).observe(document, { subtree: true, childList: true, characterData: true });
      document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('script').forEach(record));
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === origin ? route.continue() : route.abort();
    });
    for (const pathname of ['/', '/integrations']) {
      const page = await context.newPage();
      const logs = [];
      page.on('console', message => {
        if (message.text().includes('Content Security Policy') || message.text().includes('content security policy')) {
          logs.push({ type: message.type(), text: message.text().replace(/'nonce-[^']+'/g, "'nonce-[response]'"), source: safeUrl(message.location().url), line: message.location().lineNumber });
        }
      });
      const response = await page.goto(origin + pathname, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (response.status() !== 200) throw new Error(`${pathname}: HTTP ${response.status()}; inspect the response before retrying.`);
      // Partytown's existing main-thread fallback fires after ten seconds.
      await page.waitForTimeout(13000);
      const frames = [];
      for (const frame of page.frames()) {
        try {
          const data = await frame.evaluate(() => window.__ddCspDiagnostics);
          frames.push({
            url: safeUrl(frame.url()),
            violations: (data?.violations || []).map(event => ({ ...event, source: safeUrl(event.source), blockedURI: safeUrl(event.blockedURI) })),
            scripts: (data?.scripts || []).map(script => {
              const hash = 'sha256-' + createHash('sha256').update(script.text).digest('base64');
              return { src: script.src ? safeUrl(new URL(script.src, frame.url()).href) : null, type: script.type, id: script.id, noncePresent: script.noncePresent, hash, bytes: Buffer.byteLength(script.text), ...(hash === target ? { matchedScript: script.text } : {}) };
            }),
          });
        } catch (error) { frames.push({ url: safeUrl(frame.url()), error: error.message }); }
      }
      const headers = await response.allHeaders();
      const report = { pathname, serviceWorkers, status: response.status(), title: await page.title(), policy: headers['content-security-policy']?.replace(/'nonce-[^']+'/g, "'nonce-[response]'"), logs, frames };
      reports.push(report);
      console.log(JSON.stringify({ pathname, serviceWorkers, logs, violations: frames.flatMap(frame => frame.violations || []), targetMatches: frames.flatMap(frame => frame.scripts || []).filter(script => script.hash === target) }));
      await page.close();
    }
    await context.close();
  }
} finally {
  fs.writeFileSync(`${directory}/runtime.json`, JSON.stringify(reports, null, 2));
  await browser.close();
}
