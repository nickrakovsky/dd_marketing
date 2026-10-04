import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Google Search Console -> organic Google search.
 *
 * Metrics (source 'google_search_console'):
 *   clicks, impressions,
 *   position_weighted = sum(daily position * daily impressions)
 *     (the dashboard divides by impressions for a correct average position)
 * Also writes source 'blog', metric 'organic_clicks' = clicks on /posts/ pages.
 *
 * Auth: service account (no user sign-in needed).
 *   GSC_SERVICE_ACCOUNT_JSON = the downloaded key file contents.
 *   Add the service account email as a Restricted user on the property.
 *   Sign an RS256 JWT with crypto.subtle (import private_key as pkcs8),
 *   exchange at https://oauth2.googleapis.com/token
 *   scope: https://www.googleapis.com/auth/webmasters.readonly
 *
 * Request, once per month:
 *   POST https://www.googleapis.com/webmasters/v3/sites/<urlencoded GSC_SITE_URL>/searchAnalytics/query
 *   { startDate, endDate, dimensions: ['date'], rowLimit: 25000 }
 *   For blog clicks add:
 *   dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/posts/' }] }]
 *
 * Notes: data lags 2 to 3 days; history is 16 months, so backfill early.
 */
export const googleSearchConsole: Connector = {
  source: 'google_search_console',
  requiredSecrets: ['GSC_SERVICE_ACCOUNT_JSON', 'GSC_SITE_URL'],
  async sync() {
    throw new NotImplementedError('google_search_console');
  },
};
