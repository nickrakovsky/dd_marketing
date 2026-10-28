/** Attach each guide form once, including forms inserted by Astro navigation. */
export function attachLogisticsInterviewGuides() {
  const forms = /** @type {NodeListOf<HTMLFormElement>} */ (
    document.querySelectorAll('.lead-magnet-form:not([data-bound])')
  );
  forms.forEach(form => {
    form.dataset.bound = 'true';
    form.addEventListener('submit', event => {
      event.preventDefault();
      const emailInput = /** @type {HTMLInputElement | null} */ (
        form.querySelector('input[name="email"]')
      );
      const email = emailInput?.value ?? '';
      const eventName = form.getAttribute('data-event');
      const redirectUrl = form.getAttribute('data-redirect');
      const helpers = /** @type {Window & {getBentoVisitorUuid?: () => string | null}} */ (window);

      if (email) {
        if (typeof window.bento?.identify === 'function') {
          window.bento.identify(email);
          window.bento.track?.(eventName, { source: window.location.pathname });
        }
        fetch('/api/bento-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            event: eventName,
            source: window.location.pathname,
            landingPage: sessionStorage.getItem('dd_landing_page') || window.location.href,
            visitorUuid: helpers.getBentoVisitorUuid?.() ?? null,
          }),
          keepalive: true,
        }).catch(() => {});
      }

      form.reset();
      const container = form.closest('.lead-magnet-container');
      if (container) {
        form.classList.replace('block', 'hidden');
        const disclaimer = container.querySelector('.disclaimer-message');
        disclaimer?.classList.remove('block');
        disclaimer?.classList.add('hidden');
        const success = container.querySelector('.success-message');
        success?.classList.remove('hidden');
        success?.classList.add('block');
      }
      if (redirectUrl) window.open(redirectUrl, '_blank', 'noopener');
    });
  });
}

attachLogisticsInterviewGuides();
document.addEventListener('astro:page-load', attachLogisticsInterviewGuides);
