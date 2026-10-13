const LEGACY_HOSTS = new Set(['getdatadocks.com', 'www.getdatadocks.com']);

export function legacyRedirect(request) {
  const url = new URL(request.url);
  const headers = new Headers({
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  if (!LEGACY_HOSTS.has(url.hostname)) return new Response(null, { status: 404, headers });

  const wasSecure = url.protocol === 'https:';
  url.protocol = 'https:';
  url.port = '';
  if (wasSecure) {
    // HSTS must be learned from the legacy HTTPS response itself, even though
    // that response sends the visitor to the new website.
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    url.hostname = 'datadocks.com';
  }
  headers.set('Location', url.href);
  return new Response(null, { status: 301, headers });
}

export default { fetch: legacyRedirect };
