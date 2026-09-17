import { test, expect } from '@playwright/test';

// All lead writes and third-party requests are intercepted, including analytics.
// Calendly's real launcher runs against a stub, so its email prefill is checked.
test.use({ serviceWorkers: 'block' });
const pageErrors=new WeakMap();
test.beforeEach(async ({page}) => {
  const errors=[];
  pageErrors.set(page,errors);
  page.on('pageerror',error => errors.push(error.stack || error.message));
});
test.afterEach(async ({page}) => {
  expect(pageErrors.get(page),'No page JavaScript errors').toEqual([]);
});
async function prepare(page, baseURL) {
  const origin = new URL(baseURL).origin;
  const captures = [];
  let mode = 'success', release;
  await page.addInitScript(() => {
    // Pair blocked workers with Partytown's supported no-worker fallback.
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined });
    window.__captureTestBookings = [];
    window.__captureTestOpens = [];
    window.Calendly = { initPopupWidget: options => window.__captureTestBookings.push(options) };
    window.bento = { identify() {}, view() {}, track() {} };
    window.open = (...args) => { window.__captureTestOpens.push(args); return null; };
  });
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin && url.pathname === '/api/bento-track') {
      captures.push(request.postDataJSON());
      if(mode === 'pending') await new Promise(resolve => release = resolve);
      return route.fulfill({status:mode === 'httpFailure' ? 503 : 200,contentType:'application/json',body:JSON.stringify({ok:mode === 'success'})});
    }
    if(url.hostname === 'assets.calendly.com') return route.fulfill({contentType:url.pathname.endsWith('.css')?'text/css':'application/javascript',body:''});
    if(url.origin === origin && ['GET','HEAD'].includes(request.method())) return route.continue();
    return route.abort();
  });
  return {
    captures,
    calls: () => page.evaluate(() => window.__captureTestBookings),
    setMode(value) { mode=value; },
    async waitPending() { await expect.poll(() => !!release).toBe(true); },
    release() { mode='success'; release(); release=null; },
    async expectNoFallback() { expect(await page.evaluate(() => window.__captureTestOpens)).toEqual([]); }
  };
}

async function checkForm(page, state, form, email) {
  const input=form.locator('input[name="email"]'),button=form.locator('button[type="submit"]');
  await expect(form).toHaveAttribute('data-demo-capture');
  await input.fill(email);
  for(const mode of ['httpFailure','bodyFailure']) {
    state.setMode(mode);
    await button.click();
    await expect(page.locator(`#${await input.getAttribute('aria-describedby')}`)).toContainText('Please try again');
    await expect(input).toBeFocused();
    await expect(button).toBeEnabled();
    expect(await state.calls()).toEqual([]);
  }
  state.setMode('pending');
  await button.click();
  await state.waitPending();
  await expect(button).toBeDisabled();
  await expect(form).toHaveAttribute('aria-busy','true');
  expect(await state.calls()).toEqual([]);
  await form.evaluate(form => form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await page.waitForTimeout(100);
  expect(state.captures).toHaveLength(3);
  state.release();
  await expect.poll(async () => (await state.calls()).length).toBe(1);
  await expect(button).toBeEnabled();
  const [booking]=await state.calls();
  expect(new URL(booking.url).searchParams.get('email')).toBe(email);
  expect(booking.prefill.email).toBe(email);
  expect(state.captures[2]).toMatchObject({email,event:'Demo Subscriber'});
  await expect(page.locator('#demo-capture-dialog')).toBeHidden();
  await state.expectNoFallback();
}

for(const path of ['/news','/wireframes/modular-editorial']) {
  test(`${path}: mobile navigation closes and dialog dismissal restores hamburger focus`,async ({page,baseURL}) => {
    const state=await prepare(page,baseURL);
    await page.setViewportSize({width:390,height:844});
    await page.goto(path);
    const menu=page.locator('[data-mobile-menu]'),toggle=page.locator('[data-mobile-toggle]'),dialog=page.locator('#demo-capture-dialog');
    for(const closeMethod of ['Escape','button']) {
      await toggle.click();
      await menu.getByRole('link',{name:'Schedule a Demo',exact:true}).click();
      await expect(menu).toBeHidden();
      await expect(page.locator('[data-icon-menu]')).toBeVisible();
      await expect(page.locator('[data-icon-close]')).toBeHidden();
      await expect(dialog).toBeVisible();
      await expect(page.locator('#demo-dialog-email')).toBeFocused();
      if(closeMethod==='Escape') await page.keyboard.press('Escape');
      else await dialog.locator('[data-close-demo]').click();
      await expect(dialog).toBeHidden();
      await expect(toggle).toBeFocused();
    }
    expect(state.captures).toEqual([]);
    expect(await state.calls()).toEqual([]);
    await state.expectNoFallback();
  });

  test(`${path}: desktop dialog dismissal restores trigger focus`,async ({page,baseURL}) => {
    const state=await prepare(page,baseURL);
    await page.setViewportSize({width:1280,height:900});
    await page.goto(path);
    const link=page.locator('nav').getByRole('link',{name:'Schedule a Demo',exact:true});
    await expect(link).toHaveAttribute('href','#book-demo');
    await link.click();
    await expect(page.locator('#demo-capture-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(link).toBeFocused();
    expect(state.captures).toEqual([]);
    expect(await state.calls()).toEqual([]);
  });

  test(`${path}: direct booking anchor and hash change open standalone capture`,async ({page,baseURL}) => {
    const state=await prepare(page,baseURL);
    await page.goto(`${path}#book-demo`);
    await expect(page.locator('#demo-capture-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.evaluate(() => location.hash='');
    await page.evaluate(() => location.hash='#book-demo');
    await expect(page.locator('#demo-capture-dialog')).toBeVisible();
    expect(state.captures).toEqual([]);
    expect(await state.calls()).toEqual([]);
  });

  for(const formId of ['dialog','cta-bento-form',...(path.includes('modular-editorial')?['demo-banner-form']:[])]) {
    test(`${path}: ${formId} waits for confirmed save and books once with email`,async ({page,baseURL}) => {
      const state=await prepare(page,baseURL);
      await page.setViewportSize({width:1280,height:900});
      await page.goto(path);
      if(formId==='dialog') await page.locator('nav').getByRole('link',{name:'Schedule a Demo',exact:true}).click();
      const form=page.locator(formId==='dialog'?'#demo-capture-dialog form':`#${formId}`);
      await checkForm(page,state,form,`${formId}@example.com`);
    });
  }
}
