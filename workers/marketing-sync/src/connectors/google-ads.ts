import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Google Ads -> paid search.
 *
 * Metrics: spend (cost_micros / 1e6), impressions, clicks, conversions
 *
 * Auth: developer token (MCC > Tools > API Center, Basic access) + OAuth.
 *   refreshAccessToken({ tokenUrl: 'https://oauth2.googleapis.com/token', ... GADS_* })
 *   Consent scope: https://www.googleapis.com/auth/adwords
 *
 * Request (use the current API version from the Google Ads API docs;
 * versions sunset roughly yearly):
 *   POST https://googleads.googleapis.com/v<N>/customers/<GADS_CUSTOMER_ID>/googleAds:searchStream
 *   Headers: Authorization: Bearer <token>
 *            developer-token: <GADS_DEV_TOKEN>
 *            login-customer-id: <GADS_LOGIN_CUSTOMER_ID>   (MCC id, no dashes)
 *   Body: { query: `
 *     SELECT segments.month, metrics.cost_micros, metrics.impressions,
 *            metrics.clicks, metrics.conversions
 *     FROM customer
 *     WHERE segments.date BETWEEN '<start>' AND '<end>'` }
 *   segments.month comes back as 'YYYY-MM-01'.
 */
export const googleAds: Connector = {
  source: 'google_ads',
  requiredSecrets: [
    'GADS_DEV_TOKEN',
    'GADS_CLIENT_ID',
    'GADS_CLIENT_SECRET',
    'GADS_REFRESH_TOKEN',
    'GADS_CUSTOMER_ID',
    'GADS_LOGIN_CUSTOMER_ID',
  ],
  async sync() {
    throw new NotImplementedError('google_ads');
  },
};
