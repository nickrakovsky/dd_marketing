import { buildBentoEvent } from '../bento-track-payload';
import { needsWorkEmail, normalizeDemoEmail } from '../demo-qualification';
import { CAPTURE_FIELD, PERSONAL_FIELD } from './demo-types';
import type { DemoBento, Lead, Subscriber } from './demo-types';

export interface BentoCredentials { siteUuid: string; publishableKey: string; secretKey: string }
export class BentoRejected extends Error {}

/** All calls are injectable. No SDK, automatic retries, or browser credentials. */
export class BentoDemoClient implements DemoBento {
  constructor(private credentials: BentoCredentials, private request: typeof fetch = fetch) {}

  private async call(path: string, query: Record<string, string> = {}, body?: unknown): Promise<Record<string, unknown>> {
    const url = new URL(`https://app.bentonow.com/api/v1/${path}`);
    url.search = new URLSearchParams({ site_uuid: this.credentials.siteUuid, ...query }).toString();
    const response = await this.request(url, {
      method: body ? 'POST' : 'GET', redirect: 'error',
      headers: {
        Authorization: `Basic ${btoa(`${this.credentials.publishableKey}:${this.credentials.secretKey}`)}`,
        'Content-Type': 'application/json', 'User-Agent': 'DataDocks-Demo/1.0',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(4000),
    });
    // 404 is ambiguous (contact vs endpoint). Only an explicit null/empty data
    // response counts as a missing subscriber. Do not rename on a guessed miss.
    if (!response.ok) {
      if (body && [400, 401, 403, 422, 429].includes(response.status)) throw new BentoRejected('Bento rejected operation');
      throw new Error('Bento response unavailable');
    }
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Bento response');
    return value as Record<string, unknown>;
  }

  async find(query: { email: string } | { uuid: string }): Promise<Subscriber | null> {
    const response = await this.call('fetch/subscribers', query);
    if (response.data === null || Object.keys(response).length === 0) return null;
    const data = response.data as { attributes?: Record<string, unknown> } | undefined;
    const attrs = data?.attributes;
    if (!attrs || typeof attrs.uuid !== 'string' || typeof attrs.email !== 'string'
      || !attrs.fields || typeof attrs.fields !== 'object' || Array.isArray(attrs.fields)
      || !(attrs.unsubscribed_at === null || typeof attrs.unsubscribed_at === 'string')) {
      throw new Error('Invalid subscriber response');
    }
    const tags = attrs.cached_tag_ids;
    if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string' || typeof tag === 'number')) throw new Error('Missing subscriber tags');
    return { uuid: attrs.uuid, email: normalizeDemoEmail(attrs.email), fields: attrs.fields as Record<string, unknown>,
      unsubscribedAt: attrs.unsubscribed_at as string | null, tags: tags.map(String) };
  }

  async capture(lead: Lead) {
    const event = buildBentoEvent({ ...lead.context, email: lead.email, event: lead.context.leadEvent || 'Demo Subscriber' });
    const fields = event.fields as Record<string, unknown>;
    if (lead.preexisting) {
      // Historical evidence stays in event details; existing profile history stays intact.
      for (const key of Object.keys(fields)) if (key !== 'source' && !key.startsWith('last_') && !key.startsWith('dd_')) delete fields[key];
      delete event.landing_page_url; delete event.visitor_id;
    } else if (needsWorkEmail(lead.email)) fields[PERSONAL_FIELD] = lead.email;
    fields[CAPTURE_FIELD] = lead.id;
    const response = await this.call('batch/events', {}, { events: [event] });
    if (response.results !== 1 || (response.failed !== undefined && response.failed !== 0)) throw new Error('Capture acceptance unconfirmed');
  }

  async captureWork(lead: Lead) {
    if (!lead.workEmail) throw new Error('Missing work identity');
    const event = buildBentoEvent({ ...lead.context, email: lead.workEmail, event: lead.context.leadEvent || 'Demo Subscriber' });
    const fields = event.fields as Record<string, unknown>;
    if (lead.workTarget) {
      for (const key of Object.keys(fields)) if (key !== 'source' && !key.startsWith('last_') && !key.startsWith('dd_')) delete fields[key];
      delete event.landing_page_url; delete event.visitor_id;
    }
    // Preserve an earlier personal address. Every association remains in event history.
    if (!lead.workTarget?.fields[PERSONAL_FIELD]) fields[PERSONAL_FIELD] = lead.email;
    fields[CAPTURE_FIELD] = `${lead.id}:work`;
    event.details = { ...(event.details as object), demo_identity: {
      schema_version: 1, method: 'separate_contacts', submitted_personal_email: lead.email,
      relationship: 'visitor_reported', capture_id: lead.id,
    } };
    const response = await this.call('batch/events', {}, { events: [event] });
    if (response.results !== 1 || (response.failed !== undefined && response.failed !== 0)) throw new Error('Work capture acceptance unconfirmed');
  }

  async changeEmail(oldEmail: string, newEmail: string) {
    const response = await this.call('fetch/commands', {}, {
      command: [{ command: 'change_email', email: oldEmail, query: newEmail }],
    });
    if (response.results !== 1) throw new Error('Rename acceptance unconfirmed');
  }
}
