import { isPublished } from './content-status';

// The curated evergreen resources used by the posts hub and homepage highlight.
export const EVERGREEN_RESOURCE_SLUGS: ReadonlySet<string> = new Set([
  'best-yard-management-options',
  'comparison',
  'warehouse-audit-checklist',
  'yard-management-process-flow',
  'warehouse-management-career',
  'datadocks-vs-opendock',
  'carrier-portal',
  'notifications',
  'truck-detention-accessorial-fees',
  'retail-case-studies',
  'what-is-dock-scheduling',
  'warehouse-receiving-process',
  'what-is-a-supply-chain-center-of-excellence',
]);

interface EvergreenPost {
  slug: string;
  data: {
    pubDate: Date;
    updatedDate?: Date;
    priority?: string;
    cardImage?: unknown;
    postType: { discriminant: string };
  };
}

export function getFeaturedEvergreenPost<T extends EvergreenPost>(
  posts: readonly T[],
  asOf: Date = new Date(),
): T | undefined {
  return posts
    .filter(post => EVERGREEN_RESOURCE_SLUGS.has(post.slug)
      && isPublished(post.data.pubDate, asOf)
      && post.data.priority !== 'Hidden'
      && post.data.cardImage
      && post.data.postType.discriminant === 'article')
    .sort((a, b) => (b.data.updatedDate ?? b.data.pubDate).getTime()
      - (a.data.updatedDate ?? a.data.pubDate).getTime()
      || b.data.pubDate.getTime() - a.data.pubDate.getTime()
      || a.slug.localeCompare(b.slug))[0];
}
