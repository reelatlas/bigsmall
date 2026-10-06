import { defineConfig } from 'vitest/config';

// Unit tests for the web app that need no browser (theme contracts, pure helpers).
// Browser behavior is covered by Playwright in ./e2e.
export default defineConfig({
  test: {
    name: 'web',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
