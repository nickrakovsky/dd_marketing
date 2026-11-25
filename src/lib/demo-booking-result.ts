import type { BookingService, BookingSnapshot } from './demo-booking-service';
import { CALENDLY_BOOKING_URL } from './calendly-config.mjs';

/** Browser completion is useful UI evidence; only the server can authorize cancellation. */
export function showDemoBookingResult(verified: Promise<BookingSnapshot | null>, service?: BookingService, navigate = (url: string) => location.assign(url)) {
  const old = document.querySelector<HTMLDialogElement>('[data-demo-result]');
  old?.close(); old?.remove();
  const dialog = document.createElement('dialog');
  dialog.dataset.demoResult = ''; dialog.className = 'demo-booking-result';
  dialog.setAttribute('aria-labelledby', 'demo-result-title');
  const title = document.createElement('h2'); title.id = 'demo-result-title';
  const copy = document.createElement('p');
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const actions = document.createElement('div'); actions.className = 'demo-result-actions';
  dialog.append(title, copy, status, actions); document.body.append(dialog);
  let redirect: ReturnType<typeof setTimeout> | undefined;
  const stopRedirect = () => { if (redirect) clearTimeout(redirect); redirect = undefined; };
  let snapshot: BookingSnapshot | null = null, busy = false;
  const button = (label: string, run: () => void) => {
    const item = document.createElement('button'); item.type = 'button'; item.textContent = label; item.onclick = run;
    actions.append(item); return item;
  };
  const close = () => { stopRedirect(); dialog.close(); };
  const link = (label: string, href: string) => {
    const item = document.createElement('a'); item.textContent = label; item.href = href; item.onclick = stopRedirect;
    // A rebooking is a fresh qualified flow. Do not let the global legacy-link interceptor bypass it.
    item.dataset.qualifiedBooking = ''; actions.append(item);
  };
  const reset = () => { stopRedirect(); actions.replaceChildren(); status.textContent = ''; };
  function summary() {
    reset(); title.textContent = 'You booked a DataDocks software demo';
    copy.textContent = 'This is a sales meeting to see DataDocks software. It is not a facility appointment or a customer support session.';
    button('Yes, I wanted a software demo', close);
    if (snapshot?.phase === 'verified' && service) {
      button('I meant to book a facility appointment', () => confirm('facility'));
      if (snapshot.supportAvailable) button('I’m an existing customer and need support', () => confirm('support'));
      if (snapshot.startAt) status.textContent = `Your demo: ${new Date(snapshot.startAt).toLocaleString()}`;
    } else if (snapshot?.phase === 'cancelled') cancelled();
    else {
      status.textContent = snapshot?.phase === 'verifying' ? 'Checking your booking details…' : 'To change or cancel this demo, use the links in your Calendly confirmation email.';
      if (snapshot && service && snapshot.phase !== 'review') button('Check booking details', () => refresh());
    }
  }
  function confirm(reason: 'facility' | 'support') {
    reset(); title.textContent = 'Cancel your software demo?';
    copy.textContent = `Confirming removes this software demo from the calendar${reason === 'facility' ? ' and takes you to facility sign-in' : ' and takes you to customer support'}. You may need to choose a new time if you change your mind.`;
    button('Keep my demo', summary);
    button(reason === 'facility' ? 'Cancel demo and go to facility sign-in' : 'Cancel demo and go to support', () => {
      if (busy || !snapshot || !service) return;
      busy = true; for (const b of actions.querySelectorAll('button')) b.disabled = true;
      status.textContent = 'Checking and cancelling this demo…';
      void service.cancel(snapshot.token, reason).then(result => {
        if (!dialog.isConnected) return;
        snapshot = result;
        if (result.phase === 'cancelled') cancelled(); else uncertain();
      }).catch(() => { if (dialog.isConnected) uncertain(); }).finally(() => { busy = false; });
    });
  }
  function cancelled() {
    reset(); title.textContent = 'Your software demo is cancelled';
    copy.textContent = 'That demo time is no longer reserved. If you meant to keep the demo, you can book a new time.';
    if (snapshot?.destination) {
      link('Continue to the right page', snapshot.destination);
      status.textContent = 'Continuing in 5 seconds. You can stay here if you changed your mind.';
      const destination = snapshot.destination;
      redirect = setTimeout(() => { if (dialog.isConnected && dialog.open) navigate(destination); }, 5000);
      button('Stay here', () => { stopRedirect(); status.textContent = 'Automatic redirect stopped.'; });
    }
    link('Book a new software demo', CALENDLY_BOOKING_URL); button('Close', close);
  }
  function uncertain() {
    reset(); title.textContent = 'Check your demo before leaving';
    copy.textContent = 'We haven’t confirmed that this demo was cancelled. Check its status below or use the cancellation link in your Calendly confirmation email.';
    if (snapshot && service) button('Check cancellation status', () => refresh(true));
    button('Close', close);
  }
  async function refresh(cancellation = false) {
    if (busy || !snapshot || !service) return;
    busy = true; status.textContent = 'Checking…';
    try {
      snapshot = await service.status(snapshot.token);
      if (snapshot.phase === 'cancelled') cancelled(); else if (cancellation) uncertain(); else summary();
    } catch { status.textContent = 'We couldn’t check right now. Your Calendly confirmation email has a link to manage this booking.'; }
    finally { busy = false; }
  }
  const previous = document.activeElement;
  summary(); dialog.showModal();
  dialog.addEventListener('close', () => { stopRedirect(); dialog.remove(); if (previous instanceof HTMLElement) previous.focus(); }, { once: true });
  void verified.then(value => { snapshot = value; if (dialog.isConnected) summary(); }).catch(() => { if (dialog.isConnected) summary(); });
  return dialog;
}
