# 0005 — Toolchain versions: latest where compatible, never at the cost of accessibility tooling

Date: 2026-10-06
Status: accepted

## Context

The first install pulled the newest major of everything: TypeScript 7, ESLint 10, and current plugins. TypeScript 7 no longer ships the JavaScript compiler API that typescript-eslint and Astro's type checker load. ESLint 10 is required by the Astro lint plugin but not yet declared by the JSX accessibility plugin. Direction from Sean: modern and up to date wherever we can, accessible always.

## Decision

1. Use the newest major of every tool whose peer requirements are satisfied, verified by `pnpm peers check` returning clean.
2. When a tool and its ecosystem disagree, keep the tool that enforces accessibility or correctness and pin the other to the newest compatible version. Record every pin or override with its reason in `pnpm-workspace.yaml` or the package manifest, and in `docs/LEARNINGS.md`.
3. TypeScript stays on 6.x until typescript-eslint and @astrojs/check support 7. The config is kept free of options TypeScript 7 removes, so the bump is a one-line change.
4. Review pins at the start of each milestone: `pnpm outdated`, then the peer ranges of the tools that pin us.

## Alternatives considered

- **Run undeclared peer combinations silently.** Rejected: CI would break on an unrelated patch release and nobody would know why.
- **Drop the JSX accessibility lint to simplify.** Rejected: it catches problems before a browser test ever runs.
- **Stay on ESLint 9 to satisfy the accessibility plugin.** Rejected: the Astro plugin requires 10, and 9 is marked deprecated on npm.

## Consequences

- `pnpm peers check` is clean and stays clean. A new warning is a review item, not background noise.
- One documented override today (jsx-a11y accepting ESLint 10) and one deliberate pin (TypeScript 6).
- Upgrades happen at milestone boundaries as routine work instead of mid-feature surprises.
