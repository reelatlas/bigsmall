# CLAUDE.md — working conventions for bigsmall

Read this first in every session. Then `docs/PLAN.md` for context, `docs/LEARNINGS.md` for known gotchas, `docs/ARCHITECTURE.md` before touching code, and `docs/DEPLOYMENT.md` before anything about hosting or domains.

## The project in one paragraph

bigsmall is a static, client-side unit converter: web first, responsive, installable as a PWA later. The user types a number, a unit, or both into one box and sees the value in every unit of its category in a table under it, which is also where units are picked (ADR 0012, ADR 0013). There is no database and no server. The conversion engine is pure TypeScript in `packages/core`; the UI is an Astro site in `apps/web` whose islands are written against the React API and run on Preact through `preact/compat` (ADR 0007). Details in `docs/PLAN.md`.

## Current status

- **Milestones.** 0 (setup), 1 (core engine), and 2 (smart input) are complete. Milestone 2's five-person usability test was set aside (Sean, 2026-10-08): friends' feedback rounds give the signal while the product is early, and the test runs if it gains traction (`docs/research/usability-test-1.md`). Progress and definitions of done: `docs/PLAN.md` §13.
- **Live.** The MVP is live at `https://bigsmall.work` on Vercel since 2026-10-07, tagged `v0.1.0` (ADR 0008); `bigsmall.diy` and both `www` names redirect to it. Every push to `main` that passes CI deploys, and the two CI jobs are Vercel's Deployment Checks, so CI gates production (`docs/DEPLOYMENT.md`).
- **The converter.** One box and its table (ADR 0013, 2026-10-07): the table is the unit list (ADR 0012, option A from the selection lab), a category menu over the box, and in the table's place the categories, the category's units, or the matches, with a cursor that keeps the caret in the box; no headline (ADR 0010). The arrow keys move between the page's planes, two toolbars and the box (ADR 0014); on a touch screen the keyboard comes up only from the box (ADR 0015). Two boxes and the layout switch, decided from friends' feedback (ADR 0009), were retired the same day and stay in git (`f4563f2`). Units are listed the visitor's way, their own system first, smallest to largest (ADR 0011). Current behavior: `docs/UX-SPEC.md` (§14 lists what is planned). How it got here: `docs/research/findings-0-first-pass.md`, a section per round of Sean's feedback (the twelfth is the pre-launch tidy-up, the thirteenth Sean's first notes on the live site, the fifteenth option A's build, the sixteenth one layout, the seventeenth and eighteenth the keyboard across the page, then the third tidy pass, the nineteenth the phone, then the fourth tidy pass), and `docs/research/findings-friends-1.md`.
- **Open with Sean.** The mark and the preview card are a trial he may change (`docs/DESIGN-SYSTEM.md`, "Brand assets"). Trials from 2026-10-08 still open: the calculator's accent edge while it has the keys; the calculator lined up with the toolbar and the box; the panel titles and the category menu's empty label in a label's muted ink (explained to him, awaiting his word); and, local and not pushed, the table's card edge at 2 px in the control edge color (the color decided, the width a trial; the calculator keeps its light 1 px). Kept for now, the same day: the category menu on the toolbar's left, the theme menu's label on wide screens, and no check on an open menu's choice (`docs/UX-SPEC.md` §14). Once he has used the table's new model: an all-clear control and a chosen category in the URL (§14).
- **Next.** The explorations in `docs/PLAN.md` §2 (every category at once, more categories, search, analytics, and the ideas from friends and Sean: favorites, filtering the table, Dan's multiples, Mike's fractional feet and inches, writing fractions, keeping the math, saved settings and templates) and milestone 3, each checked with a round of friends' feedback (`docs/research/findings-friends-1.md`); the five-person test waits for traction.

## Non-negotiables

