# Theming

Last updated: 2026-10-06 (milestone 0). How themes work, how to author one, and where each theme stands.

## Decision (2026-10-06)

Build the framework for all themes now so the mechanism is proven and every theme is visible in the gallery, then polish one theme at a time. Palettes exist for all six; decoration, fonts, and motion are added per theme in milestone 4.

## Mechanism

1. Each theme is a CSS file in `apps/web/src/styles/themes/<id>.css` that sets every token in the contract on `[data-theme='<id>']` and declares `color-scheme` so native controls match.
2. `daylight` also targets `:root`, so a page with no attribute is still fully styled.
3. The pre-paint script in `src/layouts/Base.astro` reads `localStorage` (`bigsmall:theme`), falls back to `prefers-color-scheme` (`midnight` for dark, `daylight` for light), and sets `data-theme` on `<html>` before the first paint. No flash.
4. The same script handles any `[data-theme-picker]` select by event delegation, so switching works before any JavaScript bundle loads and on pages with no islands.
5. Components never know which theme is active. They use semantic tokens through Tailwind utilities (docs/DESIGN-SYSTEM.md).
6. Theme ids, the storage key, and the defaults live once in `src/lib/themes.ts` and are injected into the inline script with Astro's `define:vars`.

Because custom properties cascade, any element can carry its own `data-theme`. The gallery uses this to show all six themes on one page.

## The contract

`src/lib/themes.ts` holds `TOKEN_CONTRACT` (every token a theme must define) and `CONTRAST_PAIRS` (every foreground/background pair that must meet WCAG 2.2 AA). `apps/web/test/themes.test.ts` enforces both for every theme file:

- registry and files match one to one
- the file targets its own `[data-theme]` selector and declares the registered `color-scheme`
- every token in the contract is present
- every color token is 6-digit hex (so the test can compute contrast)
- text pairs reach 4.5:1, UI pairs reach 3:1

A theme that fails any of these fails `pnpm test`, and therefore CI.

## Authoring a theme

1. Add the id to `ThemeId` and an entry to `THEMES` in `src/lib/themes.ts` (name, scheme, status, blurb).
2. Copy `daylight.css` or `midnight.css` to `themes/<id>.css`, change the selector, and set every token.
3. Run `pnpm test`. Adjust colors until every contrast pair passes. Prefer adjusting `--ink-muted`, `--accent`, and `--on-accent`; they fail most often.
4. Open `/dev/gallery` and check every component in the new card. Check the full page with the picker too, since nested cards do not show scrollbars or native controls.
5. Run `pnpm e2e` for the axe pass across themes.
6. Update the status table below.

Rules that keep themes cheap:

- Token sets are tiny and always bundled. Fonts, textures, and animations are not; they load only when their theme is active (milestone 4 mechanism).
- Default themes use system font stacks. Zero font bytes.
- Ambient motion (petals, rain) is CSS only and is disabled under `prefers-reduced-motion` through the motion tokens.
- Decoration must never reduce contrast. Text sits on `--surface` or `--canvas`, never on a texture directly.

## Status and direction

| Theme      | Scheme | Status   | Direction for milestone 4                                                                                                  |
| ---------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `daylight` | light  | baseline | Stays neutral. The reference for layout and spacing.                                                                       |
| `midnight` | dark   | baseline | Stays neutral. Default under a dark OS.                                                                                    |
| `sakura`   | light  | palette  | Warm paper texture, slow drifting petals (CSS shapes, low count), rounded chips, serif display face                        |
| `neo-noir` | dark   | palette  | Magenta and cyan glows as elevation, faint rain streaks, monospace numerals, slight flicker on focus (reduced-motion safe) |
| `hardhat`  | dark   | palette  | Blueprint grid on the canvas, safety-yellow accent, stencil or heavy display face, hard corners, chunky targets            |
| `theorem`  | dark   | palette  | Chalk texture, serif body and typeset numerals, results framed like an equation, chalk-dust focus ring                     |

Two of these are dark themes that could also be light ("blueprint paper" for hardhat, "graph paper" for theorem). Decide per theme at milestone 4 after the first polished theme sets the bar.

Recommended polish order: `sakura` first (a light theme stress-tests decoration behind text), then `neo-noir`, then `hardhat`, then `theorem`.

## Known gaps

- The gallery cards cannot preview native control styling (`<select>`, scrollbars); use the page-level picker for that.
- Per-theme fonts and decoration stylesheets are not implemented yet; the loading mechanism (load on activation, preload only the active theme) is designed in docs/PLAN.md §8 and lands in milestone 4.
