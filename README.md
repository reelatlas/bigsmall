# bigsmall

An efficient unit converter. Type a number, a unit, or both into one box and see it in every unit of its category at once, in a table that is also where units are picked. Live at [bigsmall.work](https://bigsmall.work).

**Status:** milestones 0 to 2 are done, and milestone 3, the complete converter, is under way. Where things stand: [CLAUDE.md](CLAUDE.md), "Current status"; the milestones: [docs/PLAN.md](docs/PLAN.md) §13.

## Why

The existing converters have the math right and the experience wrong: dense pages, two scrolling list boxes, a "Convert" button, and little thought for phones. bigsmall keeps the math and rebuilds the experience: one box, its value in every unit of its category as you type, units picked from the table itself, a calculator for anyone who would rather tap, and themes that feel like somewhere.

## Principles

1. **Fast on any device.** Static site, small JS, no backend. Budgets are enforced in CI.
2. **Accessible by default.** WCAG 2.2 AA, keyboard-complete, screen-reader-announced results, in every theme.
3. **Correct and sourced.** Every unit cites the standard that defines it ([docs/UNITS-CATALOG.md](docs/UNITS-CATALOG.md) §2), checked on our own; golden tests guard them.
4. **Our own.** Our own concept, UX, design, and code. Other converters are references we use freely, and every number is checked on our own. See [ADR 0020](docs/decisions/0020-references-and-our-own-checks.md).
5. **Systemized.** Tokens over one-off values, shared components over one-off markup, recorded decisions over tribal knowledge.

## Run it

```bash
pnpm install
```

```bash
pnpm dev
```

`pnpm check` runs what CI's verify job runs; `pnpm e2e` runs the browser and accessibility suite. All commands are in [CLAUDE.md](CLAUDE.md).

## Docs

| Doc                                            | What it holds                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                         | Working conventions, non-negotiables, commands, and the current status          |
| [docs/PLAN.md](docs/PLAN.md)                   | Vision, scope, stack, milestones, budgets, setup checklist, open questions      |
| [docs/UX-SPEC.md](docs/UX-SPEC.md)             | Exact current behavior of the converter, plus what is planned                   |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)   | How the code is organized, what each module does, how data flows                |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, the Tailwind bridge, component rules, patterns, and the inventory       |
| [docs/THEMING.md](docs/THEMING.md)             | How themes work and how to author one                                           |
| [docs/UNITS-CATALOG.md](docs/UNITS-CATALOG.md) | Category taxonomy, tiers, special-logic units, sources, and how to add a unit   |
| [docs/TESTING.md](docs/TESTING.md)             | The test layers, what each covers, and the commands                             |
| [docs/LEARNINGS.md](docs/LEARNINGS.md)         | Dated log of gotchas and practices found while building                         |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)       | Hosting, domains, CI's checks, and analytics                                    |
| [docs/decisions/](docs/decisions/README.md)    | Architecture Decision Records (ADRs)                                            |
| [docs/research/](docs/research/)               | Lab write-ups, the retired labs index, feedback logs, the usability test script |
