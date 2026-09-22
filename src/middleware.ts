import { withPublicationStyles } from './lib/publication-styles';
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // All availability checks within a response use the same instant.
  context.locals.publicationDate = new Date();
  let response = await next();
  const pathname = context.url.pathname.replace(/\/$/, '') || '/';
  if (pathname === '/' || pathname === '/posts' || pathname.startsWith('/posts/')
    || pathname.startsWith('/videos/') || pathname === '/sitemap-posts.xml') {
    // Neither a cached listing nor a cached 404 may survive a publication cutoff.
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
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
