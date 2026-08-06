import { chromium } from 'playwright';
import fs from 'node:fs';

const UUID = 'b4cb9a34a989bcc643714151df7b7154';
const loader = fs.readFileSync('/tmp/bento-loader.js', 'utf8');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>p</title></head><body><h1 style="font-family:sans-serif">probe</h1>
<script>window.bentoSettings={uuid:'${UUID}'};
window.__p={load:false,err:null,ready:false};
window.addEventListener('bento:ready',()=>{window.__p.ready=true;});
function go(){var s=document.createElement('script');s.src='/api/bento-sdk';
s.onload=()=>{window.__p.load=true};s.onerror=()=>{window.__p.err='onerror'};document.head.appendChild(s);}
if('requestIdleCallback' in window)requestIdleCallback(go);else setTimeout(go,50);
</script></body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: UA });
const page = await ctx.newPage();
const log = [];
page.on('console', m => log.push('CONSOLE ' + m.type() + ': ' + m.text().slice(0, 250)));
page.on('pageerror', e => log.push('PAGEERROR ' + String(e).slice(0, 250)));
page.on('requestfailed', r => log.push('REQFAILED ' + r.url() + ' ' + JSON.stringify(r.failure())));
page.on('response', r => { if (r.url().includes('bento')) log.push('RESP ' + r.status() + ' ' + r.url().slice(0, 110) + ' ct=' + (r.headers()['content-type'] || '?')); });

await page.route('https://example.test/', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PAGE }));
await page.route('https://example.test/api/bento-sdk', r => r.fulfill({ status: 200, headers: { 'Content-Type': 'application/javascript; charset=utf-8' }, body: loader }));

await page.goto('https://example.test/', { waitUntil: 'load' });
await page.waitForTimeout(8000);
await page.mouse.move(150, 150); await page.mouse.move(200, 220);
await page.waitForTimeout(6000);

const probe = await page.evaluate(() => ({
  p: window.__p,
  stage2El: !!document.getElementById('bento-full-script-js'),
  bento: typeof window.bento,
  methods: window.bento ? Object.keys(window.bento).sort() : null,
  jQuery: typeof window.jQuery, dollar: typeof window.$, bentoDollar: typeof window.bento$,
  cookie: document.cookie,
  ls: Object.keys(localStorage).sort(),
  lsVisitor: localStorage.getItem('bento_visitor_id'),
  bodyVisibility: getComputedStyle(document.body).visibility,
  headStyles: [...document.querySelectorAll('head style')].map(s => s.textContent.slice(0, 60)),
  layoutHelperResult: (function(){var cs=document.cookie.split(';');for(var i=0;i<cs.length;i++){var c=cs[i].trim();if(c.indexOf('bento_')===0)return c.split('=').slice(1).join('=');}return null;})(),
}));
console.log('=== PROBE ===\n' + JSON.stringify(probe, null, 2));
console.log('=== LOG ===\n' + log.join('\n'));
console.log('=== ctx cookies ===\n' + JSON.stringify(await ctx.cookies()));
await browser.close();
