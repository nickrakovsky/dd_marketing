import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type NewsKind = CollectionEntry<'news'>['data']['kind'];
export const newsKindLabels: Record<NewsKind, string> = {
  award: 'Awards',
  press: 'In the press',
  interview: 'Interviews',
  company: 'Company news',
  'product-update': 'Product updates',
};

export interface NewsItem {
  slug: string;
  title: string;
  summary: string;
  kind: NewsKind;
  kindLabel: string;
  dateLabel: string;
  datetime?: string;
  year: string;
  sourceName: string;
  sourceUrl: string;
  href: string;
  external: boolean;
  featured: boolean;
  program?: string;
  awardCategory?: string;
}

export function newsDateLabel(date?: string): string {
  if (!date) return 'Date not listed';
  if (date.length === 4) return date;
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function newsEventDate(data: CollectionEntry<'news'>['data']): string | undefined {
  // An original update has a known publication date even without an event date.
  // Historical coverage must retain its original date precision, including unknown.
  return data.eventDate || (data.destination === 'internal' && data.dateContext === 'Published'
    ? data.publishedAt.toISOString().slice(0, 10)
    : undefined);
}

export function toNewsItem(entry: CollectionEntry<'news'>): NewsItem {
  const { data } = entry;
  const eventDate = newsEventDate(data);
  const href = data.destination === 'internal' ? `/news/${entry.slug}` : data.sourceUrl!;
  return {
    slug: entry.slug,
    title: data.title,
    summary: data.summary,
    kind: data.kind,
    kindLabel: newsKindLabels[data.kind],
    dateLabel: data.dateContext === 'Project year' && eventDate ? `${eventDate} project` : newsDateLabel(eventDate),
    datetime: eventDate,
    year: eventDate?.slice(0, 4) || 'undated',
    sourceName: data.sourceName,
    sourceUrl: data.sourceUrl || href,
    href,
    external: data.destination === 'external',
    featured: data.featured,
    program: data.program,
    awardCategory: data.awardCategory,
  };
}

export async function getNewsEntries(): Promise<CollectionEntry<'news'>[]> {
  const now = Date.now();
  const entries = await getCollection('news', ({ data }) =>
    data.status === 'published' && data.publishedAt.valueOf() <= now,
  );
  return entries.sort((a, b) =>
    (newsEventDate(b.data) || '').localeCompare(newsEventDate(a.data) || '') ||
    a.data.title.localeCompare(b.data.title),
  );
}

// Shared by the news hub and future curated modules on /posts and /about.
export async function getNewsItems(): Promise<NewsItem[]> {
  return (await getNewsEntries()).map(toNewsItem);
}
