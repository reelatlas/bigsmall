# Design system

Tokens, the Tailwind bridge, the patterns every control follows, and the component inventory. Behavior lives in docs/UX-SPEC.md; this file is how things look and are built.

## Token layers

1. **Semantic tokens** are what components use. They describe a role, never a color: `--ink` is "the text color", whatever a theme makes it.
2. **Themes** assign values to semantic tokens in `apps/web/src/styles/themes/<id>.css`. A theme is nothing but a token set plus, later, an optional decoration stylesheet.
3. **Derived tokens** are computed once in the bridge from semantic tokens (the nested corner radii). They follow every theme automatically.
4. **Component tokens** exist only when a component needs its own knob. None yet. Prefer a semantic token.

Raw values (a hex color, a pixel radius, a literal duration) never appear inside a component, and `pnpm lint` enforces it (see "Token guard"). If a design needs something the tokens cannot express, add a token, document it here, and define it in every theme. The theme contract test fails until every theme has it.

## Semantic tokens

| Token                                             | Role                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--canvas`                                        | Page background                                                                                                     |
| `--surface`                                       | Cards, fields, panels                                                                                               |
| `--surface-raised`                                | Hover states and anything sitting on a surface; visibly different from `--surface`                                  |
| `--ink`                                           | Primary text                                                                                                        |
| `--ink-muted`                                     | Secondary text, labels, hints. Still body-text contrast (4.5:1)                                                     |
| `--accent`                                        | The one brand color: active edges, primary buttons, links                                                           |
| `--on-accent`                                     | Text and icons placed on `--accent`                                                                                 |
| `--accent-soft`                                   | Tinted backgrounds: selected rows, chips                                                                            |
| `--line`                                          | Dividers and decorative borders: list headers, the toolbar rule, keycaps, cards                                     |
| `--edge`                                          | A control's resting edge: fields, the theme menu, secondary buttons. 3:1 or more against `--canvas` and `--surface` |
| `--focus`                                         | Focus ring. Often equals `--accent`; dark themes may pick a brighter hue                                            |
| `--danger`, `--success`                           | Error and success text and indicators (the out-of-range message, the copy check)                                    |
| `--type-display`, `--type-body`, `--type-numeric` | Font stacks for headings, running text, and numbers                                                                 |
| `--shape-sm`, `--shape-md`, `--shape-lg`          | Border radii                                                                                                        |
| `--elevation-sm`, `--elevation-md`                | Shadows (or glows, in neo-noir)                                                                                     |
| `--motion-fast`, `--motion-base`, `--motion-slow` | Durations. Zeroed under `prefers-reduced-motion` (see "Motion")                                                     |
| `--motion-ease`                                   | The theme's easing curve                                                                                            |

The full list is the single source of truth in `apps/web/src/lib/themes.ts` (`TOKEN_CONTRACT`), with the contrast pairs every theme must pass (`CONTRAST_PAIRS`).

## Tailwind bridge

`apps/web/src/styles/global.css` maps tokens into Tailwind's theme with `@theme inline`, so utilities keep the `var()` reference and re-theme at runtime:

| Utility                                                                       | Resolves to                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-accent`, `bg-accent-soft` | color tokens                                                                                |
| `text-ink`, `text-ink-muted`, `text-on-accent`, `text-danger`, `text-success` | color tokens                                                                                |
| `border-edge`, `border-line`, `border-accent`, `outline-focus`                | color tokens                                                                                |
| `font-display`, `font-body`, `font-numeric`                                   | type tokens; `font-numeric` also turns on tabular digits                                    |
| `rounded-sm`, `rounded-md`, `rounded-lg`                                      | shape tokens                                                                                |
| `rounded-nested`, `rounded-nested-md`                                         | derived: the shell's corner minus its border and inset (see "Corners")                      |
| `shadow-sm`, `shadow-md`                                                      | elevation tokens                                                                            |
| `duration-fast`, `duration-base`, `duration-slow`, `ease-standard`            | motion tokens; every `transition-*` utility already defaults to fast and the theme's easing |

Custom utilities, also in `global.css`:

