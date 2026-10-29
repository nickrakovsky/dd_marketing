// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PATHS, CAMPAIGN_ROBOTS, isCampaignLandingPath, isNoindexAdsUrl, usesCurrentHomepage, KEYWORD_LANDING_PATHS } from './campaign-pages.mjs';

describe('paid campaign indexing boundary', () => {
  it('registers the paid campaigns with explicit search exclusions', () => {
    expect(CAMPAIGN_PATHS).toEqual(expect.arrayContaining([
      '/outbound-dock-management', '/inbound-dock-management',
      '/logistics-scheduling-software', '/warehouse-optimization-software',
    ]));
    expect(CAMPAIGN_ROBOTS.split(', ')).toEqual(expect.arrayContaining([
      'noindex', 'nofollow', 'nosnippet', 'noimageindex',
    ]));
  });

  it.each(CAMPAIGN_PATHS.flatMap(campaign => {
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
    '/posts/logistics-scheduling-software',
    '/logistics-scheduling-software-guide',
    '/logistics-scheduling-software.html-extra',
    '/_astro/logistics-scheduling-software.js',
    '/images/logistics-scheduling-software.webp',
    '/posts/warehouse-optimization-strategies',
    '/posts/warehouse-optimization-software',
    '/warehouse-optimization-software-guide',
    '/warehouse-optimization-software.html-extra',
    '/_astro/warehouse-optimization-software.js',
    '/images/warehouse-optimization-software.webp',
    '/brand-assets/logo-orange.svg',
  ])('does not suppress unrelated pages or shared assets: %s', path => {
    expect(isCampaignLandingPath(path)).toBe(false);
  });

  it('tolerates malformed percent encoding without throwing', () => {
    expect(() => isCampaignLandingPath('/%E0%A4%A')).not.toThrow();
  });
});

describe('all ads destination indexing', () => {
  it.each([...CAMPAIGN_PATHS, ...KEYWORD_LANDING_PATHS])('excludes %s with tracking and aliases', path => {
    for (const suffix of ['', '/', '.html', '?utm_source=google&gclid=test']) {
      expect(isNoindexAdsUrl(new URL(path + suffix, 'https://datadocks.com'))).toBe(true);
    }
  });
  it.each(['?compare=opendock,c3-solutions', '?compare=', '?compare=unknown', '?utm_source=google&compare=c3-solutions'])('excludes comparison ad variant %s', query => {
    expect(isNoindexAdsUrl(new URL('https://datadocks.com/comparison' + query))).toBe(true);
  });
  it.each(['/comparison', '/comparison?utm_source=newsletter', '/', '/yard-management', '/posts/example'])('preserves organic indexing for %s', path => {
    expect(isNoindexAdsUrl(new URL(path, 'https://datadocks.com'))).toBe(false);
  });
  it.each(['/', '/yard-management-software', '/dock-scheduling-software', ...CAMPAIGN_PATHS])('shares homepage critical styles for %s', path => {
    expect(usesCurrentHomepage(path)).toBe(true);
  });
  it.each(['/comparison', '/warehouse-management-software', '/dock-management-software'])('retains own styling for %s', path => {
    expect(usesCurrentHomepage(path)).toBe(false);
  });
});
