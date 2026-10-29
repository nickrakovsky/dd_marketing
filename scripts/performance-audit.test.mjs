import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { evaluateAssertions } from './performance-audit.mjs';

const require = createRequire(import.meta.url);
const { ci: config } = require('../lighthouserc.cjs');
const report = () => ({
  categories: { performance: { score: 0.93 }, accessibility: { score: 0.9 } },
  audits: { 'cumulative-layout-shift': { numericValue: 0.01 } },
});
const evaluate = value => evaluateAssertions(value, config.assert.assertions);

test('all five existing page audits and their thresholds are retained', () => {
  assert.deepEqual(config.collect.url.map(url => new URL(url).pathname),
    ['/', '/posts', '/comparison', '/news', '/posts/best-yard-management-options']);
  assert.equal(config.collect.numberOfRuns, 1);
  assert.ok(evaluate(report()).every(result => result.passed));
});

test('performance below 93 is a warning', () => {
  const value = report();
  value.categories.performance.score = 0.92;
  assert.deepEqual(evaluate(value).filter(result => !result.passed).map(result => result.level), ['warn']);
});

test('accessibility below 90 and CLS above 0.01 fail the gate', () => {
  const value = report();
  value.categories.accessibility.score = 0.89;
  value.audits['cumulative-layout-shift'].numericValue = 0.0101;
  assert.deepEqual(evaluate(value).filter(result => !result.passed).map(result => result.level), ['error', 'error']);
});

test('missing or invalid measurements fail instead of silently passing', () => {
  for (const missing of [undefined, null, NaN, Infinity]) {
    const value = report();
    value.categories.performance.score = missing;
    const result = evaluate(value)[0];
    assert.equal(result.passed, false);
    assert.equal(result.level, 'error');
  }
});

test('a Lighthouse runtime failure cannot produce a passing audit', () => {
  assert.throws(() => evaluate({ runtimeError: { message: 'Page did not load' } }), /Page did not load/);
});

test('the dependency tree cannot reintroduce the unpatched ZIP extractor', () => {
  const lock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.ok(!Object.keys(lock.packages).some(name => /(?:^|\/)node_modules\/extract-zip$/.test(name)));
  assert.ok(!Object.values(lock.packages).some(pkg => pkg.dependencies?.['extract-zip']));
  assert.equal(lock.packages[''].devDependencies['@lhci/cli'], undefined);
  assert.match(lock.packages['node_modules/lighthouse'].version, /^13\./);
});
