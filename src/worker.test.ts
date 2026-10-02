// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SSRManifest } from 'astro';
import { createExports } from './worker';

const adapterFetch = vi.hoisted(() => vi.fn());
vi.mock('@astrojs/cloudflare/entrypoints/server.js', () => ({
  createExports: () => ({ default: { fetch: adapterFetch } }),
}));

const worker = createExports({} as SSRManifest).default;
type WorkerArgs = Parameters<typeof worker.fetch>;

function request(path: string, method = 'GET') {
  return worker.fetch(
    new Request(`https://preview.example${path}`, { method }) as WorkerArgs[0],
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
