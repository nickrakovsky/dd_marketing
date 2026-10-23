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
  function attributeValue(value: unknown): unknown {
    // Bare attributes and literal expressions are equivalent MDX props. The
    // editor serializes standalone={true} as the bare standalone attribute.
    if (value == null) return true;
    if (typeof value === 'object' && 'type' in value && value.type === 'mdxJsxAttributeValueExpression'
      && 'value' in value && typeof value.value === 'string') {
      return JSON.parse(value.value);
    }
    return value;
  }
  function visit(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    const node = value as { name?: string; attributes?: { name?: string; value?: unknown }[]; children?: unknown[] };
    if (node.name && (/^[A-Z]/.test(node.name) || node.name === 'lite-youtube')) {
      components.push({
        name: node.name,
        props: Object.fromEntries((node.attributes ?? []).filter(attr => attr.name).map(attr => [attr.name!, attributeValue(attr.value)])),
      });
    }
    node.children?.forEach(visit);
  }
  await compile(content, { remarkPlugins: [() => tree => { visit(tree); }] });
  return components;
}

describe('scheduled blog articles in the Keystatic editor', () => {
  it('preserves the missing-stock video, illustration and demo capture on save', async () => {
    const { content } = matter(readFileSync(resolve(process.cwd(), 'src/content/posts/stop-hiding-missing-stock.mdx'), 'utf8'));
    const saved = roundTrip(content);
    const components = await componentMetadata(saved);
    expect(components.map(item => item.name)).toEqual(['lite-youtube', 'WarehouseStockRecord', 'DemoCapture']);
    expect(components[0].props).toMatchObject({ videoid: 'EBz5ZOUYNZY' });
    expect(components[2].props).toEqual({ standalone: true });
    expect(saved).toContain('[See how DataDocks could work at your warehouse](#book-demo)');
    expect(saved).not.toMatch(/^\s*(?:import|export)\b/m);
    expect(roundTrip(saved)).toBe(saved);
  });

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

  it.each([
    { slug: 'get-detention-warnings-in-time-to-act', components: ['lite-youtube', 'DetentionWarningWindow', 'DemoCapture'], videoId: 'zuzG9GArpic', sources: 0 },
    { slug: 'find-where-freight-slows-down', components: ['lite-youtube', 'WarehouseFlowBreakdown', 'DemoCapture'], videoId: 'ZXs0bX9jZxk', sources: 0 },
    { slug: 'warehouse-setup-checklist', components: ['SetupArticleNavigation', 'SetupReadinessStages', 'SetupHandoffRehearsal'], sources: 2 },
    { slug: 'set-appointment-limits-by-load-type', components: ['lite-youtube', 'LoadTypeAvailability', 'DemoCapture'], videoId: 'QksqjjFk7wE', sources: 0 },
    { slug: 'confirm-pickup-details-before-the-driver-arrives', components: ['lite-youtube', 'PickupDetailsHandoff', 'DemoCapture'], videoId: 'PV_GomSDXwM', sources: 0 },
    { slug: 'set-response-expectations-for-warehouse-messages', components: ['lite-youtube', 'MessageResponseExpectations', 'DemoCapture'], videoId: 'e_Shxlc-F_0', sources: 0 },
    { slug: 'early-arrival-patterns', components: ['PostOneRevised'], sources: 2 },
    { slug: 'missed-slot-fees', components: ['PostTwoRevised'], sources: 2 },
    { slug: 'receiving-backlogs', components: ['PostThreeRevised'], sources: 2 },
    { slug: 'paperwork-delays', components: ['PostFourRevised'], sources: 2 },
    { slug: 'driver-wayfinding', components: ['PostFiveRevised'], sources: 2 },
    { slug: 'rollout-decisions', components: ['PostSixRevised'], sources: 2 },
  ])('preserves all components and source fields in $slug', async ({ slug, components, videoId, sources }) => {
    const { content } = matter(readFileSync(resolve(process.cwd(), `src/content/posts/${slug}.mdx`), 'utf8'));
    const original = await componentMetadata(content);
    expect(original.filter(item => item.name !== 'SmartLink').map(item => item.name)).toEqual(components);
    const citations = original.filter(item => item.name === 'SmartLink');
    expect(citations).toHaveLength(sources);
    for (const citation of citations) {
      for (const field of ['href', 'title', 'snippet', 'anchorText']) {
        expect(citation.props[field]).toBeTypeOf('string');
        expect((citation.props[field] as string).trim()).not.toBe('');
      }
    }
    if (videoId) {
      expect(original.find(item => item.name === 'lite-youtube')?.props.videoid).toBe(videoId);
      expect(original.find(item => item.name === 'DemoCapture')?.props).toEqual({ standalone: true });
      expect(content).toMatch(/\[[^\]]+\]\(#book-demo\)/);
    }
    const saved = roundTrip(content);
    expect(await componentMetadata(saved)).toEqual(original);
    if (videoId) expect(saved).toContain(content.match(/\[[^\]]+\]\(#book-demo\)/)![0]);
    expect(saved).not.toMatch(/^\s*(?:import|export)\b/m);
    expect(roundTrip(saved)).toBe(saved);
  });
});
