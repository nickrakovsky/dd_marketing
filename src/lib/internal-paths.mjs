// These namespaces can never be published, even if added to the manifest.
export const internalPrefixes = [
  '/internal', '/__internal', '/wireframes', '/preview', '/brand-book',
  '/sales-one-pager', '/solid-test', '/_offline_print', '/_build', '/_worker.js',
];

export function isInternalPath(pathname) {
  let normalized = pathname;
  try {
    // Reject encoded aliases too. Limit decoding work for malformed requests.
    for (let i = 0; i < 4; i++) {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
    }
  } catch { return true; }
  normalized = normalized.replaceAll('\\', '/').replace(/\/+/g, '/').toLowerCase();
  normalized = normalized.replace(/\.html(?=\/|$)/g, '').replace(/\/$/, '');
  if (normalized === '/brand-assets' || normalized.startsWith('/brand-assets/')) {
    return normalized !== '/brand-assets/logo-orange.svg';
  }
  return internalPrefixes.some(prefix => normalized === prefix || normalized.startsWith(prefix + '/'));
}
