# Theming

How themes work, how to author one, and where each theme stands.

## Decision (2026-10-06)

Build the framework for all themes now so the mechanism is proven and every theme is visible in the gallery, then polish one theme at a time. Palettes exist for all six; decoration, fonts, and motion are added per theme in milestone 4.

## Mechanism

1. Each theme is a CSS file in `apps/web/src/styles/themes/<id>.css` that sets every token in the contract on `[data-theme='<id>']` and declares `color-scheme` so native controls match.
2. `daylight` also targets `:root`, so a page with no attribute is still fully styled.
3. The inline script in `src/layouts/Base.astro` reads `localStorage` (`bigsmall:theme`), falls back to `prefers-color-scheme` (`midnight` for dark, `daylight` for light), and sets `data-theme` on `<html>` before the first paint. No flash.
4. The same script drives the theme menu (`ThemePicker`, radios marked `data-theme-option` inside a `data-shell`) by event delegation, so switching works before any JavaScript bundle loads and on pages with no islands. A click picks and closes; arrow keys preview themes live until Enter or Escape.
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
- the bridge mixes each derived color as `DERIVED_COLORS` says (`accent-soft-hover`, `accent-hover`), and their pairs are checked like the theme's own, so a theme never defines them

A theme that fails any of these fails `pnpm test`, and therefore `pnpm check`, the gate before every push.

## Authoring a theme

1. Add the id to `ThemeId` and an entry to `THEMES` in `src/lib/themes.ts` (name, scheme, status, blurb). The theme menu and the browser tests read this list, so nothing else needs the name.
2. Copy `daylight.css` or `midnight.css` to `themes/<id>.css`, change the selector, set every token (the art tokens included; the derived colors, `DERIVED_COLORS`, are worked out from yours), and add its `@import` to `src/styles/global.css` with the others.
3. Run `pnpm test`. Adjust colors until every contrast pair passes. Prefer adjusting `--ink-muted`, `--accent`, and `--on-accent`; they fail most often.
4. Open `/dev/gallery` and check every component in the new card. Check the full page with the theme menu too, since nested cards do not show scrollbars or the header menus in their theme.
5. Draw the theme's art in `src/components/ThemeArt.astro`: an SVG in `fill-art-*` and `stroke-art-*` classes, plus its entry in `TOGGLE`, which TypeScript requires for every theme.
6. Run `pnpm e2e`: axe runs on the page in every registered theme, the reduced-motion test checks its motion tokens, and the art test checks its drawing shows.
7. Update the status table below.

Rules that keep themes cheap:

- Token sets are tiny and always bundled. Fonts, textures, and animations are not; they load only when their theme is active (milestone 4 mechanism).
- Default themes use system font stacks. Zero font bytes.
- Ambient motion (petals, rain) is CSS only and is disabled under `prefers-reduced-motion` through the motion tokens.
- Decoration must never reduce contrast. Text sits on `--surface` or `--canvas`, never on a texture directly.

## Status and direction

| Theme      | Feel               | Scheme | Status   | Direction for milestone 4                                                                                                              |
| ---------- | ------------------ | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `daylight` | neutral light      | light  | baseline | Stays neutral, on system fonts. The reference for layout and spacing.                                                                  |
| `midnight` | neutral dark       | dark   | baseline | Stays neutral. Default under a dark OS.                                                                                                |
| `sakura`   | cherry blossom     | light  | palette  | Soft pinks, warm paper texture, slow drifting petals (CSS shapes, low count), rounded chips, serif display face                        |
| `neo-noir` | Tokyo at night     | dark   | palette  | Near-black, magenta and cyan glows as elevation, faint rain streaks, monospace numerals, slight flicker on focus (reduced-motion safe) |
| `hardhat`  | job site           | dark   | palette  | Blueprint grid on the canvas, safety yellow and steel, stencil or heavy display face, hard corners, chunky targets                     |
| `theorem`  | higher mathematics | dark   | palette  | Chalk texture, serif body and typeset numerals, results framed like an equation, chalk-dust focus ring                                 |

Two of these are dark themes that could also be light ("blueprint paper" for hardhat, "graph paper" for theorem). Decide per theme at milestone 4 after the first polished theme sets the bar.

Recommended polish order: `sakura` first (a light theme stress-tests decoration behind text), then `neo-noir`, then `hardhat`, then `theorem`.

## Known gaps

- The gallery cards cannot preview scrollbars or the header menus in their own theme; use the page-level theme menu for that.
- Per-theme fonts and decoration stylesheets are not implemented yet; the loading mechanism (load on activation, preload only the active theme) is designed in docs/PLAN.md §8 and lands in milestone 4.
