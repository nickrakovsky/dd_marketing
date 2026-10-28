export const AUDIT_PACK_EVENT = '$subscribeWarehouseAudit';
const ACCESS_KEY = 'dd_warehouse_audit_pack_access';
const PREVIEW_ACCESS_KEY = 'dd_warehouse_audit_pack_preview_access';
type CaptureMode = 'live' | 'preview';

interface PackContext {
  source: string;
  landingPage: string;
  visitorUuid?: string | null;
  attribution?: { first: Record<string, unknown>; last: Record<string, unknown> };
}

function validateEmail(email: string) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  return normalizedEmail;
}

/** One acknowledged proxy event owns this request; do not also call bento.track. */
export async function captureAuditPackRequest(email: string, context: PackContext, request: typeof fetch = fetch) {
  const normalizedEmail = validateEmail(email);
  const response = await request('/api/bento-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      event: AUDIT_PACK_EVENT,
      source: context.source,
      landingPage: context.landingPage,
      visitorUuid: context.visitorUuid,
      firstTouch: context.attribution?.first,
      lastTouch: context.attribution?.last,
    }),
    signal: AbortSignal.timeout(15000),
    keepalive: true,
  });
  // The existing proxy can return HTTP 200 with ok:false.
  if (!response.ok || (await response.json()).ok !== true) {
    throw new Error('We couldn’t process your request. Please try again.');
  }
}

const states = {
  live: { accessGranted: false, submitting: false },
  preview: { accessGranted: false, submitting: false },
};

function captureMode(container: Element): CaptureMode {
  return import.meta.env.DEV && container.getAttribute('data-audit-pack-preview') === 'true' ? 'preview' : 'live';
}

function accessKey(mode: CaptureMode) {
  return mode === 'preview' ? PREVIEW_ACCESS_KEY : ACCESS_KEY;
}

function rememberedAccess(mode: CaptureMode) {
  try {
    return sessionStorage.getItem(accessKey(mode)) === 'granted';
  } catch {
    return false;
  }
}

function showPackState() {
  document.querySelectorAll<HTMLElement>('[data-audit-pack-capture]').forEach(container => {
    const { accessGranted, submitting } = states[captureMode(container)];
    const form = container.querySelector<HTMLFormElement>('form');
    const downloads = container.querySelector<HTMLElement>('[data-audit-pack-downloads]');
    if (!form || !downloads) return;
    form.hidden = accessGranted;
    downloads.hidden = !accessGranted;
    form.setAttribute('aria-busy', String(submitting));
    form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button').forEach(field => {
      field.disabled = submitting;
    });
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.textContent = submitting ? 'Submitting…' : 'Subscribe & get the audit pack';
    if (accessGranted) {
      form.reset();
      const error = form.querySelector<HTMLElement>('[data-audit-pack-error]');
      if (error) error.textContent = '';
    }
  });
}

function requestContext(): PackContext {
  const helpers = window as Window & {
    getBentoVisitorUuid?: () => string | null;
    ddGetAttribution?: () => PackContext['attribution'];
  };
  const context: PackContext = { source: location.pathname, landingPage: location.href };
  try { context.landingPage = sessionStorage.getItem('dd_landing_page') || location.href; } catch { /* Storage may be unavailable. */ }
  try { context.visitorUuid = helpers.getBentoVisitorUuid?.(); } catch { /* Anonymous request remains valid. */ }
  try { context.attribution = helpers.ddGetAttribution?.(); } catch { /* Attribution must not block the request. */ }
  return context;
}

/** Placements share state within each mode; preview access never unlocks live capture. */
export function initAuditPackForms() {
  states.live.accessGranted ||= rememberedAccess('live');
  if (import.meta.env.DEV) states.preview.accessGranted ||= rememberedAccess('preview');
  showPackState();
  document.querySelectorAll<HTMLFormElement>('[data-audit-pack-capture] form:not([data-audit-pack-bound])').forEach(form => {
    form.dataset.auditPackBound = 'true';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const container = form.closest('[data-audit-pack-capture]');
      if (!container) return;
      const mode = captureMode(container);
      const state = states[mode];
      if (state.submitting || state.accessGranted || !form.reportValidity()) return;
      const email = form.querySelector<HTMLInputElement>('input[name="email"]');
      const error = form.querySelector<HTMLElement>('[data-audit-pack-error]');
      if (!email || !error) return;
      error.textContent = '';
      state.submitting = true;
      showPackState();
      try {
        if (mode === 'preview') {
          // Offline-page UX only: no request, tracking, identity or attribution calls.
          validateEmail(email.value);
        } else {
          await captureAuditPackRequest(email.value, requestContext());
        }
        state.accessGranted = true;
        // Store only access, never the email address or any audit answers.
        try { sessionStorage.setItem(accessKey(mode), 'granted'); } catch { /* Keep access in memory for this page. */ }
      } catch {
        error.textContent = 'We couldn’t process your request. Please try again.';
      } finally {
        state.submitting = false;
        showPackState();
        if (state.accessGranted) {
          form.closest('[data-audit-pack-capture]')?.querySelector<HTMLElement>('[data-audit-pack-ready]')?.focus();
        }
      }
    });
  });
}
