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
    // this). Most posts are low-traffic long-tail content — even a 10 min
    // window rarely produces a hit for them, since visits are spread too far
    // apart. A day-long TTL gets near-total cache coverage instead. This is
    // an interim bound: a Worker Cron Trigger is meant to actively purge the
    // specific post/hub/home URLs the instant a publication cutoff passes,
    // so in practice staleness should be seconds, not a day — this TTL is
    // the fallback ceiling if that purge job is ever late or fails, not the
    // primary correctness mechanism. Do not raise it further without also
    // confirming the purge job is deployed and working.
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400');
    response.headers.set('CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
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
