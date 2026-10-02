import { withPublicationStyles } from './lib/publication-styles';
import { defineMiddleware } from 'astro:middleware';
import { CONTENT_SECURITY_POLICY, BUILD_SCRIPT_POLICY, SCRIPT_POLICY_REPORT_ONLY } from './lib/security-policy.mjs';

export const onRequest = defineMiddleware(async (context, next) => {
  // All availability checks within a response use the same instant.
  context.locals.publicationDate = new Date();
  let response = await next();
  const pathname = context.url.pathname.replace(/\/$/, '') || '/';
  const usesHomePage = pathname === '/' || pathname === '/outbound-dock-management';
  if (usesHomePage || pathname === '/posts' || pathname.startsWith('/posts/')
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
  // Homepage clones share the same layout and build-generated critical styles.
  if (!context.isPrerendered) response = await withPublicationStyles(response, usesHomePage ? '/' : pathname);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Worker JavaScript has an independent CSP execution context. Applying the
  // document policy to Partytown's worker would break its reviewed vendor runner.
  // The CMS is a separate authenticated application, not a marketing document.
  const enforceScripts = BUILD_SCRIPT_POLICY && response.headers.get('Content-Type')?.includes('text/html')
    && !pathname.startsWith('/keystatic');
  response.headers.set('Content-Security-Policy', enforceScripts
    ? `${CONTENT_SECURITY_POLICY.replace("; script-src-attr 'none'", '')}; ${BUILD_SCRIPT_POLICY}` : CONTENT_SECURITY_POLICY);
  if (enforceScripts) response.headers.delete('Content-Security-Policy-Report-Only');
  else response.headers.set('Content-Security-Policy-Report-Only', SCRIPT_POLICY_REPORT_ONLY);
  return response;
});
