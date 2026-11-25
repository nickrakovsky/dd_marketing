import { DemoError } from './demo-types';

const API = 'https://api.calendly.com';
const segment = '[A-Za-z0-9_-]{8,80}';
export function calendlyReference(value: unknown, kind: 'event' | 'invitee'): string {
  if (typeof value !== 'string' || !value.startsWith(`${API}/`) || !new RegExp(`^/scheduled_events/${segment}${kind === 'invitee' ? `/invitees/${segment}` : ''}$`).test(value.slice(API.length))) {
    throw new DemoError('invalid_booking_reference');
  }
  return value;
}
export interface BookingEvidence {
  email: string; nonce: string; createdAt: number; startAt: number;
  eventStatus: 'active' | 'canceled'; inviteeStatus: 'active' | 'canceled';
  eventType: string; hosts: string[]; activeInvitees: number; inviteeLimit: number;
  rescheduled: boolean; cancellationReason?: string; canceledAt?: number;
}
export interface DemoCalendarProvider {
  inspect(eventUri: string, inviteeUri: string): Promise<BookingEvidence>;
  cancel(eventUri: string, reason: string): Promise<void>;
}
interface CalendlyResource {
  uri: string; event: string; email: string; created_at: string; start_time: string;
  status: 'active' | 'canceled'; event_type: string; event_memberships: { user: string }[];
  invitees_counter: { active: number; limit: number }; tracking: { utm_content: string };
  rescheduled: boolean; new_invitee?: string | null; cancellation?: { reason?: string; created_at?: string };
}
export class CalendarRejected extends Error {}

/** Strict API paths and no redirects: a visitor cannot choose a credential destination. */
export class CalendlyDemoClient implements DemoCalendarProvider {
  constructor(private token: string, private request: typeof fetch = fetch) {}
  private async call(url: string, body?: unknown) {
    const response = await this.request(url, { method: body ? 'POST' : 'GET', redirect: 'error',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(4000) });
    if (!response.ok) {
      if (body && [400, 401, 403, 404, 409, 422, 429].includes(response.status)) throw new CalendarRejected('Cancellation rejected');
      throw new Error('Calendly unavailable');
    }
    if (body) return null;
    const json = await response.json() as { resource?: CalendlyResource };
    if (!json?.resource || typeof json.resource !== 'object') throw new Error('Invalid Calendly response');
    return json.resource;
  }
  async inspect(eventUri: string, inviteeUri: string): Promise<BookingEvidence> {
    calendlyReference(eventUri, 'event'); calendlyReference(inviteeUri, 'invitee');
    if (!inviteeUri.startsWith(`${eventUri}/invitees/`)) throw new DemoError('booking_mismatch');
    const [event, invitee] = await Promise.all([this.call(eventUri), this.call(inviteeUri)]);
    const statuses = ['active', 'canceled'];
    const createdAt = Date.parse(invitee!.created_at), startAt = Date.parse(event!.start_time);
    if (event!.uri !== eventUri || invitee!.event !== eventUri
      || typeof invitee!.email !== 'string' || !Number.isFinite(createdAt) || !Number.isFinite(startAt)
      || !statuses.includes(event!.status) || !statuses.includes(invitee!.status)
      || typeof invitee!.tracking?.utm_content !== 'string'
      || typeof event!.event_type !== 'string' || !Array.isArray(event!.event_memberships)
      || !event!.event_memberships.every((item) => typeof item?.user === 'string')
      || !Number.isInteger(event!.invitees_counter?.active) || !Number.isInteger(event!.invitees_counter?.limit)
      || typeof invitee!.rescheduled !== 'boolean') throw new Error('Incomplete Calendly evidence');
    const cancellation = event!.cancellation || invitee!.cancellation;
    return { email: invitee!.email.trim().toLowerCase(), nonce: invitee!.tracking.utm_content,
      createdAt, startAt, eventStatus: event!.status, inviteeStatus: invitee!.status,
      eventType: event!.event_type, hosts: event!.event_memberships.map((item) => item.user),
      activeInvitees: event!.invitees_counter.active, inviteeLimit: event!.invitees_counter.limit,
      rescheduled: invitee!.rescheduled || !!invitee!.new_invitee,
      cancellationReason: typeof cancellation?.reason === 'string' ? cancellation.reason : undefined,
      canceledAt: Number.isFinite(Date.parse(cancellation?.created_at || '')) ? Date.parse(cancellation!.created_at!) : undefined };
  }
  async cancel(eventUri: string, reason: string) {
    calendlyReference(eventUri, 'event');
    await this.call(`${eventUri}/cancellation`, { reason });
  }
}
