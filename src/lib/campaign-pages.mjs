// Paid-only destinations must never enter organic discovery or internal links.
export const CAMPAIGN_PATHS = [
  '/outbound-dock-management',
  '/inbound-dock-management',
  '/logistics-scheduling-software',
  '/warehouse-optimization-software',
];
export const CAMPAIGN_ROBOTS = 'noindex, nofollow, nosnippet, noimageindex';

function normalizePath(pathname) {
  let normalized = pathname.split(/[?#]/, 1)[0];
  try {
    for (let i = 0; i < 4; i++) {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
    }
  } catch { /* A malformed alias can still match the protected prefix below. */ }
  normalized = normalized.replaceAll('\\', '/').replace(/\/+/g, '/').toLowerCase();
  normalized = normalized.replace(/\.html(?=\/|$)/g, '').replace(/\/$/, '');
  return normalized;
}

export function isCampaignLandingPath(pathname) {
  const normalized = normalizePath(pathname);
  return CAMPAIGN_PATHS.some(path => normalized === path || normalized.startsWith(path + '/'));
}

// Existing keyword pages may have organic references, unlike isolated campaigns.
// Keep their indexing policy separate from the strict discovery-isolation list.
export const KEYWORD_LANDING_PATHS = [
  '/yard-management-software', '/dock-scheduling-software',
  '/warehouse-management-software', '/dock-management-software', '/outgrowing-opendock',
];

export function usesCurrentHomepage(pathname) {
  const normalized = normalizePath(pathname);
  return normalized === '' || isCampaignLandingPath(normalized)
    || normalized === '/yard-management-software' || normalized === '/dock-scheduling-software';
}

export function isNoindexAdsUrl(url) {
  const normalized = normalizePath(url.pathname);
  return isCampaignLandingPath(normalized) || KEYWORD_LANDING_PATHS.includes(normalized)
    || (normalized === '/comparison' && url.searchParams.has('compare'));
}
