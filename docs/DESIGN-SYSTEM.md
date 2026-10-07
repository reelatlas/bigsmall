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
| `--elevation-sm`, `--elevation-md`                | Shadows (or glows, in neo-noir)                                          |
| `--motion-fast`, `--motion-base`, `--motion-slow` | Durations. Forced to 0ms under `prefers-reduced-motion`                  |
| `--motion-ease`                                   | The theme's easing curve                                                 |

The full list is the single source of truth in `apps/web/src/lib/themes.ts` (`TOKEN_CONTRACT`).

## Tailwind bridge

`apps/web/src/styles/global.css` maps tokens into Tailwind's theme with `@theme inline`, so utilities keep the `var()` reference and re-theme at runtime:

| Utility                                                                       | Resolves to                                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-accent`, `bg-accent-soft` | color tokens                                                                      |
| `text-ink`, `text-ink-muted`, `text-on-accent`, `text-danger`, `text-success` | color tokens                                                                      |
| `border-line`, `outline-focus`, `ring-focus`                                  | color tokens                                                                      |
| `font-display`, `font-body`, `font-numeric`                                   | type tokens                                                                       |
| `rounded-sm`, `rounded-md`, `rounded-lg`                                      | shape tokens                                                                      |
| `rounded-nested`                                                              | derived: `--shape-lg` minus the field's 2 px border and 8 px inset, never below 0 |
| `shadow-sm`, `shadow-md`                                                      | elevation                                                                         |
| `ease-standard`, `duration-[var(--motion-fast)]`                              | motion                                                                            |

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

| Component         | Kind           | Notes                                                                                                                                                                                                                                                                                                              |
| ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`          | React (native) | Variants primary, secondary (2 px edge), and ghost; `square` for a lone icon with `aria-label`; `nested` for corners inside a field. Native `<button>`, no runtime                                                                                                                                                 |
| `ThemePicker`     | Astro          | Fluid shell with a native radio group; the inline script in Base.astro opens, closes, applies, and persists it, so it needs no bundle                                                                                                                                                                              |
| `ShortcutsHelp`   | Astro          | A ghost icon button left of the theme menu that grows into a fluid shell with the keyboard shortcuts map from `src/lib/shortcuts.ts`; Ctrl or ⌘ by platform (`src/lib/platform.ts`); opens while a mouse rests on it, pins on click, closes on Escape or a click outside; hidden on touch-first devices; no bundle |
| `UnitChip`        | React          | The locked unit inside a smart input: bold symbol and muted name on one baseline, which open the unit list, plus a remove control; `inTabOrder={false}` when the host's keys cover both                                                                                                                            |
| `SuggestionPanel` | React          | The listbox inside a smart input's shell: a pinned Back row first inside a category, unit rows (name, then bold symbol right-aligned), category rows, matched letters heavier; virtual focus via `aria-activedescendant`                                                                                           |
| `icons`           | React          | Inline SVG icons drawn for this project (swap, close, copy, chevrons, undo, redo, eraser, keyboard), also rendered to static HTML from Astro; decorative, `aria-hidden`                                                                                                                                            |

Arriving in milestone 3: `Keypad`, `Sheet`, `Toggle`, `LiveResult`. `SmartInput` lives in `features/converter/` because it composes core search with these primitives.

## Adding a component

1. Check the inventory. Extend before you add.
2. Create `src/components/<Name>.tsx` (React) or `<Name>.astro` (no interaction).
3. Style with the utilities above. Run `pnpm lint`; raw values will be caught in review until a stylelint rule lands.
4. Add it to `src/pages/dev/gallery.astro`.
5. Run `pnpm e2e`. Fix any axe violation before merging.
6. Add a row to the inventory table.

## Copy

- **Sentence case** for every label, button, heading, message, and theme name: "Search all categories", "Neo-noir", "Copy result". The only capitals inside a phrase are proper names.
- **Units follow the standards, not the sentence-case rule.** Symbols are case-sensitive and never altered: mL, kB, °F, km/h. Unit names are lowercase, including ones named after people (kelvin, newton), except "Celsius" and "Fahrenheit", which the SI Brochure and NIST write capitalized. Chips and rows show the plural name ("milliliters") next to the symbol.
- **Category names** are single capitalized words as labels: Length, Weight, Volume.
- **Short and plain.** No exclamation marks, no jargon in user-facing text. Error and empty-state text says what to try next.

## Controls

One look for every control: `min-h-11`, `rounded-md`, `border-2 border-line`, `bg-surface`, `hover:bg-surface-raised`, and the focus ring from `--focus`. Every bordered control (secondary buttons, the theme menu, fields) shares the same 2 px edge, so no control looks lighter-edged than its neighbor. Icon-only actions that sit on the page (swap, undo, redo, clear all, copy, the shortcuts map at rest) are ghost buttons: no border, the page behind them, `hover:bg-surface-raised`, and the `focus-visible` ring. Fields are the larger variant of the same language (see "Fields" below). A control that opens something keeps field and list in one shape (see "Fluid shells"); nothing uses a native popup, because the OS draws it in its own colors.

