import { demoQualificationActive, isDemoLeadForm } from './demo-rollout';
import { captureLead } from './home-demo-capture';
import type {} from './bento';
import { CALENDLY_BOOKING_URL, CALENDLY_BRAND_PARAMS } from './calendly-config.mjs';

type MarketingWindow = Window & {
  ddCurrentEmail?: string;
  ddSetEmail?: (email: string) => void;
  ddGetAttribution?: () => { first?: Record<string, unknown>; last?: Record<string, unknown> };
  getBentoVisitorUuid?: () => string | null;
  ddOpenCalendly?: (params: string) => void;
};

import { captureContext } from './lead-context';
export { captureContext, pageCategory } from './lead-context';
function optional<T>(read: () => T): T | undefined { try { return read(); } catch { return undefined; } }
function newId() { return optional(() => crypto.randomUUID()) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }

function bookingParams(extra = CALENDLY_BRAND_PARAMS) {
  const params = new URLSearchParams(extra);
  // The existing popup reads the in-memory email for prefill. Keep it out of
  // link URLs, which outbound-click analytics can collect automatically.
  params.delete('email');
  return params;
}

function appendBookingLink(status: HTMLElement, extra?: string) {
  const link = document.createElement('a');
  link.href = `${CALENDLY_BOOKING_URL}?${bookingParams(extra)}`;
  link.textContent = 'Open booking calendar';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.directBooking = 'true';
  link.className = 'underline';
  status.append(' ', link);
}

const inFlight = new WeakSet<HTMLFormElement>();
const statuses = new WeakMap<HTMLFormElement, HTMLElement>();
const installed = new WeakSet<Document>();

/** One owner for static Astro forms and hydrated React/Solid forms alike. */
export function installLeadCapture(root: Document = document) {
  if (installed.has(root)) return;
  installed.add(root);
  root.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-lead-capture')) return;
    if (demoQualificationActive() && isDemoLeadForm(form)) return;
    event.preventDefault();
    void submitLeadForm(form);
  });
}

// Until qualification rolls out, preserve the former inline CTAs' immediate
// handoff. Importing the shared data foundation must not introduce a waiting gate.
const legacySubmissions = new WeakMap<HTMLFormElement, string>();
function submitUngatedDemo(form: HTMLFormElement) {
  if (!form.reportValidity()) return;
  const input = form.querySelector<HTMLInputElement>('input[name="email"]');
  if (!input) return;
  const email = input.value.trim();
  const marketing = window as MarketingWindow;
  marketing.ddCurrentEmail = email;
  optional(() => marketing.ddSetEmail?.(email));
  if (legacySubmissions.get(form) !== email) {
    legacySubmissions.set(form, email);
    const context = captureContext(form.dataset.ctaId || form.id, form.dataset.ctaPlacement || 'inline');
    try { if (form.dataset.leadMetadata) context.metadata = JSON.parse(form.dataset.leadMetadata); } catch { /* Optional metadata. */ }
    void captureLead(email, context, form.dataset.leadEvent || 'Demo Subscriber')
      .then(() => optional(() => marketing.bento?.identify?.(email))).catch(() => undefined);
  }
  let status = statuses.get(form)
    || form.querySelector<HTMLElement>('[data-capture-status]')
    || (form.dataset.captureStatusId ? document.getElementById(form.dataset.captureStatusId) : null);
  if (!status) {
    status = document.createElement('p'); status.className = 'lead-capture-status';
    form.after(status);
  }
  statuses.set(form, status);
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  if (!status.id) status.id = `capture-${newId()}`;
  input.setAttribute('aria-describedby', status.id);
  status.textContent = 'Choose a time for your software demo.';
  appendBookingLink(status, form.dataset.bookingParams);
  const dialog = form.closest('dialog');
  if (dialog) { dialog.after(status); optional(() => dialog.close()); }
  optional(() => {
    const params = bookingParams(form.dataset.bookingParams);
    if (marketing.ddOpenCalendly) marketing.ddOpenCalendly(params.toString());
    else window.open(`${CALENDLY_BOOKING_URL}?${params}`, '_blank', 'noopener');
  });
}

