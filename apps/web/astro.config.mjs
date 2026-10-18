// @ts-check
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // The main domain (ADR 0008). Canonical links, the sitemap, robots.txt, and link previews are
  // built from it; bigsmall.diy redirects here at the host.
  site: 'https://bigsmall.work',
  output: 'static',
  // The dev toolbar stays off under the browser suite (playwright.config.ts sets BIGSMALL_E2E for
  // the server it starts, as CI's does): it overlays the page's foot, and Playwright scrolls the
  // page to get round a control it covers, which moved what a test measured (docs/LEARNINGS.md,
  // 2026-10-18). A server started by hand keeps it.
  devToolbar: { enabled: process.env['BIGSMALL_E2E'] !== '1' },
  integrations: [
    // compat: true aliases react and react-dom to preact/compat, so components keep importing from 'react'.
    preact({ compat: true }),
    // The /dev pages stay out of the sitemap, as they stay out of search (layouts/DevPage.astro).
    sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/dev/') }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
