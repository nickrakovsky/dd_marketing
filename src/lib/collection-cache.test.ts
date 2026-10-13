import { describe, expect, it, vi } from 'vitest';
import { createCollectionCache } from './collection-cache';
import { filterPublished } from './content-status';

describe('build content metadata cache', () => {
  it('loads once across concurrent requests and keeps caller arrays independent', async () => {
    const load = vi.fn(async () => [{ id: 'first' }, { id: 'second' }]);
    const getCollection = createCollectionCache(load, true);
    const [first, second] = await Promise.all([getCollection('posts'), getCollection('posts')]);
    first.reverse();
    first.pop();
    expect(second.map(entry => entry.id)).toEqual(['first', 'second']);
    expect((await getCollection('posts')).map(entry => entry.id)).toEqual(['first', 'second']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('rechecks publication against each request cutoff using the same cached metadata', async () => {
    const load = vi.fn(async () => [
      { id: 'scheduled', data: { pubDate: new Date('2026-10-13T14:30:00Z') } },
    ]);
    const getCollection = createCollectionCache(load, true);
    expect(filterPublished(await getCollection('posts'), new Date('2026-10-13T14:29:59Z'))).toEqual([]);
    expect(filterPublished(await getCollection('posts'), new Date('2026-10-13T14:30:00Z'))).toHaveLength(1);
    // A future preview must not poison a subsequent earlier cutoff either.
    expect(filterPublished(await getCollection('posts'), new Date('2026-10-12T14:30:00Z'))).toEqual([]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('bypasses caching in development so editor changes appear immediately', async () => {
    const load = vi.fn().mockResolvedValueOnce([{ id: 'old' }]).mockResolvedValueOnce([{ id: 'edited' }]);
    const getCollection = createCollectionCache(load, false);
    expect(await getCollection('posts')).toEqual([{ id: 'old' }]);
    expect(await getCollection('posts')).toEqual([{ id: 'edited' }]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not retain failed loads or mix collections', async () => {
    const load = vi.fn(async (key: string) => [{ id: key }]);
    load.mockRejectedValueOnce(new Error('load failed'));
    const getCollection = createCollectionCache(load, true);
    await expect(getCollection('posts')).rejects.toThrow('load failed');
    expect(await getCollection('posts')).toEqual([{ id: 'posts' }]);
    expect(await getCollection('videos')).toEqual([{ id: 'videos' }]);
    expect(load).toHaveBeenCalledTimes(3);
  });
});
