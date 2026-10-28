// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PATHS, CAMPAIGN_ROBOTS, isCampaignLandingPath } from './campaign-pages.mjs';

describe('paid campaign indexing boundary', () => {
  it('registers both campaigns with explicit search exclusions', () => {
    expect(CAMPAIGN_PATHS).toEqual(expect.arrayContaining([
      '/outbound-dock-management', '/inbound-dock-management',
    ]));
    expect(CAMPAIGN_ROBOTS.split(', ')).toEqual(expect.arrayContaining([
      'noindex', 'nofollow', 'nosnippet', 'noimageindex',
    ]));
  });

  it.each(['/outbound-dock-management', '/inbound-dock-management'].flatMap(campaign => {
    const firstCharacter = campaign.charCodeAt(1).toString(16);
    return [
      campaign, `${campaign}/`, campaign.toUpperCase(),
      `/%${firstCharacter}${campaign.slice(2)}`, `/%25${firstCharacter}${campaign.slice(2)}`,
      `${campaign}.html`, `${campaign}.html/`, `${campaign}/index.html`,
      `${campaign}/unknown-child`, `${campaign}%2Funknown-child`,
    ];
  }))('protects the campaign URL namespace: %s', path => {
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
    '/posts/inbound-dock-management',
    '/inbound-dock-management-guide',
    '/inbound-dock-management.html-extra',
    '/_astro/inbound-dock-management.js',
    '/images/inbound-dock-management.webp',
    '/brand-assets/logo-orange.svg',
  ])('does not suppress unrelated pages or shared assets: %s', path => {
    expect(isCampaignLandingPath(path)).toBe(false);
  });

  it('tolerates malformed percent encoding without throwing', () => {
    expect(() => isCampaignLandingPath('/%E0%A4%A')).not.toThrow();
  });
});
