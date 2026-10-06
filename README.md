# bigsmall

A unit converter that gets out of your way. Type a number, a unit, or both into either box and bigsmall figures out the rest.

**Status:** planning. No application code yet. Start with [docs/PLAN.md](docs/PLAN.md).

## Why

The existing converters have the math right and the experience wrong: dense pages, two scrolling list boxes, a "Convert" button, and little thought for phones. bigsmall keeps the math and rebuilds the experience. One smart field per side, results as you type, a keypad for touch, basic units by default with advanced ones a keystroke away, and themes that feel like somewhere.

## Principles

1. **Fast on any device.** Static site, small JS, no backend. Budgets are enforced in CI.
2. **Accessible by default.** WCAG 2.2 AA, keyboard-complete, screen-reader-announced results, in every theme.
3. **Correct and sourced.** Every conversion factor cites a standards body (NIST or BIPM). Golden tests guard them.
4. **Original.** Our own code, taxonomy, copy, and UI. Other sites inform coverage only. See [ADR 0004](docs/decisions/0004-originality-and-sources.md).
5. **Systemized.** Tokens over one-off values, shared components over one-off markup, recorded decisions over tribal knowledge.

## Docs

| Doc | What it holds |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Vision, scope, architecture, stack, milestones, setup checklist, open decisions |
| [docs/UX-SPEC.md](docs/UX-SPEC.md) | Exact behavior of the smart input, two-box linkage, keypad, and modes |
| [docs/UNITS-CATALOG.md](docs/UNITS-CATALOG.md) | Category taxonomy, tiers, special-logic units, verification sources |
| [docs/decisions/](docs/decisions/README.md) | Architecture Decision Records (ADRs) |
| [docs/LEARNINGS.md](docs/LEARNINGS.md) | Running log of gotchas and best practices discovered while building |
| [CLAUDE.md](CLAUDE.md) | Working conventions for AI-assisted sessions |

Docs that arrive with the scaffold: `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md`, `docs/THEMING.md`, `docs/TESTING.md`.
