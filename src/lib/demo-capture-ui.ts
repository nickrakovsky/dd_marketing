import { facilityBookingUrl } from './demo-qualification';
import type { DemoCaptureFlow } from './demo-qualification';
import { isDemoLeadForm } from './demo-rollout';
import { CALENDLY_BOOKING_FRAGMENT } from './calendly-config.mjs';

/** Delegation includes hydrated React/Solid forms without adding another submit owner. */
export function mountDemoCapture(
  root: HTMLElement,
  source: DemoCaptureFlow | ((form: HTMLFormElement) => DemoCaptureFlow),
  onReady: (email: string, flow: DemoCaptureFlow, form: HTMLFormElement) => void,
) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const dialog = root.querySelector<HTMLDialogElement>('[data-demo-dialog]');
  let trigger: HTMLElement | null = null;
  let flow: DemoCaptureFlow | undefined = typeof source === 'function' ? undefined : source;
  let unsubscribe = () => {};
  let previousStep = flow?.getState().step;
  let submitting = false;
  let sequence = 0;
  const forms = () => [...root.querySelectorAll<HTMLFormElement>('form')].filter(isDemoLeadForm);
  function statusFor(form: HTMLFormElement) {
    let status = form.querySelector<HTMLElement>('[data-demo-status], [data-capture-status]')
      || (form.dataset.captureStatusId ? document.getElementById(form.dataset.captureStatusId) : null);
    if (!status) {
      status = document.createElement('p');
      status.dataset.demoStatus = '';
      status.className = 'lead-capture-status';
      // Place below, outside flex rows, and reuse on subsequent submissions.
      form.after(status);
      form.dataset.captureStatusId = status.id = `demo-status-${++sequence}`;
    }
    if (!status.id) status.id = `demo-status-${++sequence}`;
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    return status;
  }
  const render = () => {
    if (!flow) return;
    const state = flow.getState();
    forms().forEach(form => {
      const input = form.querySelector<HTMLInputElement>('input[name="email"]');
      if (!input) return;
      const status = statusFor(form);
      input.setAttribute('aria-describedby', status.id);
      input.autocomplete = 'email';
      form.dataset.step = state.step;
      // CRM state never disables booking. Preserve existing CTA labels/icons.
      input.readOnly = state.step === 'ready';
      if (state.step !== previousStep || state.step === 'ready') input.value = state.email;
      if (state.step === 'work-email') {
        input.placeholder = 'Enter your work email';
        input.setAttribute('aria-label', 'Work email address');
      }
      const label = form.querySelector<HTMLElement>('[data-demo-label]');
      if (label) label.textContent = state.step === 'work-email' ? 'Work email address' : 'Email address';
      status.textContent = state.message;
    });
    previousStep = state.step;
    root.querySelectorAll<HTMLAnchorElement>('[data-demo-facility]').forEach(link => {
      link.href = facilityBookingUrl(state.email || state.originalPersonalEmail || undefined);
    });
  };
  const subscribe = () => { unsubscribe(); if (flow) unsubscribe = flow.subscribe(render); };
  if (flow) subscribe();
  const close = () => {
    dialog?.close();
    const target = trigger?.getClientRects().length ? trigger
      : trigger?.closest('[data-nav]')?.querySelector<HTMLElement>('[data-mobile-toggle]');
    target?.focus({ preventScroll: true });
  };
  function open(link: HTMLElement | null = null) {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    trigger = link;
    const form = dialog.querySelector<HTMLFormElement>('form');
    if (form) {
      form.dataset.ctaId = link?.dataset.ctaId || 'demo-dialog';
      form.dataset.ctaPlacement = link?.dataset.ctaId?.startsWith('navigation-') ? 'navigation' : 'dialog';
    }
    if (!dialog.open) dialog.showModal();
    render();
    dialog.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
  }
  // Rewrite links before activation so modified clicks land on the same prompt.
  function qualifyLinks() {
    root.querySelectorAll<HTMLAnchorElement>(`a[href*="${CALENDLY_BOOKING_FRAGMENT}"]`).forEach(link => {
      if (link.hasAttribute('data-qualified-booking')) return;
      link.href = '#book-demo'; link.removeAttribute('target'); link.dataset.demoOpen = '';
    });
  }
  qualifyLinks();
  const observer = new MutationObserver(qualifyLinks);
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLElement>('[data-demo-open], a[href="#book-demo"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); open(link);
  }, options);
  dialog?.querySelector('[data-demo-close]')?.addEventListener('click', close, options);
  dialog?.addEventListener('cancel', event => { event.preventDefault(); close(); }, options);
  dialog?.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }, options);
  root.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !isDemoLeadForm(form)) return;
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    const input = form.querySelector<HTMLInputElement>('input[name="email"]');
    if (!input) return;
    const value = input.value;
    if (!flow && typeof source === 'function') { flow = source(form); subscribe(); }
    if (!flow) return;
    submitting = true;
    const state = await flow.submit(value);
    submitting = false;
    const parentDialog = form.closest('dialog');
    if (controller.signal.aborted || (parentDialog && !parentDialog.open)) return;
    if (state.step === 'ready') { dialog?.close(); onReady(state.email, flow, form); }
    else input.focus();
  }, options);
  const fromHash = () => { if (location.hash === '#book-demo') open(); };
  window.addEventListener('hashchange', fromHash, options);
  window.addEventListener('dd:demo-open', () => open(), options);
  fromHash();
  return () => { controller.abort(); observer.disconnect(); unsubscribe(); };
}
