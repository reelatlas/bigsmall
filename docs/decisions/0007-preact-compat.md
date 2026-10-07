# 0007 — The island runs on Preact through preact/compat

Date: 2026-10-06
Status: accepted

## Context

After the calculator, arithmetic, and the wordmark at play, the converter page shipped 89.2 KB of its 90 KB gzipped JavaScript budget. React's runtime was 67.7 KB of it (the renderer chunk, `react`, and `react-dom`). The owner's next requests (a richer wordmark, theme decoration) and milestone 3 did not fit, and the product is meant to grow through many more formulas and units. The owner asked whether Preact is the best bet when everyone uses React, and noted that a little performance could be traded for an atmosphere no other converter has.

ADR 0002 chose React for React Aria and kept Preact as "an optimization lever". ADR 0006 removed React Aria, so nothing left depends on React itself. A spike on a separate branch measured the switch before it was decided:

| Converter page, gzipped           | React 19.3 | Preact 10.29 + compat |
| --------------------------------- | ---------: | --------------------: |
| JavaScript                        |    89.2 KB |               33.9 KB |
| JavaScript, raw (to parse)        |   275.6 KB |               88.4 KB |
| Framework share                   |    67.7 KB |     about 9 KB in all |
| Ready to type, CPU slowed 6×, p50 |     444 ms |                317 ms |

Every check passed on Preact: lint, types, 664 unit tests, and the browser suite (97 passed, 7 skipped) four times over.

## Decision

Run the island on Preact 10 through `@astrojs/preact` with `compat: true`. Components keep the React API and keep importing from `'react'`: Vite aliases `react` and `react-dom` to `preact/compat`, and `tsconfig.json` maps their types the same way. The JavaScript budget stays at 90 KB, so the room won goes to the product (the wordmark, theme decoration, formulas and units) rather than to the framework.

## Alternatives considered

- **Keep React and raise the budget** (to about 120 KB). No migration, but every visitor downloads and runs about 55 KB more before the converter answers, and the cost grows with every feature.
- **Keep React at 90 KB.** Nothing more fits; the wordmark work was 3.4 KB over on its own.
- **Preact 11.** npm's latest, and its compat accepts a server snapshot, but `@astrojs/preact` declares support for Preact 10 only (ADR 0005: newest majors whose peers are satisfied). Revisit when the integration supports it.
- **Solid or Svelte.** Smaller still, but a rewrite of every component and the loss of the React API that most help and examples assume.

## Consequences

- The page has about 56 KB of headroom under the same gate. `pnpm bundle:check` still fails CI above 90 KB.
- Writing components does not change: hooks, JSX, `createPortal`, and `useSyncExternalStore` come from `'react'` as before. Switching back is the integration, the tsconfig paths, and the dependencies; the source fixes below are valid React too.
- Five compat differences shaped the code, each logged in docs/LEARNINGS.md:
  - compat's `useSyncExternalStore` ignores the server snapshot, so `useIsHydrated` (lib/hydrated.ts) is a store per component that turns true when first subscribed, after the first commit; `useSlot` builds on it.
  - Preact runs plain effects after paint, a frame later than React does for a click or key press. Work that must happen before the next key (focus moving into the calculator on open, key listeners that hold the latest entry) runs in layout effects.
  - Preact drops a camelCase attribute set to `false` when it is not a DOM property (`spellCheck`), so such attributes use the DOM name (`spellcheck`).
  - compat types `event.target` as a plain `EventTarget`; an element's own events read `event.currentTarget`.
  - Preact does not warn about hydration mismatches. The first client render must match the server's: browser-only values wait for `useIsHydrated`.
- A library that needs React itself would not work. None is in use; a new UI dependency is checked against compat first.
- ADR 0002 stands otherwise; its React row is superseded by this decision.
