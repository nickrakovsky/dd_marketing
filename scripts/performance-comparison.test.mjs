import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatComparisonSummary, formatRunMetrics, summarizeComparisons } from './performance-comparison.mjs';

const baseline = { score: 95, lcp: 2000, tbt: 10, cls: 0 };
function compare(preview, production = baseline) {
  const results = [0, 1, 2].flatMap(pair => [
    { route: '/integrations', arm: 'production', pair, ...production },
    { route: '/integrations', arm: 'preview', pair, ...preview },
  ]);
  return summarizeComparisons(results, ['/integrations'])[0];
}

test('explains the recorded integrations failure despite improved score and LCP', () => {
  const comparison = compare(
    { score: 96, lcp: 2352.785, tbt: 0, cls: 0.01705 },
    { score: 95, lcp: 2610.545, tbt: 0, cls: 0 },
  );
  assert.equal(comparison.materialRegression, true);
  assert.deepEqual(comparison.regressions, [{ metric: 'cls', value: 0.01705, limit: 0.01 }]);
  assert.ok(formatComparisonSummary([comparison]).includes('CLS: 0.01705 > limit 0.01'));
});

for (const [metric, value, limit] of [['tbt', 61, 60], ['cls', 0.0101, 0.01]]) {
  test(`better score and faster LCP do not hide a ${metric.toUpperCase()} failure`, () => {
    const comparison = compare({ ...baseline, score: 96, lcp: 1800, [metric]: value });
    assert.equal(comparison.materialRegression, true);
    assert.deepEqual(comparison.regressions, [{ metric, value, limit }]);
    const summary = formatComparisonSummary([comparison]);
    assert.match(summary, new RegExp(`${metric.toUpperCase()}: ${value}.*> limit ${limit}`));
  });
}

for (const [metric, limit, step] of [['lcp', 2300, 0.01], ['tbt', 60, 0.01], ['cls', 0.01, 0.000001]]) {
  test(`${metric.toUpperCase()} still passes below or at the limit and fails strictly above it`, () => {
    for (const offset of [-step, 0, step]) {
      const comparison = compare({ ...baseline, [metric]: limit + offset });
      assert.equal(comparison.materialRegression, offset > 0);
      assert.equal(comparison.regressions.length, offset > 0 ? 1 : 0);
      if (offset > 0) assert.equal(comparison.regressions[0].limit, limit);
    }
  });
}

test('CLS preserves the relative 0.005 allowance when it is above the 0.01 floor', () => {
  const production = { ...baseline, cls: 0.02 };
  assert.equal(compare({ ...production, cls: 0.025 }, production).materialRegression, false);
  assert.deepEqual(compare({ ...production, cls: 0.025001 }, production).regressions,
    [{ metric: 'cls', value: 0.025001, limit: 0.025 }]);
});

test('the gate still uses independent medians instead of a worst run or blended score', () => {
  const results = [0, 1, 2].flatMap(pair => [
    { route: '/integrations', arm: 'production', pair, ...baseline },
    { route: '/integrations', arm: 'preview', pair, ...baseline, tbt: [500, 20, 30][pair] },
  ]);
  const comparison = summarizeComparisons(results, ['/integrations'])[0];
  assert.equal(comparison.preview.tbt, 30);
  assert.equal(comparison.materialRegression, false);
});

test('reports all triggered metrics with exact values and limits', () => {
  const comparison = compare({ score: 90, lcp: 2300.001, tbt: 60.001, cls: 0.010001 });
  assert.equal(comparison.regressions.length, 3);
  const summary = formatComparisonSummary([comparison]);
  assert.ok(summary.includes('LCP: 2300.001 ms > limit 2300 ms'));
  assert.ok(summary.includes('TBT: 60.001 ms > limit 60 ms'));
  assert.ok(summary.includes('CLS: 0.010001 > limit 0.01'));
});

test('per-run and summary output include TBT and CLS even when nothing fails', () => {
  const comparison = compare({ ...baseline, score: 96, lcp: 1800, tbt: 23.45, cls: 0.00123 });
  assert.equal(formatRunMetrics(comparison.preview), 'score 96, LCP 1800ms, TBT 23.45ms, CLS 0.00123');
  const summary = formatComparisonSummary([comparison]);
  assert.ok(summary.includes('Production TBT | Preview TBT | Production CLS | Preview CLS'));
  assert.ok(summary.includes('| 10.00 ms | 23.45 ms | 0.00000 | 0.00123 | None detected |'));
});
