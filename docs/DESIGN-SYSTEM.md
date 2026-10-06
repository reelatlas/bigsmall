# Design system

Last updated: 2026-10-06 (milestone 0). Tokens, the Tailwind bridge, component rules, and the component inventory.

## Token layers

1. **Semantic tokens** are what components use. They describe a role, never a color: `--ink` is "the text color", whatever a theme makes it.
2. **Themes** assign values to semantic tokens in `apps/web/src/styles/themes/<id>.css`. A theme is nothing but a token set plus, later, an optional decoration stylesheet.
3. **Component tokens** exist only when a component needs its own knob. None yet. Prefer a semantic token.

Raw values (a hex color, a pixel radius) never appear inside a component. If a design needs something the tokens cannot express, add a token, document it here, and define it in every theme. The theme contract test fails until every theme has it.

## Semantic tokens

| Token                                             | Role                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `--canvas`                                        | Page background                                                          |
| `--surface`                                       | Cards, inputs, panels                                                    |
| `--surface-raised`                                | Hover states, popovers, anything sitting on a surface                    |
| `--ink`                                           | Primary text                                                             |
| `--ink-muted`                                     | Secondary text, labels, hints. Still body-text contrast (4.5:1)          |
| `--accent`                                        | The one brand color: primary buttons, active states, links               |
| `--on-accent`                                     | Text and icons placed on `--accent`                                      |
| `--accent-soft`                                   | Tinted backgrounds: selected rows, chips, highlights                     |
| `--line`                                          | Borders and dividers                                                     |
| `--focus`                                         | Focus ring. Often equals `--accent`; dark themes may pick a brighter hue |
| `--danger`, `--success`                           | Error and success text and indicators                                    |
| `--type-display`, `--type-body`, `--type-numeric` | Font stacks for headings, running text, and numbers                      |
| `--shape-sm`, `--shape-md`, `--shape-lg`          | Border radii                                                             |
| `--elevation-sm`, `--elevation-md`                | Shadows (or glows, in neon-noir)                                         |
| `--motion-fast`, `--motion-base`, `--motion-slow` | Durations. Forced to 0ms under `prefers-reduced-motion`                  |
| `--motion-ease`                                   | The theme's easing curve                                                 |

The full list is the single source of truth in `apps/web/src/lib/themes.ts` (`TOKEN_CONTRACT`).

## Tailwind bridge

`apps/web/src/styles/global.css` maps tokens into Tailwind's theme with `@theme inline`, so utilities keep the `var()` reference and re-theme at runtime:

| Utility                                                                       | Resolves to  |
| ----------------------------------------------------------------------------- | ------------ |
| `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-accent`, `bg-accent-soft` | color tokens |
| `text-ink`, `text-ink-muted`, `text-on-accent`, `text-danger`, `text-success` | color tokens |
| `border-line`, `outline-focus`, `ring-focus`                                  | color tokens |
| `font-display`, `font-body`, `font-numeric`                                   | type tokens  |
| `rounded-sm`, `rounded-md`, `rounded-lg`                                      | shape tokens |
| `shadow-sm`, `shadow-md`                                                      | elevation    |
| `ease-standard`, `duration-[var(--motion-fast)]`                              | motion       |

Layout and spacing use Tailwind's default scale (`p-4`, `gap-2`, `max-w-2xl`). Those are not themed.

## Component rules

Every component in `apps/web/src/components/`:

1. Uses tokens only. No hex, no rgb, no px radii, no literal durations.
2. Is keyboard-operable with a visible focus ring (`focus-visible:outline-focus`).
3. Has an accessible name: visible label, `aria-label`, or `aria-labelledby`.
4. Has a touch target of at least 44 × 44 CSS px (`min-h-11`), per WCAG 2.5.8 best practice.
5. Works at 320 px wide and 400 % zoom without horizontal scrolling.
6. Respects reduced motion (the motion tokens handle this when used consistently).
7. Appears in `/dev/gallery` so every theme can be checked against it.
8. Passes the Playwright axe suite on desktop and mobile.

