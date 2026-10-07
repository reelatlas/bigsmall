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
