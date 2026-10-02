// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SSRManifest } from 'astro';
import { createExports } from './worker';
import { CAMPAIGN_ROBOTS } from './lib/campaign-pages.mjs';

const adapterFetch = vi.hoisted(() => vi.fn());
vi.mock('@astrojs/cloudflare/entrypoints/server.js', () => ({
  createExports: () => ({ default: { fetch: adapterFetch } }),
}));

const worker = createExports({} as SSRManifest).default;
type WorkerArgs = Parameters<typeof worker.fetch>;

function request(path: string, method = 'GET') {
  return worker.fetch(
    new Request(`https://preview.example${path}`, { method }) as unknown as WorkerArgs[0],
    {} as WorkerArgs[1],
    {} as WorkerArgs[2],
  );
}

beforeEach(() => {
  adapterFetch.mockReset();
});

describe('legacy comparison redirects', () => {
  for (const slug of ['comparison', 'datadocks-vs-opendock']) {
    for (const method of ['GET', 'HEAD']) {
      it.each(['', '/', '?utm_source=search&ref=a%2Fb', '/?utm_source=search'])(
        `returns a real 301 before the adapter for ${method} /posts/${slug}%s`, async suffix => {
          const response = await request(`/posts/${slug}${suffix}`, method);
          const search = new URL(`https://preview.example/posts/${slug}${suffix}`).search;
          expect(response.status).toBe(301);
          expect(response.headers.get('Location')).toBe(`https://preview.example/${slug}${search}`);
          expect(await response.text()).toBe('');
          expect(adapterFetch).not.toHaveBeenCalled();
        });
    }
  }

  it.each(['/comparison', '/datadocks-vs-opendock', '/posts/what-is-dock-scheduling', '/posts/comparison-extra', '/posts/comparison/extra'])(
    'leaves %s with the adapter', async path => {
      const expected = new Response('page content');
      adapterFetch.mockResolvedValue(expected);
      expect(await request(path)).toBe(expected);
      expect(adapterFetch).toHaveBeenCalledOnce();
    });

  it('keeps the internal-file safeguard ahead of the adapter', async () => {
    const response = await request('/_worker.js/index.js');
    expect(response.status).toBe(404);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(adapterFetch).not.toHaveBeenCalled();
  });
});

describe('paid campaign response indexing safeguards', () => {
  for (const method of ['GET', 'HEAD']) {
    it.each([200, 301, 404])(
      `adds search exclusions to ${method} responses with status %s`, async status => {
        const headers = new Headers({
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=0, s-maxage=86400',
        });
        if (status === 301) headers.set('Location', '/outbound-dock-management');
        adapterFetch.mockResolvedValue(new Response(method === 'HEAD' ? null : 'campaign response', {
          status,
          headers,
        }));

        const response = await request('/outbound-dock-management', method);
        expect(response.status).toBe(status);
        expect(response.headers.get('X-Robots-Tag')).toBe(CAMPAIGN_ROBOTS);
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=86400');
        expect(response.headers.get('Content-Type')).toBe('text/html');
        expect(response.headers.get('Location')).toBe(status === 301 ? '/outbound-dock-management' : null);
        expect(await response.text()).toBe(method === 'HEAD' ? '' : 'campaign response');
      });
  }

  it.each([
    '/outbound-dock-management/',
    '/outbound-dock-management?utm_source=google&utm_campaign=outbound&gclid=a%2Fb',
    '/OUTBOUND-DOCK-MANAGEMENT',
    '/%6futbound-dock-management',
    '/outbound-dock-management.html',
    '/outbound-dock-management/unknown-child',
  ])('keeps exclusions on accepted aliases and query variants: %s', async path => {
    adapterFetch.mockResolvedValue(new Response('campaign response'));
    const response = await request(path);
    expect(response.headers.get('X-Robots-Tag')).toBe(CAMPAIGN_ROBOTS);
    expect(adapterFetch).toHaveBeenCalledOnce();
  });

  it('preserves the original request and ad tracking parameters for attribution', async () => {
    const path = '/outbound-dock-management/?utm_source=google&gclid=a%2Fb&ref=dispatch%20costs';
    const original = new Request(`https://preview.example${path}`);
    adapterFetch.mockResolvedValue(new Response('campaign response'));
    await worker.fetch(original as unknown as WorkerArgs[0], {} as WorkerArgs[1], {} as WorkerArgs[2]);
    expect(adapterFetch.mock.calls[0][0]).toBe(original);
    expect(adapterFetch.mock.calls[0][0].url).toBe(`https://preview.example${path}`);
  });

  it('protects redirects whose original response headers are immutable', async () => {
    const destination = 'https://preview.example/outbound-dock-management?gclid=a%2Fb';
    adapterFetch.mockResolvedValue(Response.redirect(destination, 301));
    const response = await request('/outbound-dock-management/?gclid=a%2Fb');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(destination);
    expect(response.headers.get('X-Robots-Tag')).toBe(CAMPAIGN_ROBOTS);
  });

  it.each(['/', '/posts', '/outbound-dock-management-guide', '/_astro/shared.js', '/images/hero.webp'])(
    'leaves indexing headers on %s unchanged', async path => {
      const expected = new Response('unrelated response', { headers: { 'X-Robots-Tag': 'index, follow' } });
      adapterFetch.mockResolvedValue(expected);
      const response = await request(path);
      expect(response).toBe(expected);
      expect(response.headers.get('X-Robots-Tag')).toBe('index, follow');
    });
});
