import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { installLeadCapture } from './lead-capture';

const guide = '/files/Acing-Your-Logistics-Coordinator-Interview.pdf';
const bento = { identify: vi.fn(), track: vi.fn() };
let request: ReturnType<typeof vi.fn>;

function addGuideForm(ctaId = 'resource-top') {
  const container = document.createElement('div');
  container.className = 'lead-magnet-container';
  container.innerHTML = `
    <div class="success-message hidden">Check your email for the download!</div>
    <form class="lead-magnet-form block" data-lead-capture data-capture-kind="resource"
      data-lead-event="$subscribeLCCP" data-cta-id="${ctaId}" data-cta-placement="inline" data-redirect="${guide}">
      <input type="email" name="email" autocomplete="email" required />
      <button type="submit">Subscribe &amp; get guide</button>
    </form>`;
  document.body.append(container);
  return container;
}

beforeEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/posts/logistics-coordinator-career-path?utm_source=newsletter');
  sessionStorage.setItem('dd_landing_page', 'https://datadocks.com/posts/logistics-coordinator-career-path');
  request = vi.fn().mockImplementation(async () => new Response('{"ok":true}'));
  vi.stubGlobal('fetch', request);
  vi.stubGlobal('bento', bento);
  vi.stubGlobal('getBentoVisitorUuid', () => 'guide-test-visitor');
  vi.spyOn(window, 'open').mockImplementation(() => null);
  installLeadCapture();
});
afterEach(() => {
  document.body.innerHTML = '';
  sessionStorage.clear();
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks();
});

it('captures initial and dynamically inserted newsletter-guide forms with one API event each', async () => {
  const initial = addGuideForm();
  const afterNavigation = addGuideForm('resource-middle');
  // The delegated owner requires no additional binding after Astro navigation.
  document.dispatchEvent(new Event('astro:page-load'));
  document.dispatchEvent(new Event('astro:page-load'));
  installLeadCapture();

  for (const container of [initial, afterNavigation]) {
    const form = container.querySelector('form')!;
    form.querySelector('input')!.value = 'coordinator@example.com';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(form).toHaveClass('hidden'));
    expect(container.querySelector('.success-message')).not.toHaveClass('hidden');
    expect(form.querySelector('input')).toHaveValue('');
  }

  expect(request).toHaveBeenCalledTimes(2);
  const payloads = request.mock.calls.map(([, init]) => JSON.parse(String(init.body)));
  expect(payloads[0]).toMatchObject({
    email: 'coordinator@example.com', event: '$subscribeLCCP', source: '/posts/logistics-coordinator-career-path',
    landingPage: 'https://datadocks.com/posts/logistics-coordinator-career-path',
    visitorUuid: 'guide-test-visitor', ctaId: 'resource-top', ctaPlacement: 'inline',
    currentTouch: { utm_source: 'newsletter' },
  });
  expect(payloads[1]).toMatchObject({ ctaId: 'resource-middle' });
  expect(bento.identify).toHaveBeenCalledTimes(2);
  expect(bento.track).not.toHaveBeenCalled();
  expect(window.open).toHaveBeenCalledTimes(2);
  expect(window.open).toHaveBeenCalledWith(guide, '_blank', 'noopener');
});

it('does not duplicate a resource event or show a saved state while its request is pending', async () => {
  let complete!: (response: Response) => void;
  request.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const container = addGuideForm(), form = container.querySelector('form')!;
  form.querySelector('input')!.value = 'coordinator@example.com';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(request).toHaveBeenCalledOnce();
  expect(form).not.toHaveClass('hidden');
  expect(window.open).not.toHaveBeenCalled();
  complete(new Response('{"ok":true}'));
  await vi.waitFor(() => expect(form).toHaveClass('hidden'));
  expect(bento.track).not.toHaveBeenCalled();
  expect(window.open).toHaveBeenCalledOnce();
});

it('leaves a failed guide request editable without opening a calendar or claiming delivery', async () => {
  request.mockResolvedValueOnce(new Response('{"ok":false}', { status: 503 }));
  const container = addGuideForm(), form = container.querySelector('form')!;
  form.querySelector('input')!.value = 'coordinator@example.com';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(container.querySelector('[role="status"]')).toHaveTextContent('couldn’t confirm'));
  expect(form).not.toHaveClass('hidden');
  expect(form.querySelector('input')).toHaveValue('coordinator@example.com');
  expect(form.querySelector('button')).toBeEnabled();
  expect(container.querySelector('.success-message')).toHaveClass('hidden');
  expect(request).toHaveBeenCalledOnce();
  expect(bento.track).not.toHaveBeenCalled();
  expect(window.open).not.toHaveBeenCalled();
});
