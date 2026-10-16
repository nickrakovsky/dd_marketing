import type { MDXInstance } from 'astro';
import schedule from '../../docs/daily-blog-schedule.json';

const stagedArticles = import.meta.glob<MDXInstance<Record<string, any>>>('../blog-staging/*/*.mdx', { eager: true });
const stagedComponents = import.meta.glob('../blog-staging/*/*.astro', { eager: true, import: 'default' });
const productionArticles = import.meta.glob<MDXInstance<Record<string, any>>>('../../src/content/posts/*.mdx');
const productionComponents = import.meta.glob('../../src/components/blog/*.astro', { eager: true, import: 'default' });
const articleSlug = (file: string) => file.split('/').at(-1)!.replace(/\.mdx$/, '');
const articles = Object.entries(stagedArticles).map(([file, document]) => ({ file, document, production: false }));
const stagedSlugs = new Set(articles.map(({ file }) => articleSlug(file)));
for (const slot of schedule.slots.filter(slot => slot.sourcePath.startsWith('staging/'))) {
  if (stagedSlugs.has(slot.slug)) continue;
  const load = productionArticles['../../' + slot.contentPath];
  if (!load) throw new Error(`Scheduled preview article missing: ${slot.contentPath}`);
  articles.push({ file: slot.sourcePath, document: await load(), production: true });
}
const publicationDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'Etc/GMT+8',
});

// Scheduled articles have one production source; future drafts remain in the queue.
export const posts = articles.map(({ file, document, production }) => {
  const folder = file.slice(0, file.lastIndexOf('/'));
  const slug = articleSlug(file);
  const number = folder.match(/\/post-(\d+)-/)?.[1];
  const pubDate = document.frontmatter.pubDate ? new Date(document.frontmatter.pubDate).toISOString() : undefined;
  return {
    slug,
    label: number ? `Post ${Number(number)}` : 'Overtime',
    order: number ? Number(number) : 1,
    pubDate,
    publicationLabel: pubDate ? `${publicationDate.format(new Date(pubDate))} UTC−08:00` : 'Not yet scheduled',
    document,
    components: Object.fromEntries(Object.entries(production ? productionComponents : stagedComponents)
      .filter(([name]) => production || name.slice(0, name.lastIndexOf('/')) === folder)
      .map(([name, component]) => [name.split('/').at(-1)!.replace(/\.astro$/, ''), component])),
  };
}).sort((a, b) => a.order - b.order);
