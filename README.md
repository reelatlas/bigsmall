# bigsmall

A unit converter that gets out of your way. Type a number, a unit, or both into either box and bigsmall figures out the rest.

**Status:** milestones 0 (setup) and 1 (core engine) are done, and the code of milestone 2 (the smart input) is done; it closes with a five-person usability test. See [docs/PLAN.md](docs/PLAN.md) §13.

## Why

The existing converters have the math right and the experience wrong: dense pages, two scrolling list boxes, a "Convert" button, and little thought for phones. bigsmall keeps the math and rebuilds the experience. One smart field per side, results as you type, basic units by default with advanced ones a keystroke away, a calculator for anyone who would rather tap, and themes that feel like somewhere.

## Principles

1. **Fast on any device.** Static site, small JS, no backend. Budgets are enforced in CI.
2. **Accessible by default.** WCAG 2.2 AA, keyboard-complete, screen-reader-announced results, in every theme.
3. **Correct and sourced.** Every conversion factor cites a standards body (NIST or BIPM). Golden tests guard them.
4. **Original.** Our own code, taxonomy, copy, and UI. Other sites inform coverage only. See [ADR 0004](docs/decisions/0004-originality-and-sources.md).
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

| Doc                                            | What it holds                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                         | Working conventions, non-negotiables, commands, and the current status        |
| [docs/PLAN.md](docs/PLAN.md)                   | Vision, scope, stack, milestones, budgets, setup checklist, open questions    |
| [docs/UX-SPEC.md](docs/UX-SPEC.md)             | Exact current behavior of the converter, plus what is planned                 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)   | How the code is organized, what each module does, how data flows              |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, the Tailwind bridge, component rules, patterns, and the inventory     |
| [docs/THEMING.md](docs/THEMING.md)             | How themes work and how to author one                                         |
| [docs/UNITS-CATALOG.md](docs/UNITS-CATALOG.md) | Category taxonomy, tiers, special-logic units, sources, and how to add a unit |
| [docs/TESTING.md](docs/TESTING.md)             | The test layers, what each covers, and the commands                           |
| [docs/LEARNINGS.md](docs/LEARNINGS.md)         | Dated log of gotchas and practices found while building                       |
| [docs/decisions/](docs/decisions/README.md)    | Architecture Decision Records (ADRs)                                          |
| [docs/research/](docs/research/)               | Usability test scripts and findings                                           |
