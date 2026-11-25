import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderPostSitemap } from '../lib/post-sitemap';

export const prerender = false;

export const GET: APIRoute = async ({ locals, site }) => {
  const asOf = locals.publicationDate ?? new Date();
  const posts = await getCollection('posts');
  const xml = renderPostSitemap(posts, site ?? new URL('https://datadocks.com'), asOf);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
