# CLAUDE.md — working conventions for bigsmall

Read this first in every session. Then `docs/PLAN.md` for context, `docs/LEARNINGS.md` for known gotchas, and `docs/ARCHITECTURE.md` before touching code.

## The project in one paragraph

bigsmall is a static, client-side unit converter: web first, responsive, installable as a PWA later. Two smart inputs sit side by side. The user types a number and/or a unit into either one and the other updates live. There is no database and no server. The conversion engine is pure TypeScript in `packages/core`; the UI is an Astro site in `apps/web` whose islands are written against the React API and run on Preact through `preact/compat` (ADR 0007). Details in `docs/PLAN.md`.

## Current status

Milestones 0 (setup), 1 (core engine), and the code of 2 (smart input) complete on 2026-10-06. Sean's feedback rounds are applied and recorded in `docs/research/findings-0-first-pass.md`. The next session starts at its end ("Twelfth pass — pending"): a pre-launch tidy-up of code, design system, and docs, then launch prep on Vercel with `bigsmall.work` as the main domain (ADR 0008). `docs/UX-SPEC.md` describes current behavior; its §14 lists what is planned, Sean's queued ideas are all built. The converter works end to end: two linked smart inputs, live results, arithmetic in the boxes (`+ − × ÷`, Enter as equals), a calculator scratch pad whose number can be sent to either box, typing chunks for Escape and undo, numbers that fit their field, out-of-range messages, a category label under the box driving the conversion, clear all, Copy URL, a keyboard shortcuts map, a wordmark that plays on hover beside each theme's art (tuned on `/dev/wordmark-lab`), URL state, 39.6 KB gzipped of a 90 KB budget on Preact (ADR 0007). Milestone 2 closes when the five-person usability test in `docs/research/usability-test-1.md` has been run and its findings recorded. Next after that: milestone 3 (modes, persistence, advanced tiers). Progress and definitions of done are in `docs/PLAN.md` §13.

## Non-negotiables

1. **Originality.** Never copy text, code, markup, styles, unit descriptions, or taxonomy from other converter sites. Conversion factors come from NIST / BIPM sources and every unit cites one. (ADR 0004)
2. **Core/UI boundary.** `packages/core` has zero runtime dependencies and never imports from the DOM, React or Preact, Astro, or `apps/web`. The UI never contains conversion math and imports only from `@bigsmall/core`. (ADR 0003)
3. **No one-off values.** Colors, type, radii, shadows, and motion come from semantic tokens through the Tailwind bridge (`bg-canvas`, `text-ink`, `rounded-md`...). No raw hex, rgb, px radii, or literal durations inside components. A new visual need means a new token in every theme, documented in `docs/DESIGN-SYSTEM.md`. `pnpm lint` runs a token guard that rejects raw values; when it flags one, use an existing token or bring the proposed new token to Sean in chat first.
4. **No one-off components.** Check `apps/web/src/components` first. Extend rather than fork. Every component appears in `/dev/gallery`.
5. **TSX for interaction, Astro for structure.** Anything the user interacts with is a TSX component written against the React API (imports from `'react'`), which runs on Preact through `preact/compat` (ADR 0007): work that must happen before the next key goes in a layout effect, and the first client render matches the server's. Astro files only scaffold pages and static content. Exception: the header menus (theme picker, keyboard shortcuts map) are plain HTML driven by the inline script in `Base.astro`, so they work before any bundle loads and add none. (ADR 0002, re-examination)
6. **Accessibility is a requirement.** Keyboard-operable, visible focus, labelled, 44 px targets, works at 320 px and 400 % zoom, respects reduced motion. Every theme passes the contrast test. Playwright runs axe on the converter in every theme and on the gallery, and a keyboard walk checks that every Tab stop shows focus.
7. **Budgets are tests.** Lint, format, types, unit tests, build, the bundle budget, and the browser suite all gate CI. Lighthouse budgets join at milestone 5.
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
pnpm check          # lint + format check + typecheck + test + build + bundle check: CI's verify job
```

## Recipes

- **Add a unit:** `packages/core/src/units/<category>.ts` with `source` and `exact`; add the aliases people type; add a golden row in `packages/core/test/golden/`; run `pnpm test`. Details in `docs/UNITS-CATALOG.md` §6.
- **Add a component:** `docs/DESIGN-SYSTEM.md` "Adding a component".
- **Add a theme:** `docs/THEMING.md` "Authoring a theme".
- **Add a page:** `apps/web/src/pages/`, use `layouts/Base.astro` with `components/PageHeader.astro` (a `/dev` page uses `layouts/DevPage.astro`, which also keeps it out of search), islands only where there is real interaction.
- **Add a keyboard shortcut:** handle the key in code, add it to `apps/web/src/lib/shortcuts.ts` (the shortcuts map renders from it), and describe it in `docs/UX-SPEC.md` §8.
- **Add a header menu:** reuse the shell controller in `layouts/Base.astro` (`data-shell`, `data-shell-toggle`) and the shell recipes in `src/lib/recipes.ts`, and place it in `components/HeaderMenus.astro`. No new script.
- **Add a UI delay:** a named constant in `apps/web/src/lib/timing.ts`, never a literal number of milliseconds.

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`. Optional scope: `feat(core): add dry volume units`. Keep commits small and focused. Run `pnpm check` before committing.
