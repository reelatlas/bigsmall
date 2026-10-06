# 0003 — Hard boundary between core engine and UI

Date: 2026-10-06
Status: accepted

## Context

The conversion logic (units, factors, parsing, search, formatting) is the durable asset. The UI will change often, may be re-themed many times, and may someday be wrapped as a native app. Logic that leaks into components becomes impossible to test in isolation and impossible to reuse.

## Decision

`packages/core` is a standalone TypeScript package with zero runtime dependencies. It never imports from the DOM, React, Astro, or `apps/web`. It exposes a small API: `convert`, `parse`, `search`, `format`, and the unit/category registries. `apps/web` consumes that API and contains no conversion math, no unit data, and no matching logic.

Enforced by the pnpm workspace (separate package), by `tsconfig` with no DOM lib in core, and by ESLint import restrictions in both directions.

## Alternatives considered

- **Single package with a `src/core` folder.** Easier to start, but the boundary is a convention rather than a wall and erodes under pressure.
- **Logic inside React hooks.** Fast to write, untestable without a DOM, unusable outside React.

## Consequences

- Core tests run in milliseconds with no browser.
- A future native app, CLI, or API can reuse core unchanged.
- Adding a unit never touches the UI; adding a UI feature never touches a factor.
- Slightly more setup at scaffold time (two `package.json` files, workspace config).
