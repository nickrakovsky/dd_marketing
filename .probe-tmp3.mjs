import { chromium } from 'playwright';

const UUID = 'b4cb9a34a989bcc643714151df7b7154';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const log = [];
page.on('requestfailed', r => log.push('REQFAILED ' + r.url() + ' ' + JSON.stringify(r.failure())));

// Intercept stage-2 to see the REAL headers the browser gets
await page.route('https://app.bentonow.com/**', async route => {
  const req = route.request();
  log.push('REQ HEADERS ' + JSON.stringify(await req.allHeaders(), null, 1));
  const resp = await route.fetch();
  log.push('UPSTREAM STATUS ' + resp.status());
  log.push('UPSTREAM HEADERS ' + JSON.stringify(resp.headers(), null, 1));
  await route.fulfill({ response: resp });
});

await page.route('https://example.test/', r => r.fulfill({
  status: 200, contentType: 'text/html; charset=utf-8',
  body: `<!doctype html><html><body><h1>x</h1>
  <script>window.bentoSettings={uuid:'${UUID}'};
  var s=document.createElement('script');
  s.src='https://app.bentonow.com/${UUID}.js';
  s.onload=()=>{window.__ok=true};
  s.onerror=()=>{window.__err=true};
  document.head.appendChild(s);
  </script></body></html>`,
}));

await page.goto('https://example.test/', { waitUntil: 'load' });
await page.waitForTimeout(6000);
const r = await page.evaluate(() => ({ ok: !!window.__ok, err: !!window.__err, bento: typeof window.bento, jq: typeof window.jQuery }));
console.log('RESULT ' + JSON.stringify(r));
console.log(log.join('\n'));
await browser.close();
