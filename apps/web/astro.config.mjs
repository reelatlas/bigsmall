// @ts-check
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Placeholder until the domain is bought (docs/PLAN.md §14).
  site: 'https://bigsmall.pages.dev',
  output: 'static',
  // compat: true aliases react and react-dom to preact/compat, so components keep importing from 'react'.
  integrations: [preact({ compat: true })],
  vite: {
    plugins: [tailwindcss()],
  },
});
