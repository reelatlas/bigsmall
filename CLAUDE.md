# CLAUDE.md — working conventions for bigsmall

Read this first in every session, "Pick up here" above all. Then `docs/PLAN.md` for context, `docs/LEARNINGS.md`'s topic index for known gotchas (and the entries touching your files), `docs/ARCHITECTURE.md` before touching code, `docs/DEPLOYMENT.md` before anything about hosting or domains, `docs/SEO.md` before adding a page, and `docs/RESEARCH.md` before sourcing a figure or a fact.

## The project in one paragraph

bigsmall is a static, client-side unit converter: web first, responsive, installable as a PWA later. The user types a number, a unit, or both into one box and sees the value in every unit of its category in a table under it, which is also where units are picked (ADR 0012, ADR 0013). There is no database and no server. The conversion engine is pure TypeScript in `packages/core`; the UI is an Astro site in `apps/web` whose islands are written against the React API and run on Preact through `preact/compat` (ADR 0007). Details in `docs/PLAN.md`.

## Current status (2026-10-16)

- **Where it stands.** Milestones 0 (setup), 1 (core engine), and 2 (smart input) are complete; milestone 3, the complete converter, is under way (`docs/PLAN.md` §13). Milestone 2's five-person usability test is set aside until the product gains traction; friends' feedback rounds give the signal for now (`docs/research/usability-test-1.md`).
- **Live.** `https://bigsmall.work` on Vercel since 2026-10-07 (`v0.1.0`, ADR 0008); `bigsmall.diy` and both `www` names redirect to it. Every push to `main` that passes CI deploys; the two CI jobs are Vercel's Deployment Checks (`docs/DEPLOYMENT.md`). Besides the converter, an About page holds the logo sketchbook, every formula, and the feedback form, which posts to Formspark (ADR 0024, 2026-10-17), reached from the footer. Every factor was checked blind against its standard on 2026-10-15, 130 of 131 agreeing, Force and Torque's 14 the same day, and the paces on 2026-10-16, all agreeing (`docs/research/accuracy-audit-1.md`); Cooking's 34 ingredients are decided by one written rule from every checked weighing and held to USDA's own cups by a test (`docs/research/cooking-2.md`); the method, by the kind of fact, is `docs/RESEARCH.md` (ADR 0022).
- **The converter.** One box and its table, the table being the unit list (ADR 0012, ADR 0013), over sixteen categories with every unit listed (ADR 0016; `docs/UNITS-CATALOG.md` §3), in sections by system, the visitor's own first (ADR 0011), Speed's paces and Temperature's change in sections of their own, and Cooking, by ingredient, a second pill in the box (ADR 0021). The toolbar holds the category menu, the calculator, and Settings as two side panels, Units and Display, remembered in this browser (ADR 0018), then undo, redo, and clear all, on one row: a touch screen scrolls it where it lacks room, a pointer gets More (ADR 0023). The arrows move across the page's planes and stop at its ends (ADR 0014); on a touch screen the keyboard comes up only from the box (ADR 0015). What it does: `docs/UX-SPEC.md`. How it got here: `docs/research/findings-0-first-pass.md`, a pass per round of Sean's feedback, the newest at the bottom, and `docs/research/findings-friends-1.md`. What Sean has decided or kept is recorded where it applies (`docs/DESIGN-SYSTEM.md`, `docs/UX-SPEC.md`); don't reopen it unasked.

## Pick up here

Kept current at every save and tidy (the `save` skill); history goes in the findings log.

