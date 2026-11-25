/** Off until the isolated live-domain verification round is complete. */
export const demoQualificationEnabled = import.meta.env.PUBLIC_DEMO_QUALIFICATION_ENABLED === 'true';

export function demoQualificationActive() {
  return demoQualificationEnabled || (typeof document !== 'undefined' && document.body.dataset.demoQualification === 'true');
}

export function isDemoLeadForm(form: HTMLFormElement) {
  return form.hasAttribute('data-demo-form') || form.hasAttribute('data-demo-capture') || (form.hasAttribute('data-lead-capture')
    && form.dataset.captureKind !== 'resource'
    && ['Demo Subscriber', 'DataDocks Demo Request'].includes(form.dataset.leadEvent || 'Demo Subscriber'));
}

export const facilityBannerPaths = new Set(['/datadocks-features/carrier-portal']);
