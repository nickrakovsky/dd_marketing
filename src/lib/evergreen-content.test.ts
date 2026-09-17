import { describe, expect, it } from 'vitest';
import { getFeaturedEvergreenPost } from './evergreen-content';

const asOf = new Date('2026-10-08T00:00:00Z');
const article = (slug: string, pubDate: string, updatedDate?: string) => ({
  slug,
  data: {
    pubDate: new Date(pubDate),
    updatedDate: updatedDate ? new Date(updatedDate) : undefined,
    cardImage: { src: '/test-image.webp' },
    postType: { discriminant: 'article' },
  },
});

describe('homepage evergreen highlight', () => {
  it('keeps newer daily posts out and ranks evergreen articles by update date', () => {
    const mostRecentlyUpdated = article('best-yard-management-options', '2025-05-26', '2026-09-08');
    const newerPublication = article('yard-management-process-flow', '2025-06-18', '2026-02-23');
    const daily = article('temporary-3pl-buys-time', '2026-10-07', '2026-10-07');
    const posts = Object.freeze([daily, newerPublication, mostRecentlyUpdated]);
    expect(getFeaturedEvergreenPost(posts, asOf)).toBe(mostRecentlyUpdated);
    expect(posts).toEqual([daily, newerPublication, mostRecentlyUpdated]);
  });

  it('changes the highlight when another evergreen article is updated', () => {
    const previous = article('best-yard-management-options', '2025-05-26', '2026-09-08');
    const refreshed = article('retail-case-studies', '2024-05-08', '2026-10-01');
    expect(getFeaturedEvergreenPost([previous, refreshed], asOf)).toBe(refreshed);
  });

  it('uses publication date for an evergreen article with no update date', () => {
    const updated = article('best-yard-management-options', '2025-05-26', '2026-09-08');
    const neverUpdated = article('retail-case-studies', '2026-09-09');
    expect(getFeaturedEvergreenPost([updated, neverUpdated], asOf)).toBe(neverUpdated);
  });

  it('excludes scheduled, hidden, imageless and non-article resources', () => {
    const future = article('best-yard-management-options', '2026-10-09');
    const hidden = article('retail-case-studies', '2025-01-01');
    const noImage = article('warehouse-audit-checklist', '2025-01-01');
    const video = article('warehouse-receiving-process', '2025-01-01');
    expect(getFeaturedEvergreenPost([
      future,
      { ...hidden, data: { ...hidden.data, priority: 'Hidden' } },
      { ...noImage, data: { ...noImage.data, cardImage: undefined } },
      { ...video, data: { ...video.data, postType: { discriminant: 'video' } } },
    ], asOf)).toBeUndefined();
  });
});
