import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * LinkedIn Ads -> paid social.
 *
 * Metrics: spend (costInLocalCurrency), impressions, clicks,
 *          conversions (oneClickLeads + externalWebsiteConversions; shown as "Leads")
 *
 * Auth: app with the Advertising API product approved, scope r_ads_reporting.
 *   refreshAccessToken({ tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken', ... LI_* })
 *   Refresh tokens expire after 365 days. Someone must re-authorize yearly;
 *   the dashboard's Connections panel will show this source failing when it lapses.
 *
 * Request:
 *   GET https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=ACCOUNT
 *       &timeGranularity=MONTHLY
 *       &dateRange=(start:(year:2026,month:1,day:1),end:(year:2026,month:9,day:30))
 *       &accounts=List(urn%3Ali%3AsponsoredAccount%3A<LI_AD_ACCOUNT_ID>)
 *       &fields=dateRange,costInLocalCurrency,impressions,clicks,oneClickLeads,externalWebsiteConversions
 *   Headers: Authorization: Bearer <token>
 *            LinkedIn-Version: <YYYYMM, a currently supported version>
 *            X-Restli-Protocol-Version: 2.0.0
 */
export const linkedinAds: Connector = {
  source: 'linkedin_ads',
  requiredSecrets: ['LI_CLIENT_ID', 'LI_CLIENT_SECRET', 'LI_REFRESH_TOKEN', 'LI_AD_ACCOUNT_ID'],
  async sync() {
    throw new NotImplementedError('linkedin_ads');
  },
};
