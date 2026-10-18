import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const HOST = '127.0.0.1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // In CI: annotations on the run, plus the HTML report the workflow uploads when a test fails.
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // The visitor is in the US, writing numbers the US way, on any machine.
    locale: 'en-US',
    baseURL: `http://${HOST}:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm dev --host ${HOST} --port ${PORT}`,
    // No dev toolbar over the page under test (astro.config.mjs reads it).
    env: { ...process.env, BIGSMALL_E2E: '1' },
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
