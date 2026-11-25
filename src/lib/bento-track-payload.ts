import { BENTO_ACTION_KINDS, buildProfileFields } from './bento-profile-fields';
import type { BentoWebsiteEvent } from './bento-profile-fields';

/** The public proxy accepts only the events emitted by our website. */
export const BENTO_WEBSITE_EVENTS = new Set(Object.keys(BENTO_ACTION_KINDS));

export class BentoInputError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalRecord(value: unknown, name: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) throw new BentoInputError(`Invalid ${name}`);
  return value;
}

function optionalString(value: unknown, name: string, maxLength = 2048): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new BentoInputError(`Invalid ${name}`);
  }
  return value.trim() || undefined;
}

const CAMPAIGN_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'msclkid',
] as const;

function pagePath(value: unknown, name: string): string | undefined {
  const path = optionalString(value, name, 8192);
  if (!path) return undefined;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new BentoInputError(`Invalid ${name}`);
  }
  // Source is a page path, never a query string containing arbitrary form data.
  return new URL(path, 'https://datadocks.com').pathname;
}

function landingUrl(value: unknown): string | undefined {
  const input = optionalString(value, 'landingPage', 8192);
  if (!input) return undefined;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BentoInputError('Invalid landingPage');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new BentoInputError('Invalid landingPage');
  }
  const allowedParams = new URLSearchParams();
  for (const key of CAMPAIGN_KEYS) {
    const value = optionalString(url.searchParams.get(key), `landingPage.${key}`);
    if (value) allowedParams.set(key, value);
  }
  url.search = allowedParams.toString();
  url.hash = '';
  return url.href;
}

function touch(value: unknown, name: string): Record<string, string> {
  const input = optionalRecord(value, name);
  const result: Record<string, string> = {};
  for (const key of [...CAMPAIGN_KEYS, 'referrer', 'ts']) {
    const field = optionalString(input[key], `${name}.${key}`);
    if (field) result[key] = field;
  }
  const landing = pagePath(input.landing, `${name}.landing`);
  if (landing) result.landing = landing;
  return result;
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => (
    value !== undefined && (!isRecord(value) || Object.keys(value).length > 0)
  )));
}

function requirements(value: unknown): Record<string, unknown> {
  const input = optionalRecord(value, 'metadata.requirements');
  const answers: Record<string, unknown> = {};
  for (const key of [
    'appointmentsPerWeek', 'dockDoors', 'hoursPerDay', 'daysPerWeek', 'yardOperations',
    'schedulingExpectations', 'primaryFreight', 'primaryFreightOtherSpec', 'checkInLocation',
    'wms', 'wmsOther', 'tms', 'tmsOther', 'erp', 'erpOther', 'dedicatedProduct', 'dedicatedProductOther',
  ]) {
    const answer = optionalString(input[key], `requirements.${key}`, 512);
    if (answer !== undefined) answers[key] = answer;
  }
  for (const key of ['currentTools', 'additionalFreight', 'painPoints', 'committee', 'solutionsConsidering']) {
    const answer = input[key];
    if (answer === undefined) continue;
    if (!Array.isArray(answer) || answer.length > 20) throw new BentoInputError(`Invalid requirements.${key}`);
    answers[key] = answer.map(item => {
      const label = optionalString(item, `requirements.${key}`, 128);
      if (!label) throw new BentoInputError(`Invalid requirements.${key}`);
      return label;
    });
  }
  for (const [key, allowedKeys] of [
    ['parentCarrierMix', ['dedicated', 'company', 'customer']],
    ['childCarrierMix', ['asset', 'broker', 'spot']],
    ['dataCapture', ['bol', 'id', 'seal', 'po', 'trailer']],
  ] as const) {
    if (input[key] === undefined) continue;
    const answer = optionalRecord(input[key], `requirements.${key}`);
    const selected: Record<string, string | number> = {};
    for (const name of allowedKeys) {
      const item = answer[name];
      if (item === undefined) continue;
      if (key === 'dataCapture') {
        if (typeof item !== 'string' || !['pre-arrival', 'checkin', 'after-docking'].includes(item)) {
          throw new BentoInputError('Invalid requirements.dataCapture');
        }
      } else if (typeof item !== 'number' || !Number.isFinite(item) || item < 0 || item > 1) {
        throw new BentoInputError(`Invalid requirements.${key}`);
      }
      selected[name] = item as string | number;
    }
    answers[key] = selected;
  }
  return answers;
}