| Utility                   | Use                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `scroll-thin`             | Thin, themed, arrow-less scrollbars for lists inside rounded shells                     |
| `focus-ring-inset`        | Draws the focus ring inside the element, for a control flush against an edge that clips |
| `focus-ring-within-inset` | The same ring on a wrapper whose descendant has focus (the theme menu's radio labels)   |

Layout and spacing use Tailwind's default scale (`p-4`, `gap-2`, `max-w-2xl`). Those are not themed.

## Token guard

`pnpm lint` checks every string in `apps/web/src`, which is where class lists live, and fails on a value that bypasses the tokens. The patterns are in `eslint.config.js` (`RAW_VALUES`).

| Flagged                                                                                  | Use instead                                                                       |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Raw colors: hex, `rgb()`, `hsl()`, `oklch()`, `color-mix()`                              | A color token: `bg-surface`, `text-ink`, `border-line`                            |
| Tailwind palette colors: `bg-red-500`, `text-white`                                      | A color token. The palette does not follow the theme                              |
| Arbitrary values holding a length, color, time, or variable: `w-[37px]`, `bg-(--accent)` | The token utility, or the spacing scale                                           |
| Numbered durations and stock easings: `duration-150`, `ease-in-out`                      | `duration-fast`, `duration-base`, `duration-slow`, `ease-standard`                |
| Radii, shadows, and fonts outside the tokens: `rounded-xl`, `shadow-lg`, `font-mono`     | `rounded-sm/md/lg`, `rounded-nested`, `shadow-sm/md`, `font-display/body/numeric` |
| A number of milliseconds in `setTimeout` or `setInterval`                                | A named constant in `src/lib/timing.ts`                                           |

Allowed: arbitrary values that name structure rather than a value (`transition-[border-color,box-shadow]`, `grid-cols-[1fr_auto_1fr]`), the spacing scale, and `var(--token)` where the gallery paints its swatches. Raw values belong in the theme files and the bridge, which are CSS and outside the guard.

**When it flags something.** Use the existing token if one fits. If none does, the need is a design decision: bring it to the owner with a recommendation (reuse a token, or add one to every theme) before building on it. Never silence the guard with a disable comment.

## Component rules

Every component in `apps/web/src/components/`:

1. Uses tokens only: no hex, rgb, px radii, or literal durations, and no arbitrary-value utilities where a token utility exists (`duration-fast`, not `duration-[var(--motion-fast)]`).
2. Is keyboard-operable with a visible focus indicator (see "Focus"). A browser test tabs through the page and fails on any stop without one.
3. Has an accessible name: visible label, `aria-label`, or `aria-labelledby`.
4. Has a touch target of at least 44 × 44 CSS px (`min-h-11`, `size-11`, `w-11`), per WCAG 2.5.8 best practice.
5. Works at 320 px wide and 400 % zoom without horizontal scrolling.
6. Respects reduced motion by using the motion tokens.
7. Appears in `/dev/gallery` in the variants and states that ship, so every theme can be checked against it.
8. Passes the Playwright axe suite on desktop and mobile.

Prefer native elements when they are good enough (`<button>`, radios, `<dialog>`). The smart input is the one hand-built composite control (WAI-ARIA combobox pattern, ADR 0006). A new composite starts from that pattern and the axe suite, and brings in a library only for a measured need recorded in an ADR.

## Patterns

### Edges and borders

- **2 px is a control's edge.** Fields, the theme menu, and secondary buttons share `border-2` in `--edge`, so no control looks lighter-edged than its neighbor. A border is the one edge children cannot paint over; an inset ring is drawn under them, which is how row highlights once ate into it.
- **1 px is a divider or a keycap.** The line under a field or the Back row, the toolbar divider (`border-l`), and keycaps use `border`.
- **Open is accent.** A shell's edge is `border-edge` at rest and `border-accent` while open or while something inside has focus.
- **A control's edge identifies it.** `--edge` passes 3:1 against the page and the surface in every theme, so a field's resting edge meets WCAG 1.4.11 by itself, and the theme test enforces it. `--line` stays subtle because a divider only groups. Each theme's `--edge` is its `--line` moved toward `--ink` to the first step past 3:1. Introduced 2026-10-06 as a trial the owner may roll back (findings-0, sixth pass).

### Focus

- **One ring.** The base layer gives every `:focus-visible` element a 2 px `--focus` outline offset by 2 px. Buttons, chips, and links rely on it and add nothing.
- **Never pair `outline-none` with focus utilities.** In Tailwind v4, `outline-none` sets the outline style to none, and `focus-visible:outline-2` then draws nothing (docs/LEARNINGS.md).
- **Inset where an edge clips.** `focus-ring-inset` on the shortcuts toggle while its shell is open; `focus-ring-within-inset` on the theme menu's option labels.
- **Shell edges for fields and the theme menu.** The field's input and the theme trigger set `outline-none`; their shell's accent edge (`focus-within:border-accent`) is the indicator.
- **The list is never focused.** Rows are virtually focused through `aria-activedescendant`; the listbox has `tabIndex={-1}` so Chrome does not make it a Tab stop.

### Motion

- Components write `transition-colors` (or `transition-[border-color,box-shadow]`, `transition-transform`) and nothing else: the bridge makes every transition default to `--motion-fast` and `--motion-ease`.
- Buttons, chips, and shell edges fade; list rows and theme options change instantly, so keyboard movement never lags.
- Reduced motion zeroes the motion tokens with an unlayered rule placed after the theme imports (a layered rule loses to the themes' unlayered token blocks), and a blanket `!important` rule stops any other transition or animation. A browser test checks the tokens read `0ms` in every theme.

### Corners

An element inset inside a rounded shell uses the shell's radius minus the inset, border included, so the curves stay concentric; an inner corner as round as the outer one looks swollen.

- `rounded-nested`: inside a field or its list (`lg` shell, 2 px border, 8 px inset). The chip, the copy button (`Button nested`), and list rows.
- `rounded-nested-md`: inside a menu (`md` shell, 2 px border, 4 px gutter). The theme menu's options.

### Fluid shells

A control that opens a list or panel keeps both in one shape, drawn over the page so nothing reflows. The recipe lives in `src/lib/shell.ts` and every instance builds from it:

- A **placeholder** with `group relative` and a fixed size holds the layout: `h-16` for a field, `h-12` for the theme menu, `size-12` for the shortcuts map. It carries `data-open` while open.
- The **shell** inside takes `SHELL` (2 px edge, `overflow-hidden`, and the open state: `z-20`, accent edge, `shadow-md`; no motion, since a shared part must not decide how a variant moves), one resting style, and its own position and radius.
  - `SHELL_BORDERED`: bordered at rest, `bg-surface`, accent on `focus-within`, and its edge eases between edge and accent, because the shell stays in view through the change. Fields (`rounded-lg`, plus `shadow-sm` at rest) and the theme menu (`rounded-md`, no resting shadow).
  - `SHELL_GHOST`: a borderless icon button at rest that becomes a card when open. Nothing eases: its panel appears and vanishes at once, so its edge must too, or a fading accent square is left around the icon. A browser test checks the ghost edge cannot animate. The shortcuts map (`rounded-md`), anchored with `absolute top-0 right-0` so it grows left and takes its width from its panel.
- The list or panel renders inside the shell, in flow, under a `border-t` divider. `overflow-hidden` clips it to the corners; the shell's own border is never clipped.
- `SmartInput` sets `data-open` from React state. The header menus share one controller in the inline script of `Base.astro`: `[data-shell]`, `[data-shell-toggle]`, `[data-open]`, `[data-pinned]` (a click opened it), `[data-shell-hover]` (a resting mouse also opens it), and `[data-shell-initial]` (what takes focus on open). It closes a shell on Escape, a click outside, or focus leaving it. A new header menu reuses this markup and needs no script.

### Fields

- **Row.** `FIELD_ROW` (`src/lib/shell.ts`): 60 px tall inside the 2 px border, `pl-4 pr-2 gap-2`. The 44 px chip and trailing button keep the same 8 px from the top, bottom, and right edges, and the value starts 16 px in.
- **Text layer.** The value is drawn by an `aria-hidden` layer over an input whose own text is transparent (`text-transparent caret-ink selection:bg-accent-soft`). The input keeps the caret, selection, focus, mobile keyboards, and the accessibility tree; the layer gets the typography, which is how the exponent marker in `1.5E21` is `font-semibold` (core's parser reports where it is). The layer matches the input's font, size, and line box, follows its horizontal scroll, and is `pointer-events-none`.
- **Size steps.** `useFitStep` (`src/lib/fit-step.ts`) picks the largest of five steps (`text-2xl sm:text-3xl` down to `text-base`) at which the layer's text fits on one line, measured before paint on every render and on resize. The out-of-range message uses the same hook with three sizes and a last step that wraps.
- **Chip.** Symbol and plural on one baseline (`items-baseline`). It collapses to its symbol when the value is longer than six characters or a message shows.
- **Buttons inside a field** (the chip's two, copy) are out of the Tab order, because the field's own keys do the same jobs.
- **Messages.** "Too large to convert" is drawn over the field in `text-danger` in place of the placeholder and joins the input's `aria-describedby`.
- **Category label** under a field: `text-sm font-medium text-ink-muted`, inset `px-4.5` (the 2 px border plus the 16 px value inset) so it starts where the value starts.

### Lists

- Rows sit in a `p-2` gutter, each `rounded-nested px-2`, so a highlight sits inside the edge with the same 8 px as the chip and the row text starts 16 px in, under the value.
- A unit row is "name … symbol": the plural in ink, the symbol right-aligned in `font-numeric font-semibold text-ink-muted`. When the list spans categories, the category follows the name in `text-xs text-ink-muted`.
- **Matched letters** are set heavier and nothing else changes: names `font-semibold`, category names `font-bold`, a symbol's matched part `text-ink`. The span comes from core's `matchSpan`.
- **The Back row** is the list's first option, pinned with `sticky top-0`, a `bg-surface` fill, and a divider under it; because it lives inside the scrolling list it shares the rows' edges, and `scroll-pt-14` keeps a row scrolled into view clear of it.
- Lists scroll with `scroll-thin` inside the gutter. Highlights: `data-active:bg-accent-soft`, `hover:bg-surface-raised`, no transition.

### Icon buttons and the toolbar

- An icon-only action on the page is `Button variant="ghost" square` with an `aria-label`: swap, undo, redo, clear all, copy (also `nested`, inside a field), copy link, and the shortcuts map at rest. Disabled ones drop to 50 % opacity.
- **Slots.** A control an island owns but the static header shows (copy link) is drawn into a slot the markup reserves at its final size (`src/lib/slots.ts`, a React portal), so it appears after hydration without moving anything and keeps the island's state at hand.
- Groups in a toolbar are set apart by `ToolbarDivider` (`h-6 border-l border-line`): the calculator, then undo and redo, then clear all.
- **Switched on.** A ghost button that opens a panel or sets a mode takes `on` while it does (the calculator icon): the accent-soft fill, kept while hovered, alongside `aria-expanded` or `aria-pressed`.
- **Space by what shows.** A ghost icon's 20 px glyph sits 12 px inside its 44 px button, so the space people see between two icons is the gap plus 24 px. Next to a bordered control, which shows its edge, a row of ghost icons keeps the same visible rhythm: the edge sits as far from the last glyph as glyphs sit from each other. In the header that is 36 px both ways (icons `gap-2` inside their 48 px places, the theme menu `gap-5.5` after the icons; `HeaderMenus.astro`).
- A successful copy swaps the icon for `CheckIcon` in `text-success`, which every theme keeps at 3:1 on the surface (a graphic, WCAG 1.4.11).
- Keycaps (`Keycap`) are `rounded-sm border border-line bg-surface-raised font-numeric text-xs`.

### Calculator

- A card below the boxes, at most `max-w-sm` and centered: `rounded-lg border border-line bg-surface p-3 shadow-sm`, all in the `Calculator` component.
- **Header**: the title "Calculator" (`text-sm font-medium text-ink-muted`, labelling the group) and a ghost close button.
- **Display**: a field's geometry, `rounded-lg border-2 border-edge bg-surface` around `FIELD_ROW`, so it is the same size as the boxes; the entry in `font-numeric` stepping down through `NUMBER_SIZES` (`src/lib/fit-step.ts`) and keeping its end in view past the smallest; drawn by `NumberText`, so exponent markers and the running value look as they do in a box; a muted 0 when empty.
- **Keys** are `Button`s at `min-h-12` with `font-numeric text-lg`, four to a row (`gap-2`): digits secondary; C, ⌫, E, and the decimal mark `tonal`; the five operators `soft`; = primary.
- **Sending**: two `SendButton`s under the keys, secondary, reading "Use in 1st" plus the box's unit symbol in semibold, with the copy check (`CheckIcon` in `text-success`) while a send is confirmed, and `aria-disabled` while there is nothing to send.
- **Focus**: =, the send buttons, and close carry `data-calculator-stop`; Tab cycles through them in that order and Enter presses the focused one. Other keys are `tabIndex={-1}` and a click on them never moves focus.

### Copy

- **Sentence case** for every label, button, heading, message, and theme name: "Clear all", "Neo-noir", "Copy first value". The only capitals inside a phrase are proper names.
- **Units follow the standards, not the sentence-case rule.** Symbols are case-sensitive and never altered: mL, kB, °F, km/h. Unit names are lowercase, including ones named after people (kelvin, newton), except "Celsius" and "Fahrenheit", which the SI Brochure and NIST write capitalized. Chips and rows show the plural name ("milliliters") next to the symbol.
- **Category names** are single capitalized words as labels: Length, Weight, Volume.
- **Short and plain.** No exclamation marks, no jargon in user-facing text. Error and empty-state text says what to try next.

## Inventory

| Component         | Kind  | Notes                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`          | React | Native `<button>`, no runtime. `variant` (required): ghost, secondary (2 px edge), tonal (2 px edge on the raised surface, muted ink), soft (accent-soft fill), primary. `on` for a ghost button that is switched on; `aria-disabled` dims a button that should stay a Tab stop while it can do nothing. `square` for a lone icon with `aria-label`; `nested` inside a field |
| `UnitChip`        | React | The committed unit inside a field: bold symbol and muted name on one baseline, which open the unit list, plus a 44 px remove control; `compact` and `inTabOrder` are explicit                                                                                                                                                                                                |
| `SuggestionPanel` | React | The listbox inside a field's shell: Back row, unit rows, category rows, matched letters. `optionIdFor` gives the row ids the combobox points at                                                                                                                                                                                                                              |
| `Keycap`          | React | One key as printed; `label="Mod"` reads Ctrl, or ⌘ on Apple devices                                                                                                                                                                                                                                                                                                          |
| `Calculator`      | React | The calculator card: display, keys as native buttons 48 px tall in a labelled group, typed keys pressing them, and a footer slot; `SendButton` is its "Use in 1st" button. What a key does is the caller's                                                                                                                                                                   |
| `NumberText`      | React | A typed number as the converter draws it, in a field and in the calculator: exponent markers semibold, the running value of arithmetic muted. `runningValue()` gives that value                                                                                                                                                                                              |
| `ToolbarDivider`  | React | The thin vertical rule between groups of icon buttons in a toolbar                                                                                                                                                                                                                                                                                                           |
| `icons`           | React | Inline SVG icons drawn for this project: swap, close, copy, check, chevron right and down, undo, redo, eraser, keyboard, link, calculator, backspace. Decorative, `aria-hidden`                                                                                                                                                                                              |
| `HeaderMenus`     | Astro | The header's controls in their fixed order: the shortcuts map, the actions slot (`actions` prop; copy link on the converter page), then the theme menu                                                                                                                                                                                                                       |
| `ThemePicker`     | Astro | Fluid shell with a native radio group; the inline script opens it, applies and saves the choice, and lets arrow keys preview themes until Enter                                                                                                                                                                                                                              |
| `ShortcutsHelp`   | Astro | Ghost icon button that grows into the shortcuts map from `src/lib/shortcuts.ts`; peeks on hover, pins on click; hidden on touch-first devices and below `sm`                                                                                                                                                                                                                 |

React components used in Astro files without a `client:` directive (the icons, `Button`, and `Keycap` inside the header menus) render to static HTML and ship no JavaScript. `SmartInput` lives in `features/converter/` because it composes core search with these components. Arriving in milestone 3: a mode toggle; later, the keypad docked as a sheet on phones.

## The gallery

`/dev/gallery` renders one card per theme, each pinned with `data-theme`, holding: the color tokens; a numeric type sample; the real field in frozen states (a result with an exponent, a collapsed chip, and the copy check; an out-of-range message; an open list mid-search inside a category); the ghost icon buttons, one disabled; the secondary and primary buttons; and keycaps. The header menus use the page theme. axe checks the page in CI.

## Adding a component

1. Check the inventory. Extend before you add.
2. Create `src/components/<Name>.tsx` (React) or `<Name>.astro` (static, or driven by the inline script).
3. Style with the utilities above and the patterns in this file. Run `pnpm lint`.
4. Add it to `src/pages/dev/gallery.astro` in its real variants and states.
5. Run `pnpm e2e`. Fix any axe violation before merging.
6. Add a row to the inventory table.
