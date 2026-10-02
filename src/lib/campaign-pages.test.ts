// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PATHS, CAMPAIGN_ROBOTS, isCampaignLandingPath } from './campaign-pages.mjs';

describe('paid campaign indexing boundary', () => {
  it('registers the outbound campaign with explicit search exclusions', () => {
    expect(CAMPAIGN_PATHS).toContain('/outbound-dock-management');
    expect(CAMPAIGN_ROBOTS.split(', ')).toEqual(expect.arrayContaining([
      'noindex', 'nofollow', 'nosnippet', 'noimageindex',
    ]));
  });

  it.each([
    '/outbound-dock-management',
    '/outbound-dock-management/',
    '/OUTBOUND-DOCK-MANAGEMENT',
    '/%6futbound-dock-management',
    '/%256futbound-dock-management',
    '/outbound-dock-management.html',
    '/outbound-dock-management.html/',
    '/outbound-dock-management/index.html',
    '/outbound-dock-management/unknown-child',
    '/outbound-dock-management%2Funknown-child',
  ])('protects the campaign URL namespace: %s', path => {
    expect(isCampaignLandingPath(path)).toBe(true);
  });

  it.each([
    '/',
    '/posts',
    '/posts/outbound-dock-management',
    '/outbound-dock-management-guide',
    '/outbound-dock-management.html-extra',
    '/_astro/outbound-dock-management.js',
    '/images/outbound-dock-management.webp',
    '/brand-assets/logo-orange.svg',
  ])('does not suppress unrelated pages or shared assets: %s', path => {
    expect(isCampaignLandingPath(path)).toBe(false);
  });

  it('tolerates malformed percent encoding without throwing', () => {
    expect(() => isCampaignLandingPath('/%E0%A4%A')).not.toThrow();
  });
});
