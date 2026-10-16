const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

export function summarizeComparisons(results, routes) {
  return routes.map(route => {
    const summarize = arm => Object.fromEntries(['score', 'lcp', 'tbt', 'cls'].map(metric =>
      [metric, median(results.filter(row => row.route === route && row.arm === arm).map(row => row[metric]))]));
    const production = summarize('production');
    const preview = summarize('preview');
    // Preserve the existing strict thresholds; display rounding never affects the gate.
    const limits = {
      lcp: production.lcp * 1.1 + 100,
      tbt: production.tbt + 50,
      cls: Math.max(0.01, production.cls + 0.005),
    };
    const regressions = Object.entries(limits)
      .filter(([metric, limit]) => preview[metric] > limit)
      .map(([metric, limit]) => ({ metric, value: preview[metric], limit }));
    return { route, production, preview, materialRegression: regressions.length > 0, regressions };
  });
}

export function formatRunMetrics(row) {
  return `score ${row.score}, LCP ${Math.round(row.lcp)}ms, TBT ${row.tbt.toFixed(2)}ms, CLS ${row.cls.toFixed(5)}`;
}

export function formatComparisonSummary(comparisons) {
  const header = '| Route | Production score | Preview score | Production LCP | Preview LCP | Production TBT | Preview TBT | Production CLS | Preview CLS | Regression |\n'
    + '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n';
  const rows = comparisons.map(({ route, production, preview, regressions }) => {
    // Keep failure values unrounded so even a small threshold crossing is explainable.
    const reason = regressions.map(({ metric, value, limit }) => {
      const unit = metric === 'cls' ? '' : ' ms';
      return `${metric.toUpperCase()}: ${value}${unit} > limit ${limit}${unit}`;
    }).join('; ') || 'None detected';
    return `| ${route} | ${production.score} | ${preview.score} | ${Math.round(production.lcp)} ms | ${Math.round(preview.lcp)} ms | ${production.tbt.toFixed(2)} ms | ${preview.tbt.toFixed(2)} ms | ${production.cls.toFixed(5)} | ${preview.cls.toFixed(5)} | ${reason} |`;
  }).join('\n');
  return header + rows
    + '\n\nThree interleaved mobile runs per origin; identical browser, viewport and throttling. Lab evidence does not guarantee real-user equivalence. Production-only Dealfront remains disabled on preview.\n';
}
