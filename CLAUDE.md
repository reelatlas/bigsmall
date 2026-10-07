# CLAUDE.md — working conventions for bigsmall

Read this first in every session. Then `docs/PLAN.md` for context, `docs/LEARNINGS.md` for known gotchas, and `docs/ARCHITECTURE.md` before touching code.

## The project in one paragraph

bigsmall is a static, client-side unit converter: web first, responsive, installable as a PWA later. Two smart inputs sit side by side. The user types a number and/or a unit into either one and the other updates live. There is no database and no server. The conversion engine is pure TypeScript in `packages/core`; the UI is an Astro site with React islands in `apps/web`. Details in `docs/PLAN.md`.

## Current status

Milestones 0 (setup), 1 (core engine), and the code of 2 (smart input) complete on 2026-10-06. Six rounds of Sean's first-pass feedback are applied and recorded in `docs/research/findings-0-first-pass.md`; the behavior they settled is in `docs/UX-SPEC.md` §15–§18. The converter works end to end: two linked smart inputs, live results, typing chunks for Escape and undo, numbers that fit their field, out-of-range messages, a category label under the box driving the conversion, clear all, a keyboard shortcuts map, URL state, about 82 KB gzipped. Milestone 2 closes when the five-person usability test in `docs/research/usability-test-1.md` has been run and its findings recorded. Next after that: milestone 3 (keypad, modes, persistence, advanced tiers). Progress and definitions of done are in `docs/PLAN.md` §13.

## Non-negotiables

1. **Originality.** Never copy text, code, markup, styles, unit descriptions, or taxonomy from other converter sites. Conversion factors come from NIST / BIPM sources and every unit cites one. (ADR 0004)
2. **Core/UI boundary.** `packages/core` has zero runtime dependencies and never imports from the DOM, React, Astro, or `apps/web`. The UI never contains conversion math and imports only from `@bigsmall/core`. (ADR 0003)
3. **No one-off values.** Colors, type, radii, shadows, and motion come from semantic tokens through the Tailwind bridge (`bg-canvas`, `text-ink`, `rounded-md`...). No raw hex, rgb, px radii, or literal durations inside components. A new visual need means a new token in every theme, documented in `docs/DESIGN-SYSTEM.md`.
4. **No one-off components.** Check `apps/web/src/components` first. Extend rather than fork. Every component appears in `/dev/gallery`.
5. **React for interaction, Astro for structure.** Anything the user interacts with is a React component. Astro files only scaffold pages and static content. Exception: the header menus (theme picker, keyboard shortcuts map) are plain HTML driven by the inline script in `Base.astro`, so they work before any bundle loads and add none. (ADR 0002, re-examination)
6. **Accessibility is a requirement.** Keyboard-operable, visible focus, labelled, 44 px targets, works at 320 px and 400 % zoom, respects reduced motion. Every theme passes the contrast test. Playwright runs axe on every page in every theme.
7. **Budgets are tests.** Lint, format, types, unit tests, build, and the browser suite all gate CI. Performance budgets join at milestone 2.
8. **Behavior is specified before it is built.** A UI behavior change updates `docs/UX-SPEC.md` in the same change.
9. **Decisions are recorded.** Anything you would explain twice becomes an ADR in `docs/decisions/`.
10. **Learnings are logged.** A gotcha, workaround, or best practice found during work gets a dated entry in `docs/LEARNINGS.md` in the same change.
11. **Modern where compatible.** Newest tool majors whose peers are satisfied; pins and overrides are documented with reasons. Never drop accessibility tooling to make an upgrade work. (ADR 0005)

## Commands

```bash
pnpm dev            # Astro dev server for apps/web
pnpm build          # static site to apps/web/dist
pnpm bundle         # gzipped size of what the converter page ships (bundle:check enforces the budget)
pnpm test           # all Vitest projects (core + web)
pnpm e2e            # Playwright + axe (first time: pnpm --filter @bigsmall/web exec playwright install chromium)
pnpm lint
pnpm format         # or format:check
pnpm typecheck      # tsc for core, astro check for web
pnpm check          # lint + typecheck + test + build, same as CI
```

## Recipes

- **Add a unit:** `packages/core/src/units/<category>.ts` with `source` and `exact`; add the aliases people type; add a golden row in `packages/core/test/golden/`; run `pnpm test`. Details in `docs/UNITS-CATALOG.md` §6.
- **Add a component:** `docs/DESIGN-SYSTEM.md` "Adding a component".
- **Add a theme:** `docs/THEMING.md` "Authoring a theme".
- **Add a page:** `apps/web/src/pages/`, use `layouts/Base.astro`, islands only where there is real interaction.

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`. Optional scope: `feat(core): add dry volume units`. Keep commits small and focused. Run `pnpm check` before committing.