/** A small, explicit heuristic on current-page evidence, not GA4 channel attribution. */
function currentChannel(current: Record<string, string>) {
  if (current.gclid || current.msclkid) return 'paid_traffic';
  const medium = current.utm_medium?.toLowerCase();
  if (medium) {
    if (['cpc', 'ppc', 'paid', 'paidsearch', 'paid-social', 'paid_social', 'display', 'cpm'].includes(medium)) return 'paid_traffic';
    if (medium === 'email') return 'email';
    if (['social', 'social-media', 'social_media'].includes(medium)) return 'social';
    if (medium === 'organic') return 'organic_search';
    if (medium === 'referral') return 'referral';
    return 'campaign';
  }
  if (Object.keys(current).some(key => key.startsWith('utm_'))) return 'campaign';
  const referrer = current.referrer?.toLowerCase();
  if (!referrer) return 'direct_or_unknown';
  if (referrer === 'datadocks.com' || referrer.endsWith('.datadocks.com')) return 'internal';
  if (/(^|\.)google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(referrer)
    || /(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(referrer)) return 'organic_search';
  return 'referral';
}

/** Keep profile compatibility fields, and add an immutable snapshot to each event. */
export function buildBentoEvent(body: unknown, receivedAt = new Date()) {
  if (!isRecord(body)) throw new BentoInputError('Expected a JSON object');
  const email = optionalString(body.email, 'email', 254);
  const event = optionalString(body.event, 'event', 80);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BentoInputError('Invalid email');
  }
  if (!event || !BENTO_WEBSITE_EVENTS.has(event)) {
    throw new BentoInputError('Unsupported event');
  }

  const legacy = optionalRecord(body.attribution, 'attribution');
  // Merge per field. Explicit non-empty values win; absent/empty ones retain legacy data.
  const first = { ...touch(legacy.first, 'attribution.first'), ...touch(body.firstTouch, 'firstTouch') };
  const last = { ...touch(legacy.last, 'attribution.last'), ...touch(body.lastTouch, 'lastTouch') };
  const current = touch(body.currentTouch, 'currentTouch');
  const source = pagePath(body.source, 'source');
  const landingPage = landingUrl(body.landingPage);
  const visitorUuid = optionalString(body.visitorUuid, 'visitorUuid');
  const metadataInput = optionalRecord(body.metadata, 'metadata');
  const metadata: Record<string, unknown> = {};
  for (const key of ['selectedSystem', 'subCategory', 'integrationEcosystem']) {
    const value = optionalString(metadataInput[key], `metadata.${key}`, 512);
    if (value) metadata[key] = value;
  }
  if (metadataInput.requirements !== undefined) metadata.requirements = requirements(metadataInput.requirements);

  const context: Record<string, string> = {};
  for (const [inputKey, outputKey] of [
    ['eventId', 'event_id'], ['attemptId', 'attempt_id'], ['ctaId', 'cta_id'],
    ['ctaPlacement', 'cta_placement'], ['pageCategory', 'page_category'],
  ]) {
    const value = optionalString(body[inputKey], inputKey, 128);
    if (value) context[outputKey] = value;
  }
  const occurredAt = optionalString(body.occurredAt, 'occurredAt', 40);
  if (occurredAt && (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(occurredAt)
    || !Number.isFinite(Date.parse(occurredAt))
  )) throw new BentoInputError('Invalid occurredAt');

  const channel = Object.keys(current).length ? currentChannel(current) : undefined;
  const receivedAtIso = receivedAt.toISOString();
  const profileFields = buildProfileFields({
    email, event: event as BentoWebsiteEvent, source, ctaId: context.cta_id,
    channel, occurredAt, receivedAt: receivedAtIso, metadata,
  });

  return compact({
    type: event,
    email,
    date: occurredAt,
    // Retained for old integrations; Bento's public docs do not guarantee their mapping.
    landing_page_url: landingPage,
    visitor_id: visitorUuid,
    fields: compact({
      ...profileFields,
      source,
      utm_source: first.utm_source,
      utm_medium: first.utm_medium,
      utm_campaign: first.utm_campaign,
      utm_term: first.utm_term,
      utm_content: first.utm_content,
      gclid: first.gclid,
      msclkid: first.msclkid,
      referrer: first.referrer,
      first_landing: first.landing,
      last_utm_source: last.utm_source,
      last_utm_medium: last.utm_medium,
      last_utm_campaign: last.utm_campaign,
    }),
    details: compact({
      schema_version: 1,
      profile_schema_version: 1,
      action_kind: BENTO_ACTION_KINDS[event as BentoWebsiteEvent],
      collection_source: 'website_proxy',
      received_at: receivedAtIso,
      occurred_at: occurredAt,
      ...context,
      source,
      session_landing_url: landingPage,
      first_touch: first,
      last_touch: last,
      current_touch: current,
      current_channel: channel,
      channel_rule_version: Object.keys(current).length ? 1 : undefined,
      attribution_availability: body.currentTouch === undefined ? undefined : {
        first_touch: Object.keys(first).length ? 'recorded' : 'unknown',
        last_touch: Object.keys(last).length ? 'recorded' : 'unknown',
        session_landing: landingPage ? 'recorded' : 'unknown',
      },
      metadata,
    }),
  });
}
