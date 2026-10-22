import { afterEach, expect, it, vi } from 'vitest';

const guide = '/files/Acing-Your-Logistics-Coordinator-Interview.pdf';
let detach: (() => void) | undefined;

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
  detach?.();
  vi.resetModules();
});

it('binds the approved guide forms once and submits their email, event and attribution', async () => {
  window.history.replaceState({}, '', '/posts/logistics-coordinator-career-path');
  sessionStorage.setItem('dd_landing_page', 'https://datadocks.com/posts/logistics-coordinator-career-path');
  const fetch = vi.fn().mockResolvedValue({ ok: true });
  const bento = { identify: vi.fn(), track: vi.fn() };
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('bento', bento);
  vi.stubGlobal('getBentoVisitorUuid', () => 'guide-test-visitor');
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const initial = addGuideForm();

  // Import the actual external browser module, including its initial binding
  // and Astro navigation listener. All network and analytics calls are stubbed.
  const { attachLogisticsInterviewGuides } = await import('./logistics-interview-guide.mjs');
  detach = () => document.removeEventListener('astro:page-load', attachLogisticsInterviewGuides);
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
