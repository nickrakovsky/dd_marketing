import { describe, expect, it } from 'vitest';
import { renderPostSitemap } from './post-sitemap';

const site = new URL('https://datadocks.com');
const publication = new Date('2026-09-22T06:30:00-08:00');
const posts = [
  { slug: 'published', data: { pubDate: new Date('2026-09-17T14:30:00Z') } },
  { slug: 'scheduled', data: { pubDate: publication } },
  { slug: 'invalid', data: { pubDate: 'not-a-date' } },
];

describe('runtime post sitemap', () => {
  it('omits future and invalid URLs, then includes a scheduled URL at its exact deadline', () => {
    const before = renderPostSitemap(posts, site, new Date(publication.getTime() - 1));
    expect(before).toContain('<loc>https://datadocks.com/posts/published</loc>');
    expect(before).not.toContain('/scheduled');
    expect(before).not.toContain('/invalid');

    const due = renderPostSitemap(posts, site, publication);
    expect(due).toContain('<loc>https://datadocks.com/posts/scheduled</loc>');
    expect(due).toContain('<lastmod>2026-09-22T14:30:00.000Z</lastmod>');
    expect(due).not.toContain('/invalid');
  });

  it('uses a valid past update date without inventing future modifications', () => {
    const candidates = [
      { slug: 'updated', data: { pubDate: '2026-01-01', updatedDate: '2026-02-01' } },
      { slug: 'future-update', data: { pubDate: '2026-01-01', updatedDate: '2027-01-01' } },
      { slug: 'invalid-update', data: { pubDate: '2026-01-01', updatedDate: 'invalid' } },
      { slug: 'earlier-update', data: { pubDate: '2026-01-01', updatedDate: '2025-01-01' } },
    ];
    const xml = renderPostSitemap(candidates, site, publication);
    expect(xml).toContain('/updated</loc><lastmod>2026-02-01T00:00:00.000Z</lastmod>');
    for (const slug of ['future-update', 'invalid-update', 'earlier-update']) {
      expect(xml).toContain(`/${slug}</loc><lastmod>2026-01-01T00:00:00.000Z</lastmod>`);
    }
  });

  it('escapes XML and never includes a second host supplied by a slug', () => {
    const xml = renderPostSitemap([
      { slug: 'a&b', data: { pubDate: '2026-01-01' } },
      { slug: '//other.example', data: { pubDate: '2026-01-01' } },
    ], site, publication);
    expect(xml).toContain('<loc>https://datadocks.com/posts/a&amp;b</loc>');
    expect(xml).toContain('<loc>https://datadocks.com/posts///other.example</loc>');
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
  });

  it('returns an empty valid sitemap when no posts are due or the cutoff is invalid', () => {
    for (const asOf of [new Date('2020-01-01'), new Date('invalid')]) {
      const xml = renderPostSitemap(posts, site, asOf);
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
      expect(xml).not.toContain('<url>');
    }
  });
});
