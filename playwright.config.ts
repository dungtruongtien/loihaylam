import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000, // 3 minutes per test (game can take a while)
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
