// Only verified legacy aliases belong here. Never lowercase arbitrary routes:
// assets and external identifiers may legitimately be case-sensitive.
const destinations: Record<string, string> = {
  '/Posts': '/posts',
  '/Datadocks': '/',
  '/posts/comparison': '/comparison',
  '/posts/datadocks-vs-opendock': '/datadocks-vs-opendock',
};

export function legacyRedirectPath(pathname: string): string | undefined {
  const path = pathname.replace(/\/$/, '').replace(/\.html$/, '');
  return Object.hasOwn(destinations, path) ? destinations[path] : undefined;
}