Prefer native elements when they are good enough (`<select>`, `<dialog>`, `<button>`). The smart input is the one hand-built composite control (WAI-ARIA combobox pattern, ADR 0006). A new composite starts from that pattern and the axe suite, and brings in a library only for a measured need recorded in an ADR.

## Inventory

| Component         | Kind           | Notes                                                                                                                      |
| ----------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Button`          | React (native) | `variant="primary"                                                                                                         | "secondary" | "ghost"`, `square`for a lone icon with`aria-label`. Native `<button>`, no runtime |
| `ThemePicker`     | Astro          | Fluid shell with a native radio group; the pre-paint script opens, closes, applies, and persists it, so it needs no bundle |
| `UnitChip`        | React          | The locked unit inside a smart input: symbol, plural, remove control                                                       |
| `SuggestionPanel` | React          | The listbox under a smart input: unit, category, and escape-hatch rows, virtual focus via `aria-activedescendant`          |
| `icons`           | React          | Inline SVG icons (swap, close, copy, chevron); decorative, `aria-hidden`                                                   |

Arriving in milestone 3: `Keypad`, `Sheet`, `Toggle`, `LiveResult`. `SmartInput` lives in `features/converter/` because it composes core search with these primitives.

## Adding a component

1. Check the inventory. Extend before you add.
2. Create `src/components/<Name>.tsx` (React) or `<Name>.astro` (no interaction).
3. Style with the utilities above. Run `pnpm lint`; raw values will be caught in review until a stylelint rule lands.
4. Add it to `src/pages/dev/gallery.astro`.
5. Run `pnpm e2e`. Fix any axe violation before merging.
6. Add a row to the inventory table.

## Copy

- **Sentence case** for every label, button, heading, message, and theme name: "Search all categories", "Neon noir", "Copy result". The only capitals inside a phrase are proper names.
- **Units follow the standards, not the sentence-case rule.** Symbols are case-sensitive and never altered: mL, kB, °F, km/h. Unit names are lowercase, including ones named after people (kelvin, newton), except "Celsius" and "Fahrenheit", which the SI Brochure and NIST write capitalized. Chips and rows show the plural name ("milliliters") next to the symbol.
- **Category names** are single capitalized words as labels: Length, Weight, Volume.
- **Short and plain.** No exclamation marks, no jargon in user-facing text. Error and empty-state text says what to try next.

## Controls

One look for every control: `min-h-11`, `rounded-md`, `border-line`, `bg-surface`, `hover:bg-surface-raised`, and the focus ring from `--focus`. Buttons, the theme select's trigger, and chip buttons all use it. Fields are the larger variant of the same language: `min-h-14`, `rounded-lg`, accent border while focused. A native control keeps its native popup (the theme select on a phone opens the system picker); only its trigger is styled.

Popovers float. A suggestion list is absolutely positioned under its field (`absolute inset-x-0 top-full z-20 mt-1`) with its own `rounded-lg border border-line bg-surface shadow-md` surface, and never pushes content down.

Tints come from the tokens, never from new colors: a chip at rest is `bg-accent-soft`; hovered, it lays `bg-surface/40` over that so it stays recognizably the chip.

### Fluid shells

A control that opens a list keeps field and list in one shape: a `relative` placeholder with a fixed height (`h-14` for fields, `h-11` for controls) holds an `absolute inset-x-0 top-0 overflow-hidden` shell with the border, corners, and surface. `overflow-hidden` is what keeps a row's hover or selected highlight inside the rounded corners; the shell's own focus outline is not clipped by it. When open the shell gets `z-20`, the accent border, and `shadow-md`, and the list renders inside it in flow with a `border-t`. The page never reflows; the shell grows over it. `SmartInput` and `ThemePicker` are the two instances; a third should reuse the pattern rather than invent a popover.

Native popups (a `<select>` list, a date picker) cannot take the design language, so a themed menu uses native inputs inside a fluid shell instead: `ThemePicker` is a radio group, which gives arrow keys, Space, and screen reader semantics for free.
