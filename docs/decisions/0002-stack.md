# 0002 — Astro + React island + TypeScript + Tailwind v4

Date: 2026-10-06
Status: accepted (confirmed 2026-10-06; re-examined the same day, see the last section)

## Context

Requirements: fast first load on low-end phones, responsive, accessible, themeable, mostly static content with one highly interactive component, and a likely future of SEO landing pages (one per popular unit pair). The developer works largely through AI-assisted sessions, so a mainstream, well-documented stack with strong accessible-component libraries matters.

## Decision

- **Astro** for the site shell: static HTML, zero JS by default, `getStaticPaths` for generated pair pages later, built-in view transitions.
- **React** for the single converter island, so we can use **React Aria Components** for the combobox, listbox, number field, and dialog, which are the best-tested primitives on mobile screen readers and include locale-aware number parsing.
- **TypeScript** strict everywhere.
- **Tailwind CSS v4** on top of CSS custom properties. Semantic tokens are plain CSS variables; themes reassign them. Tailwind supplies layout and spacing utilities and keeps components consistent.
- **pnpm workspaces**: `packages/core` and `apps/web`.
- **Vitest** for core, **Playwright** with **axe** for web, **ESLint** flat config + **Prettier**, **Lighthouse CI** and a bundle size check in GitHub Actions.
- **Cloudflare Pages** for hosting and preview deploys, **Cloudflare Web Analytics** for cookieless usage data.

## Alternatives considered

- **SvelteKit.** Smaller bundles and built-in transitions. Loses the React ecosystem and React Aria. Revisit only if bundle size turns out to be the deciding constraint after the milestone 2 measurement.
- **Next.js.** Heavier runtime; server rendering and API routes are unused here.
- **Plain Vite + React SPA.** Simplest start, but no static page generation; migrating to Astro later is avoidable pain.
- **Preact instead of React.** Smaller, but React Aria compatibility is uneven. Keep as an optimization lever.
- **CSS Modules without Tailwind.** Fully valid; Tailwind chosen for speed and consistency across many small components. Tokens remain in plain CSS either way.
- **Biome instead of ESLint + Prettier.** Faster, but `.astro` support is partial. Revisit when it is complete.

## Consequences

- The converter page ships React (~45 KB gzipped) plus React Aria. Must measure at milestone 2 against the 90 KB budget; fallback is a lighter headless library (Base UI or Downshift).
- Every page other than the converter ships no JS.
- Theme switching is CSS-only and works before hydration.
- SEO pair pages are a build-time loop over the unit data, no new runtime.

## Re-examination (2026-10-06, after scaffold)

Question raised: should this be an all-React Vite framework (TanStack Start or React Router with prerendering) instead of Astro, for one component model and typed URL state?

Stayed with Astro because the product is a static site around one interactive island. `getStaticPaths` is the simplest way to emit thousands of unit-pair pages; pages without the converter ship no JavaScript; the scaffold is green with CI. The single-component-model benefit is real but does not outweigh React on every page and the rework.

Operating rule so the two component models never blur: **React for everything the user interacts with** (the converter, every design-system control). **Astro only for page scaffolding and static content.** One exception: the theme picker is plain HTML driven by the inline pre-paint script, because it must work before any bundle loads.

Revisit if more than a handful of Astro components accumulate interaction, or if navigation between pair pages needs preserved converter state beyond what Astro's `transition:persist` provides.

Milestone 2 outcome: React Aria Components was removed after measurement; the smart input is a hand-built WAI-ARIA combobox and other controls are native elements (ADR 0006). The rest of this decision stands.
