import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for DataDocks marketing site.
 *
 * Local usage:  npx playwright test          (spins up preview server automatically)
 * CI usage:     PLAYWRIGHT_BASE_URL=https://xxx.pages.dev npx playwright test
 *               (targets the Cloudflare preview — no local server needed)
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4321';
const isRemote = baseURL.startsWith('https://');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start a local server when not targeting a remote URL
  ...(isRemote
    ? {}
    : {
        webServer: {
          command: 'npm run preview',
          url: 'http://localhost:4321',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
