// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../pages/api/bento-track';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each(['/outbound-dock-management', '/inbound-dock-management'])('Bento campaign demo attribution: %s', source => {
  it.each(['Demo Subscriber', 'demo_booked'])(
    'forwards the campaign page for %s while preserving first-touch attribution', async event => {
      const upstream = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      );
      vi.stubGlobal('fetch', upstream);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const campaign = source.slice(1);
      const landingPage = `https://datadocks.com${source}?utm_source=google&utm_medium=cpc&utm_campaign=${campaign}`;
      const firstTouch = {
        utm_source: 'linkedin',
        utm_medium: 'social',
        utm_campaign: 'initial-visit',
        utm_term: 'dock scheduling',
        utm_content: 'first-ad',
        gclid: 'original-click-id',
        referrer: 'linkedin.com',
        landing: '/',
      };
      const lastTouch = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: campaign,
        landing: source,
      };
      const context = {
        request: new Request('https://datadocks.com/api/bento-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'campaign-lead@example.com',
            event,
            source,
            landingPage,
            visitorUuid: 'fixture-visitor',
            firstTouch,
            lastTouch,
          }),
        }),
        locals: {
          runtime: {
            env: {
              PUBLIC_BENTO_SITE_UUID: 'fixture-site',
              BENTO_PUBLISHABLE_KEY: 'fixture-publishable',
              BENTO_SECRET_KEY: 'fixture-secret',
            },
          },
        },
      } as Parameters<typeof POST>[0];

      const response = await POST(context);
      expect(await response.json()).toEqual({ ok: true });
      expect(upstream).toHaveBeenCalledOnce();
      expect(upstream.mock.calls[0][0]).toBe('https://app.bentonow.com/api/v1/batch/events?site_uuid=fixture-site');
      const payload = JSON.parse(String(upstream.mock.calls[0][1]?.body));
      expect(payload.events).toHaveLength(1);
      expect(payload.events[0]).toEqual({
        type: event,
        email: 'campaign-lead@example.com',
        landing_page_url: landingPage,
        visitor_id: 'fixture-visitor',
        fields: {
          source,
          utm_source: firstTouch.utm_source,
          utm_medium: firstTouch.utm_medium,
          utm_campaign: firstTouch.utm_campaign,
          utm_term: firstTouch.utm_term,
          utm_content: firstTouch.utm_content,
          gclid: firstTouch.gclid,
          referrer: firstTouch.referrer,
          first_landing: '/',
          last_utm_source: lastTouch.utm_source,
          last_utm_medium: lastTouch.utm_medium,
          last_utm_campaign: lastTouch.utm_campaign,
        },
      });
    },
  );
});
