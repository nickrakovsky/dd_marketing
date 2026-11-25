// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildBentoEvent } from './bento-track-payload';

const receivedAt = new Date('2026-09-23T14:00:00Z');
const lead = { email: 'operator@example.com', event: 'Demo Subscriber' };
const project = (body: Record<string, unknown>, when = receivedAt) => {
  const result = buildBentoEvent({ ...lead, ...body }, when);
  return result.fields as Record<string, string>;
};

describe('segmentable profile projections', () => {
  it('keeps request and booking pages intact after later resource downloads and scheduler views', () => {
    const profile = {
      ...project({ source: '/benefits/see-everything', ctaId: 'benefit-hero' }),
      ...project({ event: 'demo_booked', source: '/benefits/see-everything' }),
      ...project({ event: '$subscribeLCCP', source: '/posts/logistics-coordinator-career-path' }),
      ...project({ event: 'demo_event_type_viewed', source: '/' }),
    };
    expect(profile).toMatchObject({
      dd_demo_request_page: '/benefits/see-everything',
      dd_demo_booking_page: '/benefits/see-everything',
      dd_demo_request_cta: 'benefit-hero',
      dd_resource_request_page: '/posts/logistics-coordinator-career-path',
      dd_resource_request_name: 'logistics_coordinator_career_path',
      dd_demo_booking_evidence: 'website_reported',
    });
    // Legacy compatibility field still changes; use the scoped summaries instead.
    expect(profile.source).toBe('/');
  });

  it('keeps micro-app demo intent aligned with other demos without relabelling its event or emitting tags', () => {
    const event = buildBentoEvent({ ...lead, event: 'DataDocks Demo Request', source: '/posts/best-yard-management-options' }, receivedAt);
    expect(event.type).toBe('DataDocks Demo Request');
    expect(event.details).toMatchObject({ action_kind: 'demo_request', profile_schema_version: 1 });
    expect(event.fields).toMatchObject({ dd_demo_request_page: '/posts/best-yard-management-options' });
    expect(event).not.toHaveProperty('tags');
    expect(event).not.toHaveProperty('unsubscribed_at');
  });

  it('does not turn shortlist requests into demo requests or bookings', () => {
    const fields = project({ event: 'YMS Shortlist Request', source: '/posts/best-yard-management-options' });
    expect(fields.dd_shortlist_request_page).toBe('/posts/best-yard-management-options');
    expect(Object.keys(fields).some(key => key.startsWith('dd_demo_'))).toBe(false);
  });

  it('replaces missing context with unknown on a later same-kind snapshot instead of retaining another submission’s page', () => {
    const profile = { ...project({ source: '/', ctaId: 'homepage-hero', currentTouch: { utm_medium: 'cpc' } }), ...project({}) };
    expect(profile).toMatchObject({ dd_demo_request_page: 'unknown', dd_demo_request_cta: 'unknown', dd_demo_request_channel: 'unknown' });
  });

  it('makes event time and server receipt distinct, without manufacturing an occurrence time', () => {
    const fields = project({ occurredAt: '2026-06-12T09:00:00Z' });
    expect(fields.dd_demo_request_occurred_at).toBe('2026-06-12T09:00:00Z');
    expect(fields.dd_demo_request_received_at).toBe(receivedAt.toISOString());
    expect(project({}).dd_demo_request_occurred_at).toBe('unknown');
    expect(Object.keys(fields).some(key => key.startsWith('first_') || key.startsWith('last_'))).toBe(false);
  });

  it('keeps each requirements projection as one explicit snapshot, excluding defaults and stale previous answers', () => {
    const oldFields = project({ source: '/', metadata: { requirements: { wms: 'sap', dockDoors: '50+' } } });
    const current = project({ source: '/comparison', metadata: { requirements: { wms: 'none', appointmentsPerWeek: '250-500', painPoints: ['scheduling'] } } });
    const profile = { ...oldFields, ...current };
    expect(profile).toMatchObject({
      dd_declared_wms: 'none', dd_declared_dock_doors: 'unknown', dd_declared_tms: 'unknown',
      dd_declared_appointments_per_week: '250-500', dd_requirements_page: '/comparison',
      dd_requirements_received_at: receivedAt.toISOString(),
    });
    expect(Object.values(current).every(value => typeof value === 'string')).toBe(true);
    // More complex answers remain available as event metadata, not inferred personas.
    expect(current).not.toHaveProperty('dd_persona');
    expect(project({})).not.toHaveProperty('dd_declared_wms');
  });

  it('clears the projected requirements snapshot to unknown when an explicitly empty snapshot is submitted', () => {
    expect(project({ metadata: { requirements: {} } })).toMatchObject({ dd_declared_wms: 'unknown', dd_declared_erp: 'unknown' });
  });

  it('labels selector context as tool interest and never installed software', () => {
    const fields = project({ metadata: { selectedSystem: 'DataDocks', subCategory: 'Retail' } });
    expect(fields).toMatchObject({ dd_tool_selected_system: 'DataDocks', dd_tool_subcategory: 'Retail', dd_tool_integration_ecosystem: 'unknown' });
    expect(fields).not.toHaveProperty('dd_declared_wms');
  });

  it.each(['demo_booked', 'demo_date_selected', '$subscribeLCCP'])('does not let %s overwrite declared requirements or tool context', event => {
    const fields = project({ event, metadata: { selectedSystem: 'DataDocks', requirements: { wms: 'none' } } });
    expect(Object.keys(fields).some(key => key.startsWith('dd_declared_') || key.startsWith('dd_tool_'))).toBe(false);
  });

  it.each([
    ['person@GMAIL.COM', 'gmail.com', 'gmail_yahoo_icloud'],
    ['person@yahoo.com', 'yahoo.com', 'gmail_yahoo_icloud'],
    ['person@icloud.com', 'icloud.com', 'gmail_yahoo_icloud'],
    ['person@outlook.com', 'outlook.com', 'other'],
    ['person@gmail.com.example.com', 'gmail.com.example.com', 'other'],
  ])('classifies %s only for the exact analysis cohort, without blocking or asserting company identity', (email, domain, group) => {
    expect(project({ email })).toMatchObject({ dd_email_domain: domain, dd_email_provider_group: group });
  });
});
