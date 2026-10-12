import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import matter from 'gray-matter';
import { compile } from '@mdx-js/mdx';
import { beforeAll, describe, expect, it } from 'vitest';

// Exercise the browser editor's real parser, not the server reader's raw-text parser.
let roundTrip: (content: string) => string;
beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('@keystatic/core/package.json');
  const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
  const browserEntry = (key: string) => pathToFileURL(resolve(dirname(packagePath), packageInfo.exports[key].default)).href;
  const configPath = resolve(process.cwd(), 'keystatic.config.ts');
  const source = readFileSync(configPath, 'utf8')
    .replace("'@keystatic/core'", JSON.stringify(browserEntry('.')))
    .replace("'@keystatic/core/content-components'", JSON.stringify(browserEntry('./content-components')))
    .replace('import.meta.env.PROD', 'false');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
  const { default: config } = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const field = config.collections.posts.schema.postType.values.article.fields.content;
  roundTrip = content => {
    const slug = 'source-link-proof';
    const state = field.parse(undefined, { content: new TextEncoder().encode(content), other: new Map(), external: new Map(), slug });
    return new TextDecoder().decode(field.serialize(state, { slug }).content);
  };
});

describe('source links in the Keystatic editor', () => {
  it('preserves a standalone title separately from contextual anchor text', () => {
    const source = 'In <SmartLink href="https://www.pymnts.com/news/b2b-payments/2026/the-new-procurement-question-isnt-cost-its-cash/" title="The New Procurement Question Isn’t Cost. It’s Cash." snippet="PYMNTS, June 2026" anchorText="its June 2026 analysis of procurement and cash" /> the publisher discusses payment timing.\n';
    expect(roundTrip(source)).toBe(source);
    expect(roundTrip(roundTrip(source))).toBe(source);
  });

  it('preserves existing glossary links without adding source fields', () => {
    const source = 'Use a <SmartLink id="dock-scheduling" anchorText="scheduled dock" /> for arrivals.\n';
    expect(roundTrip(source)).toBe(source);
  });

  it('allows a source title without a custom description or glossary selection', () => {
    const source = 'Read <SmartLink href="https://example.com/research?a=1&amp;b=2" title="Research &amp; results" anchorText="the study" />.\n';
    const saved = roundTrip(source);
    expect(saved).toContain('title="Research & results"');
    expect(saved).toContain('anchorText="the study"');
    expect(saved).toContain('href="https://example.com/research?a=1&b=2"');
    expect(saved).not.toContain('snippet=');
    expect(saved).not.toContain('id=');
    expect(roundTrip(saved)).toBe(saved);
  });
});

async function componentMetadata(content: string) {
  const components: { name: string; props: Record<string, unknown> }[] = [];
  function visit(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    const node = value as { name?: string; attributes?: { name?: string; value?: unknown }[]; children?: unknown[] };
    if (node.name && (/^[A-Z]/.test(node.name) || node.name === 'lite-youtube')) {
      components.push({
        name: node.name,
        props: Object.fromEntries((node.attributes ?? []).filter(attr => attr.name).map(attr => [attr.name!, attr.value])),
      });
    }
    node.children?.forEach(visit);
  }
  await compile(content, { remarkPlugins: [() => tree => { visit(tree); }] });
  return components;
}

describe('scheduled blog articles in the Keystatic editor', () => {
  it.each([
    ['cut-overtime-with-load-scheduling', 'WarehouseLoadTiming'],
    ['inventory-and-cash', 'Post02InventoryCash'],
    ['speculative-produce-buying', 'ProduceSellingWindow'],
    ['major-customer-demand-spikes', 'Post04OrderAllocation'],
    ['backup-suppliers', 'BackupIngredientPreparation'],
    ['products-and-channels-readiness', 'ExpansionCosts'],
    ['expiry-and-missed-orders', 'Post07Timing'],
    ['frozen-food-network-fit', 'FrozenNetworkTradeoff'],
    ['ingredient-traceability', 'BackwardTraceTimer'],
    ['food-production-runs', 'ProductionRunTradeoff'],
  ])('preserves illustration and citation metadata in %s', async (slug, component) => {
    const { content } = matter(readFileSync(resolve(process.cwd(), `src/content/posts/${slug}.mdx`), 'utf8'));
    const original = await componentMetadata(content);
    const saved = roundTrip(content);
    expect(original.some(item => item.name === component)).toBe(true);
    expect(original.some(item => item.name === 'SmartLink')).toBe(true);
    expect(await componentMetadata(saved)).toEqual(original);
    expect(saved).not.toMatch(/^\s*(?:import|export)\b/m);
    expect(roundTrip(saved)).toBe(saved);
  });
});
