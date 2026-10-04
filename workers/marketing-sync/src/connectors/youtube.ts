import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * YouTube Analytics -> channel performance.
 *
 * Metrics: views, watch_hours (estimatedMinutesWatched / 60), subscribers_gained
 *
 * Auth: OAuth as the channel owner (service accounts are not supported).
 *   refreshAccessToken({ tokenUrl: 'https://oauth2.googleapis.com/token', ... YT_* })
 *   Consent scope when generating the refresh token:
 *   https://www.googleapis.com/auth/yt-analytics.readonly
 *
 * Request:
 *   GET https://youtubeanalytics.googleapis.com/v2/reports
 *       ?ids=channel==MINE&dimensions=month
 *       &metrics=views,estimatedMinutesWatched,subscribersGained
 *       &startDate=<first day of first month>&endDate=<last day of last month>
 *   dimensions=month requires startDate on the 1st and endDate on a month end.
 */
export const youtube: Connector = {
  source: 'youtube',
  requiredSecrets: ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REFRESH_TOKEN'],
  async sync() {
    throw new NotImplementedError('youtube');
  },
};
