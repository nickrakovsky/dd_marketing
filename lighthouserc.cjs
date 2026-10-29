/**
 * Lighthouse audit configuration, consumed by scripts/performance-audit.mjs.
 *
 * Local:  npm run perf             (starts the production Pages preview)
 * CI:     PREVIEW_URL=https://xxx.pages.dev npm run perf
 *         (all five priority pages are checked against the same preview)
 */
const baseURL = process.env.PREVIEW_URL || 'http://localhost:4321';
const performancePaths = ['/', '/posts', '/comparison', '/news', '/posts/best-yard-management-options'];

module.exports = {
  ci: {
    collect: {
      url: performancePaths.map(path => new URL(path, baseURL).href),
      numberOfRuns: 1,
      // Keep the trace behind a failed score so we can identify the cause.
      settings: { saveAssets: true },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.93 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // CLS > 0.01 is an error (true zero is unrealistic for CWV measurement noise)
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
      },
    },
  },
};
