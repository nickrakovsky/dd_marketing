import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { captureContext } from './lead-context';
import { buildBentoEvent } from './bento-track-payload';
import { leadContext } from './server/demo-validation';
beforeEach(() => {
  history.replaceState(null, '', '/outbound-dock-management?utm_source=google&gclid=test-click');
  document.documentElement.dataset.demoAttribution = 'page';
  sessionStorage.clear(); localStorage.clear();
});
afterEach(() => { delete document.documentElement.dataset.demoAttribution; history.replaceState(null, '', '/'); vi.restoreAllMocks(); });
it('retains conversion-page attribution and the distinct original session through the durable API', () => {
  const original = `${location.origin}/posts/original?utm_source=newsletter`;
  sessionStorage.setItem('dd_landing_page', original);
  const context = captureContext('campaign-hero', 'hero');
  const validated = leadContext(context, location.origin);
  expect(validated).toMatchObject({ landingPage: location.href, landingPageMode: 'page', sessionLandingPage: original });
  const event = buildBentoEvent({ ...validated, email: 'buyer@company.com', event: 'Demo Subscriber' });
  expect(event).toMatchObject({ landing_page_url: location.href, details: { session_landing_url: original, conversion_page_url: location.href, landing_page_mode: 'page' } });
});
it('records the campaign when storage is blocked without inventing an original session', () => {
  vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
  const context = captureContext('campaign-hero', 'hero');
  expect(context.landingPage).toBe(location.href);
  const event = buildBentoEvent({ ...context, email: 'buyer@company.com', event: 'Demo Subscriber' });
  expect(event.details).toMatchObject({ conversion_page_url: location.href, attribution_availability: { session_landing: 'unknown' } });
  expect(event.details).not.toHaveProperty('session_landing_url');
});
it('keeps session attribution on ordinary pages', () => {
  delete document.documentElement.dataset.demoAttribution;
  sessionStorage.setItem('dd_landing_page', `${location.origin}/posts/original`);
  expect(captureContext('hero', 'hero').landingPage).toBe(`${location.origin}/posts/original`);
});
it('rejects an external original-session URL in the durable contract', () => {
  expect(() => leadContext({ source: '/', landingPageMode: 'page', landingPage: `${location.origin}/`, sessionLandingPage: 'https://other.test/' }, location.origin)).toThrow();
});
