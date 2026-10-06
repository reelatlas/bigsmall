# CLAUDE.md — working conventions for bigsmall

Read this first in every session. Then read `docs/PLAN.md` for context and `docs/LEARNINGS.md` for known gotchas.

## The project in one paragraph

bigsmall is a static, client-side unit converter: web first, responsive, installable as a PWA later. Two smart inputs sit side by side. The user types a number and/or a unit into either one and the other updates live. There is no database and no server. The conversion engine is pure TypeScript in `packages/core`; the UI lives in `apps/web`. Details in `docs/PLAN.md`.

## Current status

Planning phase. The stack is proposed in ADR 0002 and has not been scaffolded. Do not scaffold until the stack is confirmed and Node/pnpm are installed on the machine.

## Non-negotiables

1. **Originality.** Never copy text, code, markup, styles, unit descriptions, or taxonomy from other converter sites. Conversion factors come from NIST / BIPM sources and every unit cites one. (ADR 0004)
2. **Core/UI boundary.** `packages/core` has zero runtime dependencies and never imports from the DOM, React, or `apps/web`. The UI never contains conversion math. (ADR 0003)
3. **No one-off values.** Colors, spacing, radii, type, and motion come from semantic design tokens. No raw hex or px values inside components. A new visual need means a new token, documented in `docs/DESIGN-SYSTEM.md`.
4. **No one-off components.** Before writing UI, check `apps/web/src/components`. Extend an existing component rather than forking it.
5. **Accessibility is a requirement.** Every interactive component is keyboard-operable, has visible focus, is labelled, has a 44px touch target, works at 400% zoom, and respects `prefers-reduced-motion`. Every theme passes contrast checks.
6. **Budgets are tests.** Bundle size, Lighthouse scores, and axe checks run in CI and fail the build when they regress.
7. **Behavior is specified before it is built.** A change to UI behavior updates `docs/UX-SPEC.md` in the same change.
8. **Decisions are recorded.** Anything you would have to explain twice becomes an ADR in `docs/decisions/`.
9. **Learnings are logged.** A gotcha, workaround, or best practice discovered during work gets a dated entry in `docs/LEARNINGS.md` in the same change.

## Adding a unit (once core exists)

1. Add it to the category file in `packages/core/src/units/<category>.ts` with `source` and `exact` fields.
2. Add the aliases people actually type: plurals, symbols, regional spellings, common misspellings.
3. Add a golden test row taken from the cited source.
4. Run the core test suite.

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `a11y:`. Optional scope: `feat(core): add dry volume units`. Keep commits small and focused.

## Commands

Filled in when the project is scaffolded.
