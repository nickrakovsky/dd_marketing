/** Flat, event-scoped profile projections; the full evidence remains on the event. */
export const BENTO_ACTION_KINDS = {
  'Demo Subscriber': 'demo_request',
  'DataDocks Demo Request': 'demo_request',
  'YMS Shortlist Request': 'shortlist_request',
  demo_profile_viewed: 'scheduler_progress',
  demo_event_type_viewed: 'scheduler_progress',
  demo_date_selected: 'scheduler_progress',
  demo_booked: 'demo_booking',
  $subscribeLCCP: 'resource_request',
  $subscribescorecards: 'resource_request',
} as const;

export type BentoWebsiteEvent = keyof typeof BENTO_ACTION_KINDS;

interface ValidatedEvidence {
  email: string;
  event: BentoWebsiteEvent;
  source?: string;
  ctaId?: string;
  channel?: string;
  occurredAt?: string;
  receivedAt: string;
  metadata: Record<string, unknown>;
}

// Explicit missing values avoid mixing a new snapshot with old optional fields.
// No reliance on undocumented null/empty-field clearing behavior in Bento.
const UNKNOWN = 'unknown';
const REQUIREMENT_FIELDS = {
  appointmentsPerWeek: 'appointments_per_week',
  dockDoors: 'dock_doors',
  yardOperations: 'yard_operations',
  schedulingExpectations: 'scheduling_expectations',
  wms: 'wms',
  tms: 'tms',
  erp: 'erp',
} as const;

/** Called only after buildBentoEvent has validated input, never with raw fields. */
export function buildProfileFields(input: ValidatedEvidence): Record<string, string> {
  const kind = BENTO_ACTION_KINDS[input.event];
  const domain = input.email.slice(input.email.lastIndexOf('@') + 1).toLowerCase();
  const fields: Record<string, string> = {
    dd_email_domain: domain,
    // This is the user's exact analysis cohort, not a business-email assertion.
    dd_email_provider_group: ['gmail.com', 'yahoo.com', 'icloud.com'].includes(domain)
      ? 'gmail_yahoo_icloud' : 'other',
  };

  if (kind !== 'scheduler_progress') {
    const prefix = `dd_${kind}`;
    Object.assign(fields, {
      [`${prefix}_page`]: input.source ?? UNKNOWN,
      [`${prefix}_cta`]: input.ctaId ?? UNKNOWN,
      [`${prefix}_channel`]: input.channel ?? UNKNOWN,
      [`${prefix}_received_at`]: input.receivedAt,
      [`${prefix}_occurred_at`]: input.occurredAt ?? UNKNOWN,
    });
    if (kind === 'resource_request') {
      fields.dd_resource_request_name = input.event === '$subscribeLCCP'
        ? 'logistics_coordinator_career_path' : 'carrier_scorecards';
    }
    if (kind === 'demo_booking') fields.dd_demo_booking_evidence = 'website_reported';
  }

  // Tool context is an expressed interest/selection, not installed software.
  // Only explicit demo/shortlist submissions may project their supplied answers.
  if (kind === 'demo_request' || kind === 'shortlist_request') {
    const metadata = input.metadata;
    if (['selectedSystem', 'subCategory', 'integrationEcosystem'].some(key => typeof metadata[key] === 'string')) {
      for (const [key, field] of [
        ['selectedSystem', 'dd_tool_selected_system'],
        ['subCategory', 'dd_tool_subcategory'],
        ['integrationEcosystem', 'dd_tool_integration_ecosystem'],
      ]) fields[field] = typeof metadata[key] === 'string' ? metadata[key] as string : UNKNOWN;
      fields.dd_tool_context_received_at = input.receivedAt;
    }
    if (metadata.requirements !== undefined) {
      const answers = metadata.requirements as Record<string, unknown>;
      for (const [key, field] of Object.entries(REQUIREMENT_FIELDS)) {
        fields[`dd_declared_${field}`] = typeof answers[key] === 'string' ? answers[key] as string : UNKNOWN;
      }
      fields.dd_requirements_received_at = input.receivedAt;
      fields.dd_requirements_page = input.source ?? UNKNOWN;
    }
  }
  return fields;
}
