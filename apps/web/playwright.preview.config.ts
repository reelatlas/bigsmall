import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The suite against a build, for a machine whose dev server holds 4321 (docs/TESTING.md, "End to
// end"): `pnpm build`, then `pnpm e2e:preview`, which serves `dist` on `astro preview` at 4322.
// The projects, the locale, and the retries are the base config's; only the server differs. A
// build has no dev toolbar, so nothing needs switching off, and the minifier's own writing of the
// tokens (400ms as .4s) is what the tests read.
const PORT = 4322;
const HOST = '127.0.0.1';

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: `http://${HOST}:${PORT}` },
  webServer: {
    command: `pnpm preview --host ${HOST} --port ${PORT}`,
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
