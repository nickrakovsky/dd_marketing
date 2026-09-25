import { withPublicationStyles } from './lib/publication-styles';
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // All availability checks within a response use the same instant.
  context.locals.publicationDate = new Date();
  let response = await next();
  const pathname = context.url.pathname.replace(/\/$/, '') || '/';
  if (pathname === '/' || pathname === '/posts' || pathname.startsWith('/posts/')
    || pathname.startsWith('/videos/') || pathname === '/sitemap-posts.xml') {
    // A publication cutoff must never be served stale for long, but a full
    // no-store defeats edge caching entirely (see the dd_marketing memory on
    // this). A short TTL bounds the staleness window to ~60s while still
    // letting the edge (and the Cache Rule, once it stops excluding these
    // paths) serve real traffic from cache instead of hitting the Worker
    // on every request.
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
    response.headers.set('CDN-Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    if (response.status === 404) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  if (!context.isPrerendered) response = await withPublicationStyles(response, pathname);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
});
