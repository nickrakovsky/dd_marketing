import type { LeadContext } from './home-demo-capture';
type MarketingWindow = Window & { ddGetAttribution?: () => { first?: Record<string, unknown>; last?: Record<string, unknown> }; getBentoVisitorUuid?: () => string | null };

function optional<T>(read: () => T): T | undefined {
  try { return read(); } catch { return undefined; }
}

function safeTouch(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'msclkid', 'referrer', 'ts']) {
    if (typeof input[key] === 'string' && input[key].length <= 2048 && input[key].trim()) result[key] = input[key];
  }
  if (typeof input.landing === 'string' && input.landing.startsWith('/')
    && !input.landing.startsWith('//') && !input.landing.includes('\\') && input.landing.length <= 8192) result.landing = input.landing;
  return result;
}

function storedTouch(key: string) {
  return safeTouch(optional(() => JSON.parse(localStorage.getItem(key) || '{}')));
}

function newId() {
  return optional(() => crypto.randomUUID()) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function pageCategory(path: string) {
  if (path === '/') return 'homepage';
  if (path.startsWith('/posts')) return 'article';
  if (path.startsWith('/news')) return 'news';
  if (path.startsWith('/benefits/')) return 'benefit';
  if (path.startsWith('/datadocks-features/')) return 'feature';
  if (path.startsWith('/integrations/')) return 'integration';
  if (path.includes('opendock') || path === '/comparison') return 'comparison';
  return 'other';
}

/** Read current evidence directly; storage and third-party helpers are optional. */
export function captureContext(ctaId: string, ctaPlacement: string): LeadContext {
  const marketing = window as MarketingWindow;
  const currentTouch: Record<string, string> = { landing: window.location.pathname, ts: new Date().toISOString() };
  const params = new URLSearchParams(window.location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'msclkid']) {
    const value = params.get(key);
    if (value) currentTouch[key] = value;
  }
  const referrer = optional(() => document.referrer ? new URL(document.referrer).hostname : '');
  if (referrer) currentTouch.referrer = referrer;
  const attribution = optional(() => marketing.ddGetAttribution?.());
  const sessionLandingPage = optional(() => {
    const stored = sessionStorage.getItem('dd_landing_page');
    if (!stored || stored.length > 8192) return undefined;
    const url = new URL(stored);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  });
  const pageMode = document.documentElement.dataset.demoAttribution === 'page';
  const visitorUuid = optional(() => marketing.getBentoVisitorUuid?.());
  return {
    source: window.location.pathname,
    landingPage: pageMode ? window.location.href : sessionLandingPage,
    ...(pageMode ? { landingPageMode: 'page' as const, sessionLandingPage } : {}), // Keep original session history separate from a campaign conversion.
    visitorUuid: typeof visitorUuid === 'string' && visitorUuid.length <= 2048 ? visitorUuid : undefined,
    attribution: { first: safeTouch(attribution?.first ?? storedTouch('dd_first_touch')), last: safeTouch(attribution?.last ?? storedTouch('dd_last_touch')) },
    currentTouch,
    ctaId,
    ctaPlacement,
    pageCategory: pageCategory(window.location.pathname),
    eventId: newId(),
    attemptId: newId(),
    occurredAt: new Date().toISOString(),
  };
}
