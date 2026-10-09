import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertCampaignSources, assertCampaignOutput } from './campaign-isolation.mjs';

const campaigns = ['/outbound-dock-management', '/inbound-dock-management'];
function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-campaign-isolation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [file, contents] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), contents);
  }
  return root;
}

for (const campaign of campaigns) {
  describe(campaign, () => {
    const encodedFirst = `%${campaign.charCodeAt(1).toString(16)}`;
    test('source permits the route, policy, protective headers and tests, not natural keyword prose', t => {
      const root = fixture(t, {
        [`src/pages${campaign}.astro`]: campaign,
        'src/lib/campaign-pages.mjs': campaign,
        'public/_headers': `${campaign}\n  X-Robots-Tag: noindex`,
        'src/lib/example.test.ts': campaign,
        'src/content/posts/example.mdx': `Learn about ${campaign.slice(1).replaceAll('-', ' ')}.`,
        'src/components/Navigation.astro': '<a href="/posts">Resources</a>',
      });
      assert.doesNotThrow(() => assertCampaignSources(root));
    });

    for (const [file, contents] of Object.entries({
      'src/components/Navigation.astro': `<a href="${campaign}">Campaign</a>`,
      'src/data/pages.ts': `const page = '${campaign.split('-')[0]}-' + 'dock-management';`,
      'src/layouts/Layout.astro': `<link rel="canonical" href="https://datadocks.com${campaign}" />`,
      'src/content/posts/example.mdx': `[Learn more](${campaign})`,
      'public/llms.txt': `https://datadocks.com${campaign}`,
      'public/_redirects': `/demo ${campaign} 302`,
      'src/pages/example.astro': `<a href="/${encodedFirst}${campaign.slice(2)}.html">Campaign</a>`,
      'public/linked-image.svg': `<svg><a href="${campaign}">Campaign</a></svg>`,
      'public/sitemap-extra.xml': `<loc>https://datadocks.com/&#${campaign.charCodeAt(1)};${campaign.slice(2)}</loc>`,
    })) {
      test(`source rejects discovery reference in ${file}`, t => {
        assert.throws(() => assertCampaignSources(fixture(t, { [file]: contents })), /\[campaign-isolation\]/);
      });
    }

    for (const [label, html] of Object.entries({
      anchor: `<a href="${campaign}?utm_source=site#book-demo">Campaign</a>`,
      area: `<map><area href="https://www.datadocks.com${campaign}/"></map>`,
      encoded: `<a href="/${encodedFirst.replace('%', '%25')}${campaign.slice(2)}.html">Campaign</a>`,
      uppercase: `<a href="//datadocks.com${campaign.toUpperCase()}/">Campaign</a>`,
      relative: `<a href="${campaign.slice(1)}">Campaign</a>`,
      canonical: `<link rel="canonical" href="${campaign}">`,
      social: `<meta property="og:url" content="https://datadocks.com${campaign}">`,
      redirect: `<meta http-equiv="refresh" content="0;url=${campaign}">`,
      schema: `<script type="application/ld+json">{"@type":"WebPage","url":"https://datadocks.com${campaign}"}</script>`,
      template: `<template><a href="${campaign}">Campaign</a></template>`,
    })) {
      test(`rendered output rejects ${label} inbound references`, t => {
        assert.throws(() => assertCampaignOutput(fixture(t, { 'index.html': html })), /\[campaign-isolation\]/);
      });
    }

    test('runtime homepage samples use the real page URL for relative links', t => {
      const root = fixture(t, {
        '_build/publication/home.html': `<a href="${campaign.slice(1)}">Campaign</a>`,
      });
      assert.throws(() => assertCampaignOutput(root), /_build\/publication\/home\.html/);
    });

    test('future article samples are checked before cleanup', t => {
      const root = fixture(t, {
        '_build/publication/posts/future.html': `<a href="${campaign}">Campaign</a>`,
      });
      assert.throws(() => assertCampaignOutput(root), /future\.html/);
    });

    test('entity-encoded sitemap URLs cannot evade the output check', t => {
      const root = fixture(t, {
        'sitemap-0.xml': `<loc>https://datadocks.com/&#${campaign.charCodeAt(1)};${campaign.slice(2)}</loc>`,
      });
      assert.throws(() => assertCampaignOutput(root), /sitemap-0\.xml/);
    });

    for (const file of ['sitemap-0.xml', 'llms.txt', 'feeds/latest.xml', 'search-index.json', 'site.webmanifest', 'linked-image.svg']) {
      test(`rendered output rejects campaign references in ${file}`, t => {
        assert.throws(() => assertCampaignOutput(fixture(t, {
          [file]: `https://datadocks.com${campaign}?source=discovery`,
        })), /\[campaign-isolation\]/);
      });
    }

    test('campaign self references, ordinary pages and external lookalikes remain valid', t => {
      const root = fixture(t, {
        [`${campaign.slice(1)}.html`]: `<link rel="canonical" href="${campaign}"><a href="#book-demo">Book</a><script type="application/ld+json">{"url":"https://datadocks.com${campaign}"}</script>`,
        'index.html': `<a href="/posts">Resources</a><a href="https://example.com${campaign}">External</a>`,
        'sitemap-0.xml': '<urlset><url><loc>https://datadocks.com/</loc></url></urlset>',
        '_headers': `${campaign}\n  X-Robots-Tag: noindex`,
        '_routes.json': JSON.stringify({ include: [campaign] }),
        '_worker.js/index.js': `const protectedPath = '${campaign}';`,
      });
      assert.doesNotThrow(() => assertCampaignOutput(root));
    });

    test('rejects a campaign link to its sister campaign', t => {
      const sisterCampaign = campaigns.find(candidate => candidate !== campaign);
      const root = fixture(t, {
        [`${campaign.slice(1)}.html`]: `<a href="${sisterCampaign}">Sister campaign</a>`,
      });
      assert.throws(() => assertCampaignOutput(root), /Inbound reference to paid campaign/);
    });
  });
}
