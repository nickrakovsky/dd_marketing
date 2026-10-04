import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Bing Webmaster Tools -> organic Bing search.
 *
 * Metrics: clicks, impressions
 *
 * Auth: API key (Bing Webmaster > Settings > API Access > Generate API key).
 *
 * Request:
 *   GET https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats
 *       ?siteUrl=<BING_WMT_SITE_URL>&apikey=<BING_WMT_KEY>
 *   -> { d: [{ Date: '/Date(1717200000000)/', Clicks, Impressions }, ...] }
 *   Daily rows; parse the ms timestamp, roll up with MonthlyAccumulator,
 *   keep only months in `months`.
 *
 * Notes: returns roughly the last 6 months only, so start syncing early.
 */
export const bingWebmaster: Connector = {
  source: 'bing_webmaster',
  requiredSecrets: ['BING_WMT_KEY', 'BING_WMT_SITE_URL'],
  async sync() {
    throw new NotImplementedError('bing_webmaster');
  },
};