export async function submitLeadForm(form: HTMLFormElement) {
  if (isDemoLeadForm(form)) {
    if (!demoQualificationActive()) submitUngatedDemo(form);
    return;
  }
  if (inFlight.has(form) || !form.reportValidity()) return;
  const input = form.querySelector<HTMLInputElement>('input[name="email"]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!input || !button) return;
  inFlight.add(form);
  const originalDisabled = button.disabled;
  const originalReadOnly = input.readOnly;
  button.disabled = true;
  input.readOnly = true;
  form.setAttribute('aria-busy', 'true');
  let status = form.querySelector<HTMLElement>('[data-capture-status]')
    || (form.dataset.captureStatusId ? document.getElementById(form.dataset.captureStatusId) : null)
    || statuses.get(form);
  if (!status) {
    status = document.createElement('p');
    status.dataset.statusFor = form.dataset.ctaId || 'lead';
    status.className = 'lead-capture-status';
    form.after(status);
  }
  statuses.set(form, status);
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  if (!status.id) status.id = `capture-${newId()}`;
  if (!input.hasAttribute('aria-label') && !input.labels?.length) input.setAttribute('aria-label', 'Email address');
  input.autocomplete = 'email';
  input.setAttribute('aria-describedby', status.id);
  status.textContent = 'Saving your request…';
  const email = input.value.trim();
  const eventName = form.dataset.leadEvent || 'Demo Subscriber';
  const resource = form.dataset.captureKind === 'resource';
  const marketing = window as MarketingWindow;
  let saved = false;
  try {
    const context = captureContext(form.dataset.ctaId || form.id, form.dataset.ctaPlacement || 'inline');
    if (form.dataset.leadMetadata) context.metadata = JSON.parse(form.dataset.leadMetadata);
    await captureLead(email, context, eventName);
    saved = true;
    marketing.ddCurrentEmail = email;
    optional(() => marketing.ddSetEmail?.(email));
    optional(() => marketing.bento?.identify?.(email));
    // The accepted API event is the single resource-event writer.
    if (resource) {
      const container = form.closest('.lead-magnet-container');
      form.classList.add('hidden');
      form.classList.remove('block');
      container?.querySelector('.disclaimer-message')?.classList.add('hidden');
      container?.querySelector('.success-message')?.classList.remove('hidden');
      status.textContent = 'Request saved.';
      if (form.dataset.redirect) optional(() => window.open(form.dataset.redirect, '_blank', 'noopener'));
    } else {
      status.textContent = 'Email saved. Choose a time for your demo.';
      appendBookingLink(status, form.dataset.bookingParams);
      const dialog = form.closest('dialog');
      // Keep feedback in the dialog on failure; on success place a visible fallback
      // outside it before closing. Popup availability cannot prove it opened.
      if (dialog) {
        const previous = document.getElementById(`${status.id}-saved`);
        previous?.remove();
        const outside = status.cloneNode(true) as HTMLElement;
        outside.id = `${status.id}-saved`;
        outside.tabIndex = -1;
        outside.className = 'lead-capture-status';
        dialog.after(outside);
        if (dialog.open) optional(() => dialog.close());
        outside.focus();
      }
      const params = bookingParams(form.dataset.bookingParams);
      // A blocked popup never changes a saved request into a capture failure.
      optional(() => {
        if (marketing.ddOpenCalendly) marketing.ddOpenCalendly(params.toString());
        else window.open(`${CALENDLY_BOOKING_URL}?${params}`, '_blank', 'noopener');
      });
    }
    form.reset();
  } catch {
    status.textContent = saved ? 'Request saved.' : 'We couldn’t confirm your request. Please try again.';
    if (!resource) appendBookingLink(status, form.dataset.bookingParams);
    if (!saved) input.focus();
  } finally {
    inFlight.delete(form);
    button.disabled = originalDisabled;
    input.readOnly = originalReadOnly;
    form.removeAttribute('aria-busy');
  }
}
