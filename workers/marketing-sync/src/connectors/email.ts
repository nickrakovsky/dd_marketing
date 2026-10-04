import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Email -> campaigns sent and engagement. Owner: Nick.
 *
 * Metrics: campaigns, sends, opens, clicks
 *   (raw counts; the dashboard derives open rate and click rate)
 * Bucket each campaign by the month it was sent.
 *
 * Nick's call: platform and credentials are his. The BENTO_* secrets are
 * placeholders; rename them here and in env.ts to whatever he connects.
 */
export const email: Connector = {
  source: 'email',
  requiredSecrets: ['BENTO_SITE_UUID', 'BENTO_PUBLISHABLE_KEY', 'BENTO_SECRET_KEY'],
  async sync() {
    throw new NotImplementedError('email');
  },
};
