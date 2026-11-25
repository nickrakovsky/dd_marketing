import { captureContext } from './lead-context';
import { createDemoCaptureFlow } from './demo-qualification';
import { createHttpDemoLeadService } from './demo-lead-service';
import { mountDemoCapture } from './demo-capture-ui';
import { createDemoCalendar } from './demo-calendar';
import { createBookingService } from './demo-booking-service';

/** Install once. No API calls or Calendly assets until a visitor submits. */
export function installDemoSite() {
  const booking = createBookingService();
  const service = createHttpDemoLeadService(fetch, booking.startSession);
  const calendar = createDemoCalendar(booking.service);
  return mountDemoCapture(document.body, form => {
    const context = captureContext(form.dataset.ctaId || form.id || 'demo-inline', form.dataset.ctaPlacement || 'inline');
    try { if (form.dataset.leadMetadata) context.metadata = JSON.parse(form.dataset.leadMetadata); } catch { /* Optional metadata. */ }
    return createDemoCaptureFlow(service, { ...context,
      leadEvent: form.dataset.leadEvent === 'DataDocks Demo Request' ? 'DataDocks Demo Request' : 'Demo Subscriber',
    });
  }, (email, flow, form) => { void calendar(email, flow, form); });
}
