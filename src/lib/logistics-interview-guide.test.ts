import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const component = readFileSync(
  resolve('src/components/blog/LogisticsInterviewGuide.astro'),
  'utf8',
);
const script = component.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
const guide = '/files/Acing-Your-Logistics-Coordinator-Interview.pdf';

function addGuideForm() {
  const container = document.createElement('div');
  container.className = 'lead-magnet-container';
  container.innerHTML = `
    <div class="success-message hidden"></div>
    <form class="lead-magnet-form block" data-event="$subscribeLCCP" data-redirect="${guide}">
      <input type="email" name="email" autocomplete="email" required />
      <button type="submit">Subscribe &amp; get guide</button>
    </form>`;
  document.body.append(container);
  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('binds the approved guide forms once and submits their email, event and attribution', () => {
  expect(script).toBeTruthy();
  window.history.replaceState({}, '', '/posts/logistics-coordinator-career-path');
  sessionStorage.setItem('dd_landing_page', 'https://datadocks.com/posts/logistics-coordinator-career-path');
  const fetch = vi.fn().mockResolvedValue({ ok: true });
  const bento = { identify: vi.fn(), track: vi.fn() };
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('bento', bento);
  vi.stubGlobal('getBentoVisitorUuid', () => 'guide-test-visitor');
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const initial = addGuideForm();

  // Execute the component's real browser script: a malformed selector string
  // previously prevented every form on the page from binding at all.
  window.eval(script!);
  const afterNavigation = addGuideForm();
  document.dispatchEvent(new Event('astro:page-load'));
  document.dispatchEvent(new Event('astro:page-load'));

  for (const container of [initial, afterNavigation]) {
    const form = container.querySelector('form')!;
    const email = form.querySelector('input')!;
    expect(form.dataset.bound).toBe('true');
    email.value = 'coordinator@example.com';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(form).toHaveClass('hidden');
    expect(container.querySelector('.success-message')).toHaveClass('block');
    expect(email.value).toBe('');
  }

  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenCalledWith('/api/bento-track', expect.objectContaining({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    email: 'coordinator@example.com',
    event: '$subscribeLCCP',
    source: '/posts/logistics-coordinator-career-path',
    landingPage: 'https://datadocks.com/posts/logistics-coordinator-career-path',
    visitorUuid: 'guide-test-visitor',
  });
  expect(bento.identify).toHaveBeenCalledTimes(2);
  expect(bento.track).toHaveBeenCalledWith('$subscribeLCCP', { source: '/posts/logistics-coordinator-career-path' });
  expect(open).toHaveBeenCalledTimes(2);
  expect(open).toHaveBeenCalledWith(guide, '_blank', 'noopener');
});
