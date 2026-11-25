import { filterPublished } from './content-status';

type SitemapPost = {
  slug: string;
  data: {
    pubDate: Date | string;
    updatedDate?: Date | string;
  };
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[character]!);
}

/** Generate only URLs that are publicly available at this request's cutoff. */
export function renderPostSitemap(
  posts: readonly SitemapPost[],
  site: URL,
  asOf: Date,
): string {
  const urls = filterPublished(posts, asOf).map(post => {
    const url = new URL(`/posts/${post.slug}`, site).href;
    // An invalid or future update must not claim that a page has already changed.
    const dates = [post.data.pubDate, post.data.updatedDate]
      .filter((value): value is Date | string => value != null)
      .map(value => new Date(value).getTime())
      .filter(timestamp => Number.isFinite(timestamp) && timestamp <= asOf.getTime());
    const lastmod = dates.length ? `<lastmod>${new Date(Math.max(...dates)).toISOString()}</lastmod>` : '';
    return `<url><loc>${escapeXml(url)}</loc>${lastmod}</url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
}
