import type { DemoLeadContext } from './demo-qualification';

/** Public state contains no Bento UUID, tags, credentials or internal errors. */
export interface DemoLeadSnapshot {
  status: 'pending' | 'captured' | 'ready' | 'review_required';
  operation: 'capture' | 'work-email';
  leadToken: string;
  requestId: string;
  email: string;
  originalPersonalEmail: string;
  context: DemoLeadContext;
}