1. **Next:** Sean's calls below; then the full tidy he asked for (`/tidy full`, system-wide consistencies in designs, components, styles, formats, and logic, the tidy skill itself and earlier decisions open to revision); then Search Console and Bing at his screen, and a text record at Porkbun (`docs/SEO.md` §3). The sixty-eighth to seventy-second passes have the context.
   - **His call: the header on a phone** (the seventy-second pass): keep the two lines, move Copy URL into the converter's toolbar so the header fits one line from 352 px windows (recommended), or step the name down between 352 and 416 px.
   - **Formspark, at his screen:** Allowed domains set to `bigsmall.work`; then one real message from bigsmall.work/about to see it arrive (`docs/DEPLOYMENT.md`, "Feedback"). The feedback form is live (`56a644f`, ADR 0024).
   - **The privacy line** on About, his words to approve: "Visits are counted anonymously, without cookies, with Umami. Feedback goes through Formspark to our inbox; the site keeps nothing."
   - **For the tidy:** a gallery sample of the text fields (`TEXT_INPUT`, `TEXT_AREA`); one hook for what the category menu and More share (opening, closing, the keys).
   - **Settled** (2026-10-17): the sketchbook's effects (`f3e8ee2`: Glitch clipped, Blur, the turns, Flap, and Squash reaching into the gap) and Cooking's line, the measuring convention alone (`8e7696a`). The figures are decided by the written rule and checked against USDA's cups by a test (`docs/research/cooking-2.md`; `docs/RESEARCH.md`, ADR 0022, the `research` skill); six rest on fewer than three weighings and wait for a new source or a weighing by the protocol there.
