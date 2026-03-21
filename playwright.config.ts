import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 360_000, // 6 minutes per test (30s discuss × multiple rounds)
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:9999',
    locale: 'en-US',        // force English so heading text matches test expectations
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'on',       // capture screenshots at each step
    video: 'on',            // record video of the test
    trace: 'on',            // capture full trace for debugging
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Server must be started separately: node server.js
});
