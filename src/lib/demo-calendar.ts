import { CALENDLY_BOOKING_URL, CALENDLY_BRAND_PARAMS } from './calendly-config.mjs';
import { needsWorkEmail, normalizeDemoEmail } from './demo-qualification';
import type { DemoCaptureFlow } from './demo-qualification';
import { captureLead } from './home-demo-capture';
import type { BookingService, BookingSnapshot } from './demo-booking-service';
import { showDemoBookingResult } from './demo-booking-result';

interface CalendarWindow extends Window {
  Calendly?: { initPopupWidget(options: { url: string; prefill: { email: string }; utm?: { utmContent: string } }): void; closePopupWidget?(): void };
  ddHandleDemoCalendarMessage?: (event: MessageEvent) => void;
  zaraz?: { track(event: string, payload: Record<string, unknown>): void };
}
let assets: Promise<void> | undefined;
function loadAssets(): Promise<void> {
  const browser = window as CalendarWindow;
  if (browser.Calendly?.initPopupWidget) return Promise.resolve();
  if (assets) return assets;
  assets = new Promise<void>((resolve, reject) => {
    if (!document.querySelector('[data-demo-calendar-css]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'https://assets.calendly.com/assets/external/widget.css';
      css.dataset.demoCalendarCss = ''; document.head.append(css);
    }
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js'; script.async = true;
    const timeout = setTimeout(() => finish(false), 10000);
    function finish(ok: boolean) {
      clearTimeout(timeout); script.onload = null; script.onerror = null;
      if (ok) resolve(); else { script.remove(); reject(new Error('Calendar unavailable')); }
    }
    script.onload = () => finish(!!browser.Calendly?.initPopupWidget);
    script.onerror = () => finish(false);
    document.head.append(script);
  }).catch(error => { assets = undefined; throw error; });
  return assets;
}

const stages: Record<string, string> = {
  'calendly.profile_page_viewed': 'demo_profile_viewed',
  'calendly.event_type_viewed': 'demo_event_type_viewed',
  'calendly.date_and_time_selected': 'demo_date_selected',
  'calendly.event_scheduled': 'demo_booked',
};

/** Called only after local qualification; never consults a remembered CRM email. */
export function createDemoCalendar(bookings?: BookingService) {
  let active: { email: string; flow: DemoCaptureFlow; seen: Set<string>; key: string; prepared: Promise<BookingSnapshot | null> } | undefined;
  let opening = false;
  const browser = window as CalendarWindow;
  // Layout remains the only message listener; it delegates while rollout is on.
  browser.ddHandleDemoCalendarMessage = event => {
    if (!active || event.origin !== 'https://calendly.com' || !event.data || typeof event.data !== 'object') return;
    const iframe = [...document.querySelectorAll<HTMLIFrameElement>('.calendly-popup iframe')]
      .find(frame => frame.contentWindow === event.source && new URL(frame.src, location.href).origin === event.origin);
    if (!iframe) return;
    const stage = stages[event.data.event];
    if (!stage || active.seen.has(stage)) return;
    active.seen.add(stage);
    const attempt = active;
    try { browser.zaraz?.track(stage, { event_category: 'demo', funnel_stage: stage }); } catch { /* Optional analytics. */ }
    if (stage === 'demo_booked') {
      const payload = event.data.payload;
      const verified = attempt.prepared.then(prepared => {
        if (!prepared || !bookings || typeof payload?.event?.uri !== 'string' || typeof payload?.invitee?.uri !== 'string') return null;
        return bookings.complete(prepared.token, payload.event.uri, payload.invitee.uri);
      }).catch(() => null);
      browser.Calendly?.closePopupWidget?.();
      showDemoBookingResult(verified, bookings);
      return; // Verified server reporting is the sole completion writer in this rollout.
    }
    // A funnel event must not create a competing work-email contact before rename.
    // Pending/review identities remain internal; stage 4 adds verified booking evidence.
    void attempt.flow.settled().then(result => {
      if (!result || typeof result !== 'object' || !('status' in result) || result.status !== 'ready') return;
      return captureLead(attempt.email, { ...attempt.flow.getContext(),
        eventId: crypto.randomUUID(), occurredAt: new Date().toISOString() }, stage);
    }).catch(() => undefined);
  };
  return async (email: string, flow: DemoCaptureFlow, form: HTMLFormElement) => {
    email = normalizeDemoEmail(email);
    if (needsWorkEmail(email) || opening) return;
    if (active?.flow !== flow || active.seen.has('demo_booked')) {
      const key = crypto.randomUUID();
      active = { email, flow, seen: new Set(), key,
        prepared: bookings ? bookings.prepare(key, email, flow.getContext()).catch(() => null) : Promise.resolve(null) };
    }
    const params = new URLSearchParams(form.dataset.bookingParams || CALENDLY_BRAND_PARAMS);
    params.delete('email');
    params.set('utm_content', `ddbs.${active.key}`);
    const url = `${CALENDLY_BOOKING_URL}?${params}`;
    let fallback = document.querySelector<HTMLElement>('[data-demo-calendar-fallback]');
    if (!fallback) {
      fallback = document.createElement('section'); fallback.dataset.demoCalendarFallback = '';
      fallback.className = 'demo-calendar-fallback'; fallback.tabIndex = -1;
      fallback.setAttribute('aria-label', 'Software demo calendar');
      document.body.append(fallback);
    }
    fallback.hidden = false;
    fallback.replaceChildren();
    const text = document.createElement('p');
    text.textContent = 'Choose a time for your DataDocks software demo. If the calendar doesn’t appear, open it here.';
    const link = document.createElement('a'); link.textContent = 'Open demo calendar';
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.dataset.qualifiedBooking = '';
    // Email stays out of outbound URLs; the external fallback asks for it again.
    fallback.append(text, link);
    fallback.focus({ preventScroll: true });
    opening = true;
    try {
      await loadAssets();
      browser.Calendly!.initPopupWidget({ url, prefill: { email }, utm: { utmContent: `ddbs.${active.key}` } });
      fallback.hidden = true;
    } catch { fallback.focus(); }
    finally { opening = false; }
  };
}
