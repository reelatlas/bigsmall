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
    // WebKit on a phone, Safari's engine, for the specs where it differs from Chromium in
    // scrolling and focus (docs/TESTING.md, 2026-10-18): about, formulas, and feedback whole,
    // smoke's axe and 16 px checks, the table's Cooking pills, its stuck head, the headings stuck
    // under it in Edit and Hidden, a side panel opened under it, and the category menu's opening
    // without a scroll, Edit's kept place and
    // the glides in settings, and the double-tap's copy leaving the row's cells in place (WebKit
    // laid the row's nested subgrid out wrong under a positioned flash, 2026-10-20), chosen by file
    // and title. The clipboard reads skip there: WebKit grants the runner no permission to read it;
    // its writes go through.
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
      testMatch: /(about|formulas|feedback|smoke|table|settings|touch)\.spec\.ts/,
      grep: /about\.spec|formulas\.spec|feedback\.spec|renders with no WCAG violations|no text field on any page is under 16 px|Cooking|stay at the window’s top|section headings stick under the block|a side panel opened under a stuck head|opening the category menu leaves the page|open category menu scrolls inside|Edit sends one to Hidden|glides to its place|glide moves only|a second tap on a row/,
    },
    // WebKit on a desktop, for what only a wide window has: a side panel stuck beside the head
    // from md, the head staying at the window's top, and the foot following the column (checked
    // by hand three times before it joined, 2026-10-18).
    {
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /(table|header)\.spec\.ts/,
      grep: /a side panel opened under a stuck head|stay at the window’s top|the foot with it/,
    },
  ],
});
