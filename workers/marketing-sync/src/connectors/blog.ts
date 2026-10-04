import type { Connector } from '../connector';
import { NotImplementedError } from '../connector';

/**
 * Blog -> posts published per month. Owner: Nick.
 *
 * Metric: posts_published (by pubDate month).
 * organic_clicks for source 'blog' is written by the Search Console connector.
 *
 * Posts live in src/content/posts (pubDate in frontmatter). Pick whichever is
 * simplest: read the published post list wherever the site's publication
 * pipeline stores it, or fetch https://datadocks.com/sitemap-posts.xml and
 * bucket by each entry's date.
 */
export const blog: Connector = {
  source: 'blog',
  requiredSecrets: [],
  async sync() {
    throw new NotImplementedError('blog');
  },
};