1. **Originality.** Never copy text, code, markup, styles, unit descriptions, or taxonomy from other converter sites. Conversion factors come from NIST / BIPM sources and every unit cites one. (ADR 0004)
2. **Core/UI boundary.** `packages/core` has zero runtime dependencies and never imports from the DOM, React or Preact, Astro, or `apps/web`. The UI never contains conversion math and imports only from `@bigsmall/core`. (ADR 0003)
3. **No one-off values.** Colors, type, radii, shadows, and motion come from semantic tokens through the Tailwind bridge (`bg-canvas`, `text-ink`, `rounded-md`...). No raw hex, rgb, px radii, or literal durations inside components. A new visual need means a new token in every theme, documented in `docs/DESIGN-SYSTEM.md`. `pnpm lint` runs a token guard that rejects raw values; when it flags one, use an existing token or bring the proposed new token to Sean in chat first.
4. **No one-off components.** Check `apps/web/src/components` first. Extend rather than fork. Every component appears in `/dev/gallery`.
5. **TSX for interaction, Astro for structure.** Anything the user interacts with is a TSX component written against the React API (imports from `'react'`), which runs on Preact through `preact/compat` (ADR 0007): work that must happen before the next key goes in a layout effect, and the first client render matches the server's. Astro files only scaffold pages and static content. Exceptions: the header menus (theme picker, keyboard shortcuts map) are plain HTML driven by the inline script in `Base.astro`, so they work before any bundle loads and add none (ADR 0002, re-examination), and so are the page's toolbars and the arrows between its planes (ADR 0014); and the wordmark at play is an Astro `<script>` (`lib/wordmark-motion.ts`) that loads with the page and runs only once the heading is hovered or tapped.
6. **Accessibility is a requirement.** Keyboard-operable, visible focus, labelled, 44 px targets, works at 320 px and 400 % zoom, respects reduced motion. Every theme passes the contrast test. Playwright runs axe on the converter in every theme and on the gallery, and a keyboard walk checks that every Tab stop shows focus.
7. **Budgets are tests.** Lint, format, types, unit tests, build, the bundle budget, and the browser suite all gate CI. Lighthouse budgets join at milestone 5.
8. **Behavior is specified before it is built.** A UI behavior change updates `docs/UX-SPEC.md` in the same change.
9. **Decisions are recorded.** Anything you would explain twice becomes an ADR in `docs/decisions/`.
10. **Learnings are logged.** A gotcha, workaround, or best practice found during work gets a dated entry in `docs/LEARNINGS.md` in the same change.
11. **Modern where compatible.** Newest tool majors whose peers are satisfied; pins and overrides are documented with reasons. Never drop accessibility tooling to make an upgrade work. (ADR 0005)

## Commands

```bash
pnpm dev            # Astro dev server for apps/web (new Tailwind classes missing from a long-running one: re-save src/styles/global.css, docs/LEARNINGS.md)
pnpm build          # static site to apps/web/dist
pnpm bundle         # gzipped size of what the converter page ships (bundle:check enforces the budget)
pnpm test           # all Vitest projects (core + web)
pnpm e2e            # Playwright + axe (first time: pnpm --filter @bigsmall/web exec playwright install chromium)
pnpm lint
pnpm format         # or format:check
pnpm typecheck      # tsc for core, astro check for web
pnpm check          # lint + format check + typecheck + test + build + bundle check: CI's verify job
pnpm --filter @bigsmall/web brand   # redraw the icons and the link preview image from the Daylight tokens
```

## Recipes

- **Add a unit:** `packages/core/src/units/<category>.ts` with `source` and `exact`; add the aliases people type; add a golden row in `packages/core/test/golden/`; run `pnpm test`. Details in `docs/UNITS-CATALOG.md` §6.
- **Add a component:** `docs/DESIGN-SYSTEM.md` "Adding a component".
- **Add a theme:** `docs/THEMING.md` "Authoring a theme".
- **Add a page:** `apps/web/src/pages/`, use `layouts/Base.astro` with `components/PageHeader.astro` (a `/dev` page uses `layouts/DevPage.astro`, which also keeps it out of search), islands only where there is real interaction.
- **Add a keyboard shortcut:** handle the key in code, add it to `apps/web/src/lib/shortcuts.ts` (the shortcuts map renders from it), and describe it in `docs/UX-SPEC.md` §8.
- **Add a header menu:** reuse the shell controller in `layouts/Base.astro` (`data-shell`, `data-shell-toggle`) and the shell recipes in `src/lib/recipes.ts`, and place it in `components/HeaderMenus.astro`; its trigger carries `data-tool`, so the header's toolbar reaches it (ADR 0014). No new script.
- **Add a UI delay:** a named constant in `apps/web/src/lib/timing.ts`, never a literal number of milliseconds.
- **Change the icon or the link preview:** edit the mark in `apps/web/scripts/brand-assets.mjs` (or the name or description in `src/lib/site.ts`), run the `brand` command, and commit what it writes to `apps/web/public/`.
- **Ship:** push to `main`. CI must pass before Vercel promotes the build to `bigsmall.work` (`docs/DEPLOYMENT.md`).
- **Tidy up:** the `/tidy` skill (`.claude/skills/tidy/`) audits what changed since the last tidy, an area, or the whole system (`/tidy full`) against the design system and the docs, fixes what is mechanical, and brings look, behavior, and token changes to Sean. Offer it after a lab or a feature lands; run it when asked.

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`. Optional scope: `feat(core): add dry volume units`. Keep commits small and focused. Run `pnpm check` before committing.
