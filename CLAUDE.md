# CLAUDE.md — working conventions for bigsmall

Read this first in every session, "Pick up here" above all. Then `docs/PLAN.md` for context, `docs/LEARNINGS.md`'s topic index for known gotchas (and the entries touching your files), `docs/ARCHITECTURE.md` before touching code, and `docs/DEPLOYMENT.md` before anything about hosting or domains.

## The project in one paragraph

bigsmall is a static, client-side unit converter: web first, responsive, installable as a PWA later. The user types a number, a unit, or both into one box and sees the value in every unit of its category in a table under it, which is also where units are picked (ADR 0012, ADR 0013). There is no database and no server. The conversion engine is pure TypeScript in `packages/core`; the UI is an Astro site in `apps/web` whose islands are written against the React API and run on Preact through `preact/compat` (ADR 0007). Details in `docs/PLAN.md`.

## Current status (2026-10-15)

- **Where it stands.** Milestones 0 (setup), 1 (core engine), and 2 (smart input) are complete; milestone 3, the complete converter, is under way (`docs/PLAN.md` §13). Milestone 2's five-person usability test is set aside until the product gains traction; friends' feedback rounds give the signal for now (`docs/research/usability-test-1.md`).
- **Live.** `https://bigsmall.work` on Vercel since 2026-10-07 (`v0.1.0`, ADR 0008); `bigsmall.diy` and both `www` names redirect to it. Every push to `main` that passes CI deploys; the two CI jobs are Vercel's Deployment Checks (`docs/DEPLOYMENT.md`). Besides the converter, an About page holds the logo sketchbook, reached from the footer (2026-10-15).
- **The converter.** One box and its table, the table being the unit list (ADR 0012, ADR 0013), over thirteen categories with every unit listed (ADR 0016; `docs/UNITS-CATALOG.md` §3), in sections by system, the visitor's own first (ADR 0011). The toolbar holds the category menu, the calculator, and Settings as two side panels, Units and Display, remembered in this browser (ADR 0018), then undo, redo, and clear all. The arrows move across the page's planes and stop at its ends (ADR 0014); on a touch screen the keyboard comes up only from the box (ADR 0015). What it does: `docs/UX-SPEC.md`. How it got here: `docs/research/findings-0-first-pass.md`, a pass per round of Sean's feedback, the newest at the bottom, and `docs/research/findings-friends-1.md`. What Sean has decided or kept is recorded where it applies (`docs/DESIGN-SYSTEM.md`, `docs/UX-SPEC.md`); don't reopen it unasked.

## Pick up here

Kept current at every save and tidy (the `save` skill); history goes in the findings log.

1. **Open with Sean** (`docs/research/findings-0-first-pass.md`, fifty-second and fifty-third passes):
   - The sketchbook is live on `/about` with his tuning (v1), reached from the footer, 93 sketches in three rounds and 17 effects (the fifty-third pass); it is tuned in `/dev/sketchbook-lab`.
   - R6 is the mark, live as a trial (`1fa40fa` reverts it); its small circle's mint is the one color in it that is not a token.
   - Feedback: undecided; the fiftieth pass lists the ways (a prefilled email, a form service, a function of ours), each wanting `hello@bigsmall.work` first.
   - Umami, counting since 2026-10-15: his own visit in Realtime, two devices as two visitors with the right countries, his own visits left out (`docs/DEPLOYMENT.md`, "Analytics"; an iPhone opt-out link to offer).
2. **Next, toward v1** (`docs/PLAN.md` §13): the SEO pair pages, in v1 on `bigsmall.work`, the domain for good (Sean, 2026-10-15): plan them, then build; Lighthouse budgets (milestone 5); the manual passes once, just before launch (`docs/TESTING.md`, "Before launch"): VoiceOver on Sean's iPhone and NVDA from a checklist to write, the keyboard and zoom passes scripted.
3. **Then the accuracy audit** of every conversion and calculation (`docs/PLAN.md` §11), after the rest of this list (Sean, 2026-10-15).
4. **Friends** try the live site when they like; Sean relays their notes as they come (2026-10-15).
5. **Later.** The hygiene backlog and the explorations in `docs/PLAN.md` §2 (favorites, multiples, pace, typing fractions and feet and inches, keeping the math, choosing the sort, templates of settings, every category at once, search); the five-person test once there is traction.

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

## Working habits

How work is checked, not limits on what to try: labs, trials, and experiments stay welcome (Sean, 2026-10-15).

- **Verify on the built site.** Motion, CSS, and anything the minifier rewrites are checked on `pnpm build` and its preview, not only the dev server.
- **Measure, never count.** Decide and test by a box's measured size and each theme's fonts, never a character count, a breakpoint standing in for width, or a number tuned to one machine.
- **Commit on the gate's exit status.** `pnpm check && git commit …`, never `;` (the `ship` skill).

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
- **Ship:** the `ship` skill (`.claude/skills/ship/`): commit only when `pnpm check` passes (`pnpm check && git commit …`, never `;`), push to `main`, and watch CI, which must pass before Vercel promotes the build to `bigsmall.work` (`docs/DEPLOYMENT.md`).
- **Save:** the `save` skill (`.claude/skills/save/`), when Sean says "do a save" or starts a fresh session: his pending notes and their plans into the findings log, "Pick up here" brought up to date, then ship and stop.
- **Retire a lab:** once its answer ships or a later round replaces it, and with Sean's go: take screenshots of its key states into `docs/research/labs/<lab>/`; add its entry to the retired labs index (`docs/research/labs/README.md`): what it explored, what was decided (with the ADR), what was left out and why, its learnings, its screenshots, and the last commit where it lived, so it can be brought back from git; mark its research doc retired with that commit; then remove its page and parts, and its rows in `ARCHITECTURE.md`, `DESIGN-SYSTEM.md`, `TESTING.md`, and the smoke test. No browsable copy is kept (Sean, 2026-10-14).
- **Tidy up:** the `/tidy` skill (`.claude/skills/tidy/`) audits what changed since the last tidy, an area, or the whole system (`/tidy full`) against the design system and the docs, fixes what is mechanical, and brings look, behavior, and token changes to Sean. Offer it after a lab or a feature lands; run it when asked.

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`. Optional scope: `feat(core): add dry volume units`. Keep commits small and focused. Run `pnpm check` before committing.
