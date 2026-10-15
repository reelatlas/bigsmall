---
name: tidy
description: Tidy pass for bigsmall after a lab, a feature, or a stretch without one. Audits what changed (or the whole system) against the design system, the architecture, and the docs; fixes what is mechanical (dead code, duplicated class lists, one-off components, stale docs, missing gallery samples and inventory rows); brings anything that would change a look, a behavior, or a token to Sean with a recommendation; records learnings in the right docs; then ships. Use when Sean asks to tidy, clean up, systemize, check hygiene, or get ready to launch, or types /tidy. After a lab or a feature lands, offer it rather than running it unasked.
argument-hint: '[empty: since the last tidy | an area or path | full]'
---

# Tidy

A tidy pass leaves the system easier to build on than it found it: every shared shape in one place, every value from a token, every component in the gallery, every behavior in the spec, every surprise in the learnings, and nothing dead. A tidy changes no look and no behavior by itself. Those go to Sean.

Requested scope: `$ARGUMENTS`

## 1. Find the scope

- **Empty**: everything since the last tidy. The base is the newest commit with the `(tidy)` scope (`git log --grep='(tidy)' -1 --format=%H`), or the `v0.1.0` tag if there is none. List what changed: `git diff --stat <base>..HEAD`, plus the working tree.
- **An area** (a feature, a lab, a component, a doc, or a path such as `apps/web/src/features/converter`): that area, and everything that imports it or documents it.
- **`full`**: the whole system: `packages/core/src`, `apps/web/src`, `apps/web/e2e`, `apps/web/test`, `docs`, `CLAUDE.md`.

Say the scope in one line before starting, so Sean can correct it.

## 2. Read the system first

The system's own docs are the yardstick, so read them before judging anything: `CLAUDE.md` (the non-negotiables), `docs/DESIGN-SYSTEM.md` (recipes, patterns, inventory, gallery), `docs/ARCHITECTURE.md` (file tables, conventions), the `docs/UX-SPEC.md` sections the scope touches, and the newest entries of `docs/LEARNINGS.md` plus any that name the scope's files. For the `full` scope, read all of `docs/`.

## 3. Audit

1. Run the gates: `pnpm check` (lint with the token guard, format, types, unit tests, build, bundle budget), and the browser suite for a baseline. A failure here is the first finding.
   For the `full` scope, the audit can fan out to read-only reviewers in parallel, one per area (tokens, recipes, and components; behavior against the spec; dead code and stale comments; tests; docs and skills), each reporting `file:line` findings sorted as in step 4. Check each finding by reading before acting on it; a reviewer's claim is a candidate, not a fact.
2. Walk [checklist.md](checklist.md) over every file in scope: tokens and values, recipes, components and variants, type, layout, behavior and keys, accessibility, copy, dead code, tests, and docs. Look with the searches it gives, then read the files; a search finds candidates, reading decides.
3. Note each finding with `file:line`, what is off, and the rule it breaks (a `CLAUDE.md` rule, a `DESIGN-SYSTEM.md` pattern, an ADR, a learning).

## 4. Sort every finding

- **Fix now**: mechanical, with no change to how anything looks or behaves. Dead code; a stale comment, docblock, or doc row; a class list repeated in two files becoming a recipe with identical output; a one-off component moving into `components/` unchanged; a missing gallery sample, inventory row, test, or learning; a test asserting one tool's text or one machine's font.
- **Ask Sean**: anything that changes a look, a behavior, or the token set. A value no token expresses (recommend reusing token X, or adding token Y to every theme); a new variant that looks different; an inconsistency between similar controls or states (two menus, a control with and without a unit in the box); retiring a lab or a doc; a new dependency. One line each, the recommendation first, then the alternative, in plain terms. Never decide these quietly.
- **Later**: a real improvement too big for this pass. Write it into `docs/PLAN.md` (§2 explorations, or the milestone it belongs to) with enough context to pick up cold.

## 5. Fix

- Small commits, one kind of change each, with the `tidy` scope: `refactor(tidy): one recipe for the menu trigger`, `docs(tidy): …`, `test(tidy): …`, `chore(tidy): …`. The newest one marks the base for the next tidy.
- A visible change is never a side effect. If Sean approves one, it goes in a commit of its own, so rolling it back is one revert, and the report says so.
- When a fix extends the system (a new recipe, component, variant, or token), document it where that kind of thing is documented (step 7) in the same commit.
- Commit only on `pnpm check`'s exit status (`pnpm check && git commit …`), never chained with `;` (the ship skill).
- After a rename, search the old name everywhere it can hide: code, docblocks, e2e variable names, test titles, docs, and the findings log's open rows.

## 6. Verify

- `pnpm check` passes.
- The browser suite passes: `pnpm e2e`. Astro allows one dev server per project; if Sean's dev server holds it, never stop it: build (`pnpm build`) and run the suite against `astro preview` on port 4322 with a Playwright config in the scratchpad (`baseURL` and `webServer` at 4322, `reuseExistingServer`, the `en-US` locale), as the ship skill says. A test that blocks the island must block its chunk in a build too (`/Converter[\w.-]*\.(tsx|js)/`), or it passes trivially there.
- Motion and CSS values count only on the built site (the minifier writes 400ms as .4s): read them through `cssTime`, and sample frames rather than trusting one read.
- For anything visual, take screenshots in a background browser (headless Playwright against the running server), at a phone width and a wide one, in more than one theme. Never drive the tab Sean is looking at.

## 7. Record, each kind of note in its home

| Note                                                     | Home                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| What the converter does                                  | `docs/UX-SPEC.md` (planned work in §14)                                                                                                           |
| How things look and are built: tokens, recipes, patterns | `docs/DESIGN-SYSTEM.md`, and its inventory row for each component                                                                                 |
| Where code lives, conventions                            | `docs/ARCHITECTURE.md`                                                                                                                            |
| What is tested where                                     | `docs/TESTING.md`                                                                                                                                 |
| A decision anyone would explain twice                    | A new ADR in `docs/decisions/` and its index row; a replaced ADR gets a status line note                                                          |
| A gotcha, a workaround, a best practice found            | A dated entry at the bottom of `docs/LEARNINGS.md`                                                                                                |
| Sean's feedback and what changed for it                  | `docs/research/findings-0-first-pass.md`, a section per pass; this pass as "Tidy pass, …"                                                         |
| Plans, explorations, milestones                          | `docs/PLAN.md`                                                                                                                                    |
| Where things stand                                       | `CLAUDE.md`'s "Current status", short, and its "Pick up here" list: trials with their reverting commits, questions open with Sean, the next build |
| A rule that keeps coming back                            | Promoted from `LEARNINGS.md` into `CLAUDE.md` or an ADR, linked back                                                                              |

Docs point to each other rather than repeating: a rule lives in one file and the others link to it.

## 8. Report to Sean

Short, plain, and in this order:

1. **Fixed**: by area, one line each, with what it makes easier.
2. **Your call**: each finding that needs Sean, the recommendation first, one line each.
3. **Logged for later**: what went into `docs/PLAN.md`, one line each.
4. **Checks**: what passed (gates, browser suite, CI) and anything skipped, said plainly.

## 9. Ship

Use the ship skill: push the commits to `main` and watch CI, as every change to bigsmall ships (`CLAUDE.md`, "Ship"), unless Sean asked to hold. Report the outcome.