2. **Open with Sean:** the SEO plan's other decisions ("bigsmall SEO plan", https://claude.ai/artifact/7eXfYjEdTn4zKXXGLug3pT); the toolbar's row was decided from a mock ("bigsmall toolbar mock", https://claude.ai/artifact/9jRbBK7i8DS2AtjqEBr9wA, 2026-10-17). Trials: R6 as the mark (`1fa40fa`); the ingredient's pill was kept on 2026-10-17. Umami's checks (`docs/DEPLOYMENT.md`, "Analytics").
3. **Then, toward v1** (`docs/PLAN.md` §13): the SEO pair pages built and launched (`docs/SEO.md`), in v1 on `bigsmall.work`; Lighthouse budgets (milestone 5); the manual passes once, just before launch (`docs/TESTING.md`, "Before launch"): VoiceOver on Sean's iPhone and NVDA from a checklist to write, the keyboard and zoom passes scripted.
4. **Friends** try the live site when they like; Sean relays their notes as they come (2026-10-15).
5. **Later.** The hygiene backlog and the explorations in `docs/PLAN.md` §2 (favorites, multiples, pace, typing fractions and feet and inches, keeping the math, choosing the sort, templates of settings, every category at once, search); the five-person test once there is traction.

## Non-negotiables

1. **Our own product, every number checked.** Other converter sites are references, used freely: our units, names, grouping, and wording may match theirs, word for word. The concept, UX, design, and code are ours. Every factor and formula is checked on our own against the standard that defines it (NIST / BIPM first), wherever it was found, and every unit cites that standard (ADR 0020). A fact no standard defines (a cup of flour) is decided by the written rule in `docs/RESEARCH.md`, by the fact's kind, and held to its sources by a test (ADR 0022).
2. **Core/UI boundary.** `packages/core` has zero runtime dependencies and never imports from the DOM, React or Preact, Astro, or `apps/web`. The UI never contains conversion math and imports only from `@bigsmall/core`. (ADR 0003)
3. **No one-off values.** Colors, type, radii, shadows, and motion come from semantic tokens through the Tailwind bridge (`bg-canvas`, `text-ink`, `rounded-md`...). No raw hex, rgb, px radii, or literal durations inside components. A new visual need means a new token in every theme, documented in `docs/DESIGN-SYSTEM.md`. `pnpm lint` runs a token guard that rejects raw values; when it flags one, use an existing token or bring the proposed new token to Sean in chat first.
4. **No one-off components.** Check `apps/web/src/components` first. Extend rather than fork. Every component appears in `/dev/gallery`.
5. **TSX for interaction, Astro for structure.** Anything the user interacts with is a TSX component written against the React API (imports from `'react'`), which runs on Preact through `preact/compat` (ADR 0007): work that must happen before the next key goes in a layout effect, and the first client render matches the server's. Astro files only scaffold pages and static content. Exceptions: the header menus (theme picker, keyboard shortcuts map) are plain HTML driven by the inline script in `Base.astro`, so they work before any bundle loads and add none (ADR 0002, re-examination), and so are the page's toolbars and the arrows between its planes (ADR 0014); and the wordmark at play is an Astro `<script>` (`lib/wordmark-motion.ts`) that loads with the page and runs only once the heading is hovered or tapped.
6. **Accessibility is a requirement.** Keyboard-operable, visible focus, labelled, 44 px targets, works at 320 px and 400 % zoom, respects reduced motion. Every theme passes the contrast test. Playwright runs axe on every page, the converter in every theme, and a keyboard walk checks that every Tab stop shows focus.
7. **Budgets are tests.** Lint, format, types, unit tests, build, the bundle budget, the SEO contract (`docs/SEO.md`), and the browser suite all gate CI. Lighthouse budgets join at milestone 5.
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
pnpm check          # lint + format check + typecheck + test + build + bundle check + SEO contract: CI's verify job
pnpm --filter @bigsmall/web brand   # redraw the icons and the link preview image from the Daylight tokens
```

## Recipes

- **Add a unit:** `packages/core/src/units/<category>.ts` with `source` and `exact`; add the aliases people type; add a golden row in `packages/core/test/golden/`; run `pnpm test`. Details in `docs/UNITS-CATALOG.md` §6.
- **Research a figure or a category:** the `research` skill (`.claude/skills/research/`): the fact's kind first (defined, measured, conventional), then gather, screen, decide by the rule, check, test, and record (`docs/RESEARCH.md`, ADR 0022); Cooking's figures are the worked example (`docs/research/cooking-2.md`). An outside suggestion of sources, or a visitor's report that a figure is wrong, goes through it as a lead.
- **Add a component:** `docs/DESIGN-SYSTEM.md` "Adding a component".
- **Add a theme:** `docs/THEMING.md` "Authoring a theme".
- **Add a page:** `apps/web/src/pages/`, use `layouts/Base.astro` with `components/PageHeader.astro` (a `/dev` page uses `layouts/DevPage.astro`, which also keeps it out of search), islands only where there is real interaction; a title and a description of its own, and the rest of `docs/SEO.md`'s contract, which `pnpm check` holds every page in the sitemap to.
- **Add a keyboard shortcut:** handle the key in code, add it to `apps/web/src/lib/shortcuts.ts` (the shortcuts map renders from it), and describe it in `docs/UX-SPEC.md` §8.
- **Add a header menu:** reuse the shell controller in `layouts/Base.astro` (`data-shell`, `data-shell-toggle`) and the shell recipes in `src/lib/recipes.ts`, and place it in `components/HeaderMenus.astro`; its trigger carries `data-tool`, so the header's toolbar reaches it (ADR 0014). No new script.
- **Add a UI delay:** a named constant in `apps/web/src/lib/timing.ts`, never a literal number of milliseconds.
- **Change the icon or the link preview:** edit the mark in `apps/web/scripts/brand-assets.mjs` (or the name or description in `src/lib/site.ts`), run the `brand` command, and commit what it writes to `apps/web/public/`.
- **Ship:** the `ship` skill (`.claude/skills/ship/`): commit on the gate's exit status (Working habits), push to `main`, and watch CI, which must pass before Vercel promotes the build to `bigsmall.work` (`docs/DEPLOYMENT.md`).
- **Save:** the `save` skill (`.claude/skills/save/`), when Sean says "do a save" or starts a fresh session: his pending notes and their plans into the findings log, "Pick up here" brought up to date, then ship and stop.
- **Retire a lab:** once its answer ships or a later round replaces it, and with Sean's go: take screenshots of its key states into `docs/research/labs/<lab>/`; add its entry to the retired labs index (`docs/research/labs/README.md`): what it explored, what was decided (with the ADR), what was left out and why, its learnings, its screenshots, and the last commit where it lived, so it can be brought back from git; mark its research doc retired with that commit; then remove its page and parts, and its rows in `ARCHITECTURE.md`, `DESIGN-SYSTEM.md`, `TESTING.md`, and the smoke test. No browsable copy is kept (Sean, 2026-10-14).
- **Tidy up:** the `/tidy` skill (`.claude/skills/tidy/`) audits what changed since the last tidy, an area, or the whole system (`/tidy full`) against the design system and the docs, fixes what is mechanical, and brings look, behavior, and token changes to Sean. Offer it after a lab or a feature lands; run it when asked.

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`, and `style:` for a visual trial, "(trial)" in its subject. Optional scope: `feat(core): add dry volume units`. Keep commits small and focused, each committed on the gate's exit status (Working habits).
