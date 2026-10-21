import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { formatComparisonSummary, formatRunMetrics, summarizeComparisons } from './performance-comparison.mjs';

const preview = new URL(process.argv[2]);
if (preview.protocol !== 'https:' || !preview.hostname.endsWith('.dd-marketing.pages.dev')) {
  throw new Error('Expected an HTTPS dd-marketing Cloudflare preview origin.');
}
const output = path.resolve('performance-comparison');
fs.mkdirSync(output, { recursive: true });
const routes = ['/', '/integrations', '/posts/best-yard-management-options'];
const results = [];
for (const route of routes) {
  const routeKey = route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-');
  // Alternate order to reduce warm-up and temporal network bias. Both origins
  // use the same browser, mobile viewport, simulated network and CPU settings.
  for (let pair = 0; pair < 3; pair++) {
    for (const arm of pair % 2 ? ['preview', 'production'] : ['production', 'preview']) {
      const url = new URL(route, arm === 'preview' ? preview.origin : 'https://datadocks.com').href;
      const filename = path.join(output, `${routeKey}-${arm}-${pair}.json`);
      const run = spawnSync(path.resolve('node_modules/.bin/lighthouse'), [url,
        '--verbose', '--save-assets', '--output=json', `--output-path=${filename}`,
        '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
        '--only-categories=performance', '--form-factor=mobile', '--throttling-method=simulate',
        '--screenEmulation.mobile=true', '--screenEmulation.width=390',
        '--screenEmulation.height=844', '--screenEmulation.deviceScaleFactor=1',
      ], { stdio: 'inherit', timeout: 120000,
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      });
      if (run.status !== 0) throw new Error(`Lighthouse failed for ${url}: ${run.error?.message ?? run.status}`);
      const report = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (report.runtimeError) throw new Error(`Lighthouse could not measure ${url}: ${report.runtimeError.message}`);
      const warnings = report.runWarnings ?? [];
      for (const warning of warnings) {
        console.warn(`[performance] ${route} ${arm} pair ${pair + 1} warning: ${warning}`);
      }
      results.push({ route, arm, pair, score: report.categories.performance.score * 100,
        lcp: report.audits['largest-contentful-paint'].numericValue,
        tbt: report.audits['total-blocking-time'].numericValue,
        cls: report.audits['cumulative-layout-shift'].numericValue,
        warnings, benchmarkIndex: report.environment?.benchmarkIndex,
      });
      console.log(`[performance] ${route} ${arm} pair ${pair + 1}: ${formatRunMetrics(results.at(-1))}`);
    }
  }
}
const comparisons = summarizeComparisons(results, routes);
fs.writeFileSync(path.join(output, 'comparison.json'), JSON.stringify({ results, comparisons }, null, 2) + '\n');
const summary = formatComparisonSummary(comparisons);
fs.writeFileSync(path.join(output, 'comparison.md'), summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
if (comparisons.some(row => row.materialRegression)) process.exitCode = 1;
