// Paid-only destinations must never enter organic discovery or internal links.
export const CAMPAIGN_PATHS = ['/outbound-dock-management', '/inbound-dock-management'];
export const CAMPAIGN_ROBOTS = 'noindex, nofollow, nosnippet, noimageindex';

export function isCampaignLandingPath(pathname) {
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
  return CAMPAIGN_PATHS.some(path => normalized === path || normalized.startsWith(path + '/'));
}
