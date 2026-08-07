/**
 * Pre-renders the Mermaid diagrams in src/content/features/*.mdx to static SVG.
 *
 * WHY: mermaid.js is 610 KB raw / 143 KB gz and costs ~360 ms of main-thread CPU
 * to render one static flowchart per feature page. The diagrams never change at
 * runtime — they come from frontmatter — so there is no reason to ship a diagram
 * ENGINE to the browser. We render them once here with headless Chromium and
 * commit the SVG output; the page then inlines the SVG with zero JS.
 *
 * Output: src/assets/feature-diagrams/<slug>.svg (committed to the repo)
 *
 *   npm run diagrams          re-render every diagram
 *   npm run check:diagrams    verify the committed SVGs match the MDX (no browser)
 *
 * Re-run `npm run diagrams` whenever a `dataViz.type: mermaid` block changes.
 * Each SVG is stamped with a hash of the mermaid source it came from, so
 * `--check` (wired into `npm run check`) catches a stale or missing diagram
 * without launching a browser. A forgotten re-render fails the check instead of
 * silently shipping an out-of-date flowchart.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';

const FEATURES_DIR = path.resolve('src/content/features');
const OUT_DIR = path.resolve('src/assets/feature-diagrams');
// The `.min.js` build is a single self-contained bundle that assigns
// globalThis.mermaid — unlike the ESM build, whose relative chunk imports would
// need an HTTP server. Only used at build time, so its 3 MB size is irrelevant.
const MERMAID_BUNDLE = path.resolve('node_modules/mermaid/dist/mermaid.min.js');

// htmlLabels:false emits real SVG <text> instead of foreignObject-wrapped HTML,
// so the committed SVG is fully self-contained and needs no page CSS to lay out.
// The font stack is pinned to websafe families that exist on the render machine
// AND on visitor devices, so build-time text metrics stay valid at runtime.
const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'default',
  fontFamily: 'Arial, Helvetica, sans-serif',
  flowchart: { useMaxWidth: true, htmlLabels: false, padding: 12 },
  themeVariables: {
    edgeLabelBackground: '#ffffff',
  },
  themeCSS: `
    .edgeLabel rect, .edgeLabel rect.background, .labelBkg, .edgeLabel .background, .icon-shape .label rect, .image-shape .label rect {
      fill: #faf8f5 !important;
      opacity: 1 !important;
      background-color: #faf8f5 !important;
      stroke: none !important;
      stroke-width: 0 !important;
    }
    .edgeLabel span, .edgeLabel text, .edgeLabel tspan {
      fill: #000000 !important;
      color: #000000 !important;
      opacity: 1 !important;
      font-weight: 500 !important;
    }
  `,
};

const checkOnly = process.argv.includes('--check');

/** Hash covers the diagram source AND the render config — a config change
 *  invalidates every SVG, which is what we want. */
function sourceHash(definition) {
  return createHash('sha256')
    .update(JSON.stringify(MERMAID_CONFIG))
    .update(definition)
    .digest('hex')
    .slice(0, 16);
}

const STAMP_RE = /<!--\s*dd-diagram-hash:([a-f0-9]+)\s*-->/;

function collectDiagrams() {
  const diagrams = [];
  for (const file of fs.readdirSync(FEATURES_DIR)) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
    const slug = file.replace(/\.mdx?$/, '');
    const { data } = matter(fs.readFileSync(path.join(FEATURES_DIR, file), 'utf-8'));
    const dataViz = data.bentoContent?.dataViz;
    if (dataViz?.type === 'mermaid' && typeof dataViz.content === 'string') {
      diagrams.push({ slug, definition: dataViz.content, hash: sourceHash(dataViz.content) });
    }
  }
  return diagrams;
}

/**
 * Mermaid emits `<style>` with `#<id> ...` selectors scoped to the render id, so
 * two inlined SVGs on one page can't collide. It also stamps an inline
 * `max-width` on the root <svg> that fights our responsive CSS — strip it and
 * let the tile's `svg { max-width: 100% }` rule govern instead.
 *
 * The root <svg> keeps mermaid's own `role="graphics-document document"` and
 * `width="100%"` + `viewBox`, which together give the element an intrinsic
 * aspect ratio — so the tile reserves the right height on first paint and the
 * diagram contributes no layout shift.
 */
function normalizeSvg(svg) {
  return svg.replace(/style="max-width:[^"]*"/g, '').trim();
}

const diagrams = collectDiagrams();
if (diagrams.length === 0) {
  console.log('[diagrams] no mermaid dataViz blocks found — nothing to do');
  process.exit(0);
}

// ---------------------------------------------------------------- check mode
if (checkOnly) {
  const stale = [];
  for (const { slug, hash } of diagrams) {
    const file = path.join(OUT_DIR, `${slug}.svg`);
    if (!fs.existsSync(file)) {
      stale.push(`${slug}: no pre-rendered SVG`);
      continue;
    }
    const committed = fs.readFileSync(file, 'utf-8').match(STAMP_RE)?.[1];
    if (committed !== hash) {
      stale.push(`${slug}: SVG is out of date with the mermaid source in the MDX`);
    }
  }
  if (stale.length > 0) {
    console.error('[diagrams] FAILED — feature diagrams need re-rendering:');
    for (const msg of stale) console.error(`  - ${msg}`);
    console.error('\nRun `npm run diagrams` and commit src/assets/feature-diagrams/.');
    process.exit(1);
  }
  console.log(`[diagrams] ok — ${diagrams.length} diagram(s) match their MDX source`);
  process.exit(0);
}

// --------------------------------------------------------------- render mode
const { chromium } = await import('@playwright/test');

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
// about:blank + the local bundle injected inline: no network, no CDN, and the
// mermaid version pinned in package.json is the one that renders.
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ content: fs.readFileSync(MERMAID_BUNDLE, 'utf-8') });
await page.waitForFunction(() => typeof window.mermaid !== 'undefined', null, { timeout: 30_000 });

let written = 0;
try {
  for (const { slug, definition, hash } of diagrams) {
    const svg = await page.evaluate(
      async ([def, config, id]) => {
        window.mermaid.initialize(config);
        const { svg } = await window.mermaid.render(id, def);
        return svg;
      },
      [definition, MERMAID_CONFIG, `dd-diagram-${slug}`]
    );
    const out = `<!-- dd-diagram-hash:${hash} -->\n${normalizeSvg(svg)}\n`;
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.svg`), out);
    written++;
    console.log(`[diagrams] rendered ${slug}.svg`);
  }
} finally {
  await browser.close();
}

// Drop SVGs whose feature no longer has a mermaid diagram, so the directory
// can't accumulate orphans that look current.
const expected = new Set(diagrams.map(d => `${d.slug}.svg`));
for (const file of fs.readdirSync(OUT_DIR)) {
  if (file.endsWith('.svg') && !expected.has(file)) {
    fs.unlinkSync(path.join(OUT_DIR, file));
    console.log(`[diagrams] removed orphaned ${file}`);
  }
}

console.log(`[diagrams] wrote ${written}/${diagrams.length} diagram(s) to src/assets/feature-diagrams/`);
