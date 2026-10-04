import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Calendly -> demos booked, total and by channel.
 *
 * Metric: demos_booked
 *   dimension ''          total bookings created that month
 *   dimension <channel>   one row per channel from mapUtmToChannel()
 *
 * Count by the month the booking was CREATED (event.created_at), not the
 * meeting date. That is what lines up with marketing activity.
 *
 * Auth: Personal Access Token (Calendly > Integrations > API & Webhooks).
 *   Authorization: Bearer ${CALENDLY_TOKEN}
 *
 * Steps:
 *   1. GET https://api.calendly.com/users/me -> resource.current_organization
 *   2. GET https://api.calendly.com/scheduled_events
 *        ?organization=<org uri>&min_start_time=<first month start>&count=100&page_token=...
 *      The API filters on meeting start_time, so pull from the first month's
 *      start to ~90 days ahead, then filter created_at into `months`.
 *      Keep only event_type in CALENDLY_DEMO_EVENT_TYPES. Decide with Josh
 *      whether canceled bookings count (status=canceled); default: active only.
 *   3. GET https://api.calendly.com/scheduled_events/<uuid>/invitees
 *      -> collection[0].tracking.{utm_source, utm_medium, utm_campaign}
 *   4. channel = mapUtmToChannel(tracking)
 */
export const calendly: Connector = {
  source: 'calendly',
  requiredSecrets: ['CALENDLY_TOKEN', 'CALENDLY_DEMO_EVENT_TYPES'],
  async sync() {
    throw new NotImplementedError('calendly');
  },
};

type Utm = { utm_source?: string | null; utm_medium?: string | null };

const AI_ASSISTANTS = /chatgpt|openai|perplexity|claude|gemini|copilot/;
const SEARCH_ENGINES = /google|bing|duckduckgo|yahoo|ecosia|brave/;

/**
 * Maps Calendly UTM fields to a dashboard channel key (DEMO_CHANNELS in
 * src/lib/marketing-dashboard/sources.ts).
 *
 * The site passes FIRST-touch attribution into the Calendly popup
 * (buildUtm() in src/layouts/Layout.astro). With no UTMs on the landing URL
 * it sends utm_source=<referrer host>, utm_medium=referral, or 'direct'.
 * So paid clicks are only classed as paid if the ad's URL carries a paid
 * utm_medium (cpc/ppc/paid). Google Ads auto-tagging (gclid) alone is not
 * enough; add utm params via the account's Final URL suffix.
 */
export function mapUtmToChannel(t: Utm | null | undefined): string {
  const source = (t?.utm_source ?? '').toLowerCase();
  const medium = (t?.utm_medium ?? '').toLowerCase();
  const paid = /cpc|ppc|paid|display|social_paid/.test(medium);

  if (paid) {
    if (AI_ASSISTANTS.test(source)) return 'chatgpt_ads';
    if (source.includes('linkedin')) return 'linkedin_ads';
    if (source.includes('bing') || source.includes('microsoft')) return 'microsoft_ads';
    if (source.includes('google')) return 'google_ads';
  }
  if (medium === 'email' || source.includes('bento') || source.includes('newsletter')) return 'email';
  if (source.includes('youtube')) return 'youtube';
  if (AI_ASSISTANTS.test(source)) return 'ai_answers';
  if (SEARCH_ENGINES.test(source) || medium === 'organic') return 'organic_search';
  if (!source || source === 'direct' || medium === 'direct') return 'direct';
  return 'referral';
}
