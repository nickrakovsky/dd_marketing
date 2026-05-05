/**
 * Lighthouse CI configuration.
 *
 * Local:  npx lhci autorun          (starts preview server, tests localhost)
 * CI:     npx lhci autorun --collect.url="https://xxx.pages.dev/" --collect.startServerCommand=""
 *         (CLI flags override these defaults so the Cloudflare preview is tested directly)
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'localhost',
      startServerReadyTimeout: 30000,
      url: ['http://localhost:4321/'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
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
