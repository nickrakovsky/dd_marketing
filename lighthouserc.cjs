/**
 * Lighthouse CI configuration.
 *
 * Local:  npx lhci autorun          (starts preview server, tests localhost)
 * CI:     PREVIEW_URL=https://xxx.pages.dev npx lhci autorun --collect.startServerCommand=""
 *         (all five priority pages are checked against the same preview)
 */
const baseURL = process.env.PREVIEW_URL || 'http://localhost:4321';
const performancePaths = ['/', '/posts', '/comparison', '/news', '/posts/best-yard-management-options'];

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'localhost',
      startServerReadyTimeout: 30000,
      url: performancePaths.map(path => new URL(path, baseURL).href),
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.93 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // CLS > 0.01 is an error (true zero is unrealistic for CWV measurement noise)
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
