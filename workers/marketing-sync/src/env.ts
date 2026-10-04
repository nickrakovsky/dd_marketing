/**
 * Bindings and secrets for the sync Worker.
 * Set each secret with: npx wrangler secret put <NAME>
 * A connector is skipped (not failed) until all of its secrets exist.
 */
export interface Env {
  MARKETING_DB: D1Database;

  /** Bearer token for manual runs: POST /run?months=18 */
  SYNC_TRIGGER_TOKEN?: string;

  // Calendly
  CALENDLY_TOKEN?: string;
  /** Comma-separated event type URIs that count as demos. */
  CALENDLY_DEMO_EVENT_TYPES?: string;

  // Google (Search Console via service account; YouTube + Ads via OAuth)
  GSC_SERVICE_ACCOUNT_JSON?: string;
  GSC_SITE_URL?: string; // e.g. 'sc-domain:datadocks.com'
  YT_CLIENT_ID?: string;
  YT_CLIENT_SECRET?: string;
  YT_REFRESH_TOKEN?: string;
  GADS_DEV_TOKEN?: string;
  GADS_CLIENT_ID?: string;
  GADS_CLIENT_SECRET?: string;
  GADS_REFRESH_TOKEN?: string;
  GADS_CUSTOMER_ID?: string;
  GADS_LOGIN_CUSTOMER_ID?: string;

  // Microsoft
  BING_WMT_KEY?: string;
  BING_WMT_SITE_URL?: string; // e.g. 'https://datadocks.com/'
  MSADS_DEV_TOKEN?: string;
  MSADS_CLIENT_ID?: string;
  MSADS_CLIENT_SECRET?: string;
  MSADS_REFRESH_TOKEN?: string;
  MSADS_ACCOUNT_ID?: string;
  MSADS_CUSTOMER_ID?: string;

  // LinkedIn
  LI_CLIENT_ID?: string;
  LI_CLIENT_SECRET?: string;
  LI_REFRESH_TOKEN?: string;
  LI_AD_ACCOUNT_ID?: string;

  // OpenAI (ChatGPT Ads)
  OPENAI_ADS_API_KEY?: string;

  // Email: Nick's call. Placeholder names; rename to match what he connects.
  BENTO_SITE_UUID?: string;
  BENTO_PUBLISHABLE_KEY?: string;
  BENTO_SECRET_KEY?: string;
}
