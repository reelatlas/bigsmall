import { defineConfig } from 'vitest/config';

// One root config so `pnpm test` runs every workspace project.
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
});
