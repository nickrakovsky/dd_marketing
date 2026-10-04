import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * ChatGPT Ads (OpenAI Ads API) -> paid AI search.
 * Docs: https://developers.openai.com/ads/reporting
 *
 * Metrics: spend, impressions, clicks, conversions
 *
 * Auth: account-scoped Advertiser API key.
 *   Authorization: Bearer <OPENAI_ADS_API_KEY>
 *
 * Request:
 *   GET https://api.ads.openai.com/v1/ad_account/insights?time_granularity=daily&...
 *   There is no monthly granularity: pull daily and roll up with
 *   MonthlyAccumulator. Confirm the date-range parameter names in the docs.
 *
 * Notes: only the most recent 365 days are available, so backfill as soon
 * as the key exists.
 */
export const chatgptAds: Connector = {
  source: 'chatgpt_ads',
  requiredSecrets: ['OPENAI_ADS_API_KEY'],
  async sync() {
    throw new NotImplementedError('chatgpt_ads');
  },
};