**Nested corners.** An element inset inside a rounded shell uses the shell's radius minus the inset, border included, so the two curves stay concentric; an inner corner as round as the outer one looks swollen. Inside a field and its list (an `lg` shell, 2 px border, 8 px inset) that is `rounded-nested`; inside the theme menu (an `md` shell, 4 px inset) it is `rounded-sm`, which is close to `md` minus 6 px in every theme.

**Matched letters.** In a list, the letters a query matches are set heavier and nothing else changes: unit names go `font-semibold`, category names `font-bold`, and a symbol's muted text turns `text-ink`. The match comes from core's `matchSpan`, which folds text the way search does.

Popovers float. A list grows inside its control's shell over the page and never pushes content down.

Tints come from the tokens, never from new colors: a chip at rest is `bg-accent-soft`; hovered, it lays `bg-surface/40` over that so it stays recognizably the chip.

### Fluid shells

A control that opens a list keeps field and list in one shape: a `relative` placeholder with a fixed height holds an `absolute inset-x-0 top-0 overflow-hidden` shell with the border, corners, and surface. The placeholder is as tall as the closed shell including its border: `h-16` for a field whose row is `h-15`, `h-12` for the theme control whose toggle is `h-11`.

The edge is a real two-pixel border (`border-2`): `border-line` at rest, `border-accent` while open or while anything inside has focus (`focus-within`), with `shadow-md` when open and no ring or outer outline. A border is the one edge children cannot paint over; an inset ring is drawn under them, which is how row highlights used to eat into it. That accent edge is also the focus indicator for the field and for the theme toggle.

Inside a field's shell, the list renders in flow under a `border-t` divider, with its rows in a `p-2` gutter: each row is `rounded-nested px-2`, so a hover or selected highlight sits visibly inside the edge with the same 8 px as the chip, and the row text starts 16 px in, exactly under the number. Lists scroll with `scroll-thin` (thin, themed scrollbars) inside the same gutter. Inside a category the Back row is the list's first option, pinned with `sticky top-0` and a divider under it; because it lives inside the scrolling list, its category name shares the symbol column's right edge whether or not a scrollbar shows, and `scroll-pt-14` keeps a row scrolled into view clear of it. The theme menu uses a `p-1` gutter with `rounded-sm px-2` rows to match its smaller shell and 12 px trigger text. `overflow-hidden` on the shell clips descendants to the rounded corners; the shell's own border is never clipped. The page never reflows; the shell grows over it. `SmartInput`, `ThemePicker`, and `ShortcutsHelp` are the instances; another should reuse the pattern rather than invent a popover. The header menus share one controller in the inline script of `Base.astro`: `[data-shell]` with a `[data-shell-toggle]`, `[data-open]` while open, `[data-pinned]` once a click opened it, `[data-shell-hover]` to also open while a mouse rests on it, and `[data-shell-initial]` for what takes focus on open. A shell anchored at the page edge (`ShortcutsHelp`) grows from its right edge with `absolute top-0 right-0` and takes its width from its panel.

### Fields

A field is a fluid shell, `rounded-lg`, with an `h-15` row inside its 2 px border: `pl-4 pr-2 gap-2`. The 44 px chip and trailing button therefore keep the same 8 px from the top, bottom, and right edges, with `rounded-nested` corners, and the number starts 16 px in. The chip's symbol and name sit on one baseline (`items-baseline`), not merely centered, since they are different sizes. Buttons inside a field (the chip's two, copy) are out of the Tab order when the field's own keys do the same job, so Tab goes from field to field. A message about the value ("Too large to convert") is drawn over the field in `text-danger` in place of a placeholder, and joins the field's `aria-describedby`. The value is drawn by a text layer over a field whose own text is transparent (`text-transparent caret-ink selection:bg-accent-soft`): the `<input>` keeps the caret, selection, focus, mobile keyboards, and the accessibility tree, and the `aria-hidden` layer gets the typography, which is how the exponent marker in `1.5E21` can be `font-semibold`. The layer matches the field's font, size, and line box, follows its horizontal scroll, and is `pointer-events-none`. Both carry the same size step, chosen by `useFitStep` (`src/lib/fit-step.ts`): the largest of five steps (`text-2xl sm:text-3xl` down to `text-base`) at which the layer's content fits on one line, re-measured before paint on every render and on resize. A future field with styled text reuses the layer and the hook; nothing else styles a field's text.

Native popups (a `<select>` list, a date picker) cannot take the design language, so a themed menu uses native inputs inside a fluid shell instead: `ThemePicker` is a radio group, which gives arrow keys, Space, and screen reader semantics for free.
