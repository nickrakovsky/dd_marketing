import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Microsoft Advertising (Bing Ads) -> paid search.
 *
 * Metrics: spend, impressions, clicks, conversions
 *
 * Auth: developer token (developers.ads.microsoft.com) + Entra app OAuth.
 *   refreshAccessToken({
 *     tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
 *     scope: 'https://ads.microsoft.com/msads.manage offline_access', ... MSADS_* })
 *   Headers on every call: AuthenticationToken, DeveloperToken, CustomerId, CustomerAccountId
 *
 * Reporting is asynchronous (Reporting API v13, REST):
 *   1. Submit an AccountPerformanceReportRequest
 *      Aggregation: 'Monthly', Format: 'Csv'
 *      Columns: TimePeriod, Spend, Impressions, Clicks, Conversions
 *      Time: CustomDateRangeStart/End covering `months`
 *   2. Poll until Status = 'Success', then download ReportDownloadUrl
 *   3. The download is a ZIP containing one CSV. Workers cannot unzip
 *      natively; add `fflate` (unzipSync) to this Worker.
 * Check the exact REST endpoint paths in the current Microsoft Advertising
 * Reporting docs before implementing.
 */
export const microsoftAds: Connector = {
  source: 'microsoft_ads',
  requiredSecrets: [
    'MSADS_DEV_TOKEN',
    'MSADS_CLIENT_ID',
    'MSADS_CLIENT_SECRET',
    'MSADS_REFRESH_TOKEN',
    'MSADS_ACCOUNT_ID',
    'MSADS_CUSTOMER_ID',
  ],
  async sync() {
    throw new NotImplementedError('microsoft_ads');
  },
};
