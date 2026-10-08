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
| `--art-1`, `--art-2`, `--art-3`                   | The theme art's colors (`ThemeArt`). Decoration only, so they have no contrast pair                                 |
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
| `fill-art-1`, `stroke-art-2` (and the rest of the art set)                    | art tokens, for the theme art's SVG                                                         |
| `border-edge`, `border-line`, `border-accent`, `outline-focus`                | color tokens                                                                                |
| `font-display`, `font-body`, `font-numeric`                                   | type tokens; `font-numeric` also turns on tabular digits                                    |
| `rounded-sm`, `rounded-md`, `rounded-lg`                                      | shape tokens                                                                                |
| `rounded-nested`, `rounded-nested-md`                                         | derived: the shell's corner minus its border and inset (see "Corners")                      |
| `shadow-sm`, `shadow-md`                                                      | elevation tokens                                                                            |
| `duration-fast`, `duration-base`, `duration-slow`, `ease-standard`            | motion tokens; every `transition-*` utility already defaults to fast and the theme's easing |

Custom utilities, also in `global.css`:

| Utility                   | Use                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `focus-ring-within-inset` | Draws the focus ring inside a wrapper whose descendant has focus, for a control flush against an edge that clips (the theme menu's radio labels) |

Layout and spacing use Tailwind's default scale (`p-4`, `gap-2`, `max-w-2xl`). Those are not themed.

## Token guard

`pnpm lint` checks every string in `apps/web/src`, which is where class lists live, and fails on a value that bypasses the tokens. The patterns are in `eslint.config.js` (`RAW_VALUES`). A new pattern is written without "/" (a selector's regex ends at the first one) and tried on a scratch file of violations and allowed look-alikes before it is trusted.

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
5. Works at 320 px wide and 400 % zoom without horizontal scrolling. Anything added to a row that shares space (the header, the toolbar) is checked at 320 px before it is done, and at small sizes it gives way (a word that becomes screen-reader-only, a row that stacks) rather than shrinking targets. Form controls in a narrow column take `w-full min-w-0`, and code shown on a page wraps (`whitespace-pre-wrap wrap-break-word`) rather than scrolls.
6. Respects reduced motion by using the motion tokens.
7. Appears in `/dev/gallery` in the variants and states that ship, so every theme can be checked against it.
8. Passes the Playwright axe suite on desktop and mobile.
9. Takes what it branches on as a prop, never as children: Astro hands a TSX component its children as rendered markup (`<Keycap label="Mod" />`).
10. Writes ARIA roles, handlers, and `aria-*` attributes out on the element, never through a spread, so jsx-a11y can check them. A jsx-a11y rule that does not fit a sound pattern (click-only rows under `aria-activedescendant`) is disabled on that element alone, with the reason; the token guard is never disabled.
11. Gives a labelled container a role that takes a name (`role="group"`): `aria-label` on a plain `div` names nothing.
12. If it owns keys, moves focus into itself when it opens, onto the control Enter should press, returns focus to its trigger when it closes, and answers its keys only while focus is inside (WCAG 2.1.4), as the calculator does.
13. Sets no margin on its own outer edge: whoever places it spaces it (`TableLayout`'s `TABLE_ROWS_CELL`, `CALCULATOR_PLACE`), so the same component sits right in any layout and in the gallery. A divider's own spacing is part of what it is (`ToolbarDivider`).

Prefer native elements when they are good enough (`<button>`, radios, `<dialog>`). The converter's box is the one hand-built composite control, on the WAI-ARIA combobox pattern (ADR 0006), its popup the table's place, a grid or a listbox (ADR 0012). A new composite starts from that pattern and the axe suite, and brings in a library only for a measured need recorded in an ADR.

## Patterns

### Recipes

A class list more than one file builds from is a recipe in `src/lib/recipes.ts`, written once so a shared shape cannot drift between Astro and TSX: the card (`CARD`), where the calculator opens (`CALCULATOR_PLACE`), the fluid shells (`SHELL`, `SHELL_BORDERED`, `SHELL_GHOST`, `SHELL_PANEL`), the menus inside them (`MENU_TRIGGER`, `MENU_CHEVRON`, `MENU_OPTION`, shared by the theme menu and the category menu), a unit's symbol wherever it shows (`unitSymbol()`), the field row (`FIELD_ROW`), the rows a field's cursor moves through (`CURSOR_ROW`, and `rowFill()` for their fill), the type ladders (`NUMBER_SIZES`, `WORDMARK_SIZES`), and the wordmark's face and lines (`WORDMARK_FACE`, `PLAYING_LINE`, `ART_LINE`).

- A recipe whose look depends on a state is a small function returning class lists (`rowFill(selected, current)`, `unitSymbol(alone)`), so the states can never both apply and fight over one property.

- A list only one file uses stays in that file, as an UPPER_SNAKE constant beside its markup (`TEXT_LAYER` in ValueField, `DISPLAY_TEXT` in Calculator). It moves to `recipes.ts` when a second file needs it.
- A recipe holds only what every use shares. A part one use needs and another must not have goes in that use or in a variant recipe: merging the shells once gave the shortcuts map a fading edge (docs/LEARNINGS.md, "Merging recipes can undo a fix").
- TSX joins class lists with `cx()`, which leaves out any a condition turned off (`cx('font-semibold', !compact && 'text-ink-muted')`); Astro joins them with `class:list`. Never a template string with `? '' :`, which leaves stray spaces.
- Recipes hold tokens only, like every class list, and the token guard checks them.

### Edges and borders

- **2 px is a control's edge.** Fields, the theme menu, and secondary buttons share `border-2` in `--edge`, so no control looks lighter-edged than its neighbor. A border is the one edge children cannot paint over; an inset ring is drawn under them, which is how row highlights once ate into it.
- **1 px is a divider or a keycap.** The line under a menu's trigger, between the matches' groups, the toolbar divider (`border-l`), and keycaps use `border`.
- **Open is accent.** A shell's edge is `border-edge` at rest and `border-accent` while open or while something inside has focus. The calculator's card does the same while focus is inside it: its 1 px border and a 1 px ring turn accent, 2 px like a focused box, so nothing moves.
- **A control's edge identifies it.** `--edge` passes 3:1 against the page and the surface in every theme, so a field's resting edge meets WCAG 1.4.11 by itself, and the theme test enforces it. `--line` stays subtle because a divider only groups. Each theme's `--edge` is its `--line` moved toward `--ink` to the first step past 3:1. Introduced 2026-10-06 as a trial the owner may roll back (findings-0, sixth pass).

### Focus

- **One ring.** The base layer gives every `:focus-visible` element a 2 px `--focus` outline offset by 2 px. Buttons, chips, and links rely on it and add nothing.
- **Never pair `outline-none` with focus utilities.** In Tailwind v4, `outline-none` sets the outline style to none, and `focus-visible:outline-2` then draws nothing (docs/LEARNINGS.md).
- **Inset where an edge clips.** `focus-ring-within-inset` on the theme menu's option labels.
- **Shell edges for fields, the menus, and the open shortcuts map.** The field's input and the theme trigger set `outline-none`; their shell's accent edge (`focus-within:border-accent`) is the indicator. The shortcuts toggle does the same while its map is open (`group-data-open:outline-none`): the open shell's accent edge says where focus is, so the icon draws no ring inside it; closed, it shows the ring like any button.
- **The list is never focused.** Rows are virtually focused through `aria-activedescendant`; the listbox has `tabIndex={-1}` so Chrome does not make it a Tab stop.

### Motion

- **The wordmark at play** is the one animation driven by script: frames come from `requestAnimationFrame` only while the heading (the name and its art) is hovered or a tap plays it, its pace comes from the pointer's speed, and it never starts under `prefers-reduced-motion`. Every other motion is a CSS transition on the motion tokens.
- **Type that steps to fit.** Text that may not fit its box steps down a type ladder (sizes, largest first, in `src/lib/recipes.ts`) and takes the largest size at which it fits: never a size in between, and never clipped. Two mechanisms measure it, one per kind of box. `useFitStep` (`src/lib/fit-step.ts`) fits text in an island that clips its own box, re-measured on every render and on resize: the calculator's display on `NUMBER_SIZES`. `useFieldFit`, beside it, fits a field's whole row in one pass and a fixed order: the chip's name gives way first, then the number steps down `NUMBER_SIZES`. `fitPhrase` (`src/lib/wordmark-motion.ts`) fits a line laid over a fixed room, once per phrase: the wordmark on `WORDMARK_SIZES` through `fitSteps()`, which may also set two lines with `leading-tight` (`text-sm` and `text-base` keep two lines within the name's height, or nearly). A transform squeezes only a phrase too long at every step, which the wordmark lab flags and a browser test rejects. New text that must fit uses one of the two with a ladder, never a third way.
- **Nothing clips a moving line.** Before its line leaves the flow, the wordmark holds its box at the name's size, width and height, and releases it when the line settles home, so nothing beside it moves. It never clips the box, so descenders and tall symbols show whole; each frame fits by construction instead (a flipping letter is never wider than the room its phrase leaves).

- Components write `transition-colors` (or `transition-[border-color,box-shadow]`, `transition-transform`) and nothing else: the bridge makes every transition default to `--motion-fast` and `--motion-ease`.
- Buttons, chips, and shell edges fade; list rows and theme options change instantly, so keyboard movement never lags.
- Reduced motion zeroes the motion tokens with an unlayered rule placed after the theme imports (a layered rule loses to the themes' unlayered token blocks), and a blanket `!important` rule stops any other transition or animation. A browser test checks the tokens read `0ms` in every theme.

### Corners

An element inset inside a rounded shell uses the shell's radius minus the inset, border included, so the curves stay concentric; an inner corner as round as the outer one looks swollen.

- `rounded-nested`: inside a field or its list (`lg` shell, 2 px border, 8 px inset). The chip, the copy button (`Button nested`), and list rows.
- `rounded-nested-md`: inside a menu (`md` shell, 2 px border, 4 px gutter). The theme menu's options.

### Responsive layout

- **Decide by the box, not the layout.** Whether something fits is decided by measuring its own box (a field's number and chip, `useFieldFit`) or by its container's size (the header's menus, the start's tiles), never by which layout it is in, a breakpoint standing in for its width, or a count of characters, so one component reads right in a wide box and on a phone. Where the converter places its pieces lives in one place, as named class lists (`TABLE_GRID` and its cells in `TableLayout.tsx`), never inside a component.
- **Tiles by their container.** The start shows the categories two across, and four once the table's place, an `@container`, is 512 px wide (`@lg:grid-cols-4`): the smallest stock container size above the widest case, Theorem's "Temperature", which needs a container of 456 px. A browser test pins both sides in every theme, and the field's arrows read how many tiles sit in a row from the layout, never from a count.
- **A column beside the rows.** The converter from `md` is a grid of two columns and four rows, `auto auto auto 1fr`: the toolbar, the box, and the table (across the last two rows) in the first column, and the calculator in the second. The calculator's column and its card are subgrids of the first three rows (`TABLE_CALCULATOR_CELL`), so the card's three parts sit in them: its title row on the toolbar's line, its display level with the box, top and bottom, and its keys in the third row, whatever the widths or the theme. The card's top padding is 1 px there, so its title row never makes the first row taller, and the gaps inside the card are the title row's margin and the keys' (never the display's), so its display is exactly as tall as the box's row. The last row, `1fr`, takes the rest of a long table, so the card hugs its keys; a calculator taller than the box and the table adds its height under the table, never between the box and the table (docs/LEARNINGS.md, twice).
- **Ahead of a row of tools.** A control that leads a row of icon buttons (the category menu before the converter's tools) sits at the row's left and the tools at its right end while both fit; where they do not, the tools keep the line and the control wraps onto one of its own under them, both flush left. The control comes first in the markup, and `flex-wrap-reverse` with `justify-between` (`TABLE_TOOLS_ROW` in `TableLayout`) stacks a wrapped row's first line at the bottom and puts a line's one item at its start. The browser's own fit decides, in every theme, with no breakpoint to measure; a browser test pins both sides, and the toolbar's arrows follow what shows (ADR 0014). Introduced 2026-10-08 as a trial in its own commit, the control first at the row's end, then moved to its start the same day, as the more logical order of controls.
- **Switch at a container size, measured.** CSS cannot see a row wrap, so a row that must change layout when it no longer fits switches at the smallest stock container size above its widest case, not at a one-off breakpoint. The page header is an `@container`, and its menus switch at `@max-sm:`, 384 px of header, where Hardhat's name, the widest, needs 353 (452 while the layout switch stood beside the theme menu, ADR 0013). Browser tests pin both sides of the switch in every theme.
- **Columns across rows of buttons.** A list whose rows are buttons with a separate button beside each (the table's rows and their copy buttons), is one grid, each row and its main button spanning it with `grid-cols-subgrid`, so names, values, and symbols line up in columns while no control sits inside another.
- **As wide as the widest label.** A control whose label changes while it is used (the theme menu below `sm`, the category menu) takes its width from an unseen sizer in flow (`invisible grid h-0`) that stacks every label in one cell (`col-start-1 row-start-1`) with the control's padding and border, so it never jumps between labels.

### Fluid shells

A control that opens a list or panel keeps both in one shape, drawn over the page so nothing reflows. Its native semantics stay inside the shell (the theme menu is a `fieldset` of radios), because a native popup such as a `<select>`'s list is drawn by the OS, where no token reaches. Its recipes live in `src/lib/recipes.ts` and every instance builds from them:

- A **placeholder** with `group relative` and a fixed size holds the layout: `h-12` for the theme and category menus (the category menu as wide as its widest label, through an unseen sizer, and `w-56` while open, room for the counts), `size-12` for the shortcuts map. It carries `data-open` while open.
- The **shell** inside takes `SHELL` (2 px edge, `overflow-hidden`, and the open state: `z-20`, accent edge, `shadow-md`; no motion, since a shared part must not decide how a variant moves), one resting style, and its own position and radius.
  - `SHELL_BORDERED`: bordered at rest, `bg-surface`, accent on `focus-within`, and its edge eases between edge and accent, because the shell stays in view through the change. Fields (`rounded-lg`, plus `shadow-sm` at rest) and the theme and category menus (`rounded-md`, no resting shadow).
- A **menu** inside a shell is a trigger (`MENU_TRIGGER`: 44 px, the label muted and the value with its chevron, `MENU_CHEVRON`, at the right) over a `fieldset` of radios in `SHELL_PANEL`, each a label (`MENU_OPTION`: 44 px, `rounded-nested-md`, the checked one in the accent's soft fill, focus ringed inside). The theme menu and the category menu build from the same three.
  - `SHELL_GHOST`: a borderless icon button at rest that becomes a card when open. Nothing eases: its panel appears and vanishes at once, so its edge must too, or a fading accent square is left around the icon. A browser test checks the ghost edge cannot animate. The shortcuts map (`rounded-md`), anchored with `absolute top-0 right-0` so it grows left and takes its width from its panel.
- The list or panel renders inside the shell, in flow, under a `border-t` divider (`SHELL_PANEL` for a header menu's panel, which shows only while open). `overflow-hidden` clips it to the corners; the shell's own border is never clipped.

### Fields

The converter's box is `ValueField`, placed by `TableLayout`: it takes a shell's edge (`SHELL`, `SHELL_BORDERED`, `rounded-lg`, plus `shadow-sm`) without ever opening, its list being the table under it.

- **Row.** `FIELD_ROW` (`src/lib/recipes.ts`): 60 px tall inside the 2 px border, `pl-4 pr-2 gap-2`. The 44 px chip and trailing button keep the same 8 px from the top, bottom, and right edges, and the value starts 16 px in.
- **Text layer.** The value is drawn by an `aria-hidden` layer over an input whose own text is transparent (`text-transparent caret-ink selection:bg-accent-soft`). The input keeps the caret, selection, focus, mobile keyboards, and the accessibility tree; the layer gets the typography, which is how the exponent marker in `1.5E21` is `font-semibold` (core's parser reports where it is). The layer matches the input's font, size, and line box, follows its horizontal scroll, and is `pointer-events-none`.
- **Size steps.** `useFieldFit` (`src/lib/fit-step.ts`) picks the largest of the five `NUMBER_SIZES` (`text-2xl sm:text-3xl` down to `text-base`) at which the layer's text fits on one line, measured before paint on every render and whenever the row resizes (see "Type that steps to fit").
- **Chip.** Symbol, then plural, on one baseline (`items-baseline`). Its name gives way before the field's text steps down a size: the same measurement tries the row with the name, then without it (hidden, not removed, so it can be measured), so the name stays while the box has room, whatever the box's width.
- **Buttons inside a field** (the chip's two, copy) are out of the Tab order, because the field's own keys do the same jobs.
- **Category menu** at the left of the toolbar row over the box, its left edge on the box's, or on a line of its own under the tools, flush left, where the row has no room (see "Ahead of a row of tools"). It shows the category's name alone, as wide as the widest, so the row keeps it beside the tools as long as it can.

### Lists

- Rows sit in a `p-2` gutter, each `rounded-nested px-2`, so a highlight sits inside the edge with the same 8 px as the chip and the row text starts 16 px in, under the value.
- **Matched letters** are set heavier and nothing else changes: names `font-semibold`, category names `font-bold`, a symbol's matched part `text-ink`. The span comes from core's `matchSpan`.
- **The cursor's lists** (the table's units, the matches, and the start's tiles): cards with the same `p-2` gutter, each row `CURSOR_ROW` (`min-h-11 cursor-pointer rounded-nested px-2`). Their fill comes from `rowFill()`: the unit in the box in `bg-accent-soft`, the chip's color; the row the cursor is on, or the pointer is over, in `bg-surface-raised`, the muted tint of a hovered row, never an outline. The accent fill marks the selection, so the cursor takes the quieter tint. No transition, so keyboard movement never lags.
- **No value yet** is an em dash (`NO_VALUE` in the converter's state) in `text-ink-muted`, read as "no value" by screen readers, with an empty 44 px place where the copy button would be, so the columns never shift.
- **Matches** read "symbol name", both left-aligned (`grid-cols-[auto_minmax(0,1fr)] gap-x-3`), the symbol in `unitSymbol()`, matched letters heavier through `MatchedText`. Each category's group has a header, `text-xs font-medium text-ink-muted` with the name in ink and the count beside it, and a `border-line` divider over every group after the first.

### Icon buttons and the toolbar

- An icon-only action on the page is `Button variant="ghost" square` with an `aria-label`: undo, redo, clear all, copy (also `nested`, inside a field), Copy URL, and the shortcuts map at rest. One that can do nothing right now drops to 50 % opacity; in a toolbar it is `aria-disabled` rather than `disabled`, so it keeps its place in the toolbar's order.
- **A toolbar is one Tab stop.** The header's controls and the converter's tools are each a toolbar (`role="toolbar"`, named; ADR 0014), driven by the inline script in `Base.astro` like the header menus: ← and → (Home, End) move along its `[data-tool]` controls in the order they show, round from end to end, and the control last reached stays its Tab stop (a roving tabindex; before that its `data-default-tool`, or its first). ↑ and ↓ move between the page's planes (`[data-plane]`: the header, the converter's toolbar, and the box with its table), and Escape on a tool goes back to the box. A control joins a toolbar by carrying `data-tool` with its name; `CategoryMenu`'s `tool` prop does it for its trigger.
- **Slots.** A control an island owns but the static header shows (Copy URL) is drawn into a slot the markup reserves at its final size (`src/lib/slots.ts`, a portal), so it appears after hydration without moving anything and keeps the island's state at hand.
- **Edges line up, glyphs sit inside.** A row of ghost buttons meets the column's edge with its outer button's edge, not its glyph (the first button's at the left, the last's at the right end): a fill (switched on, hovered) then lines up with the box and the table under it, and the glyph sits inside the column as their text does (Sean, 2026-10-08).
- Groups in a toolbar are set apart by `ToolbarDivider` (`h-6 border-l border-line`): the calculator, then undo and redo, then clear all; the category menu leads the row (see "Ahead of a row of tools").
- **Switched on.** A ghost button that opens a panel or sets a mode takes `on` while it does (the calculator icon): the accent-soft fill, kept while hovered, alongside `aria-expanded` or `aria-pressed`.
- **Space by what shows.** A ghost icon's 20 px glyph sits 12 px inside its 44 px button, so the space people see between two icons is the gap plus 24 px. Next to a bordered control, which shows its edge, a row of ghost icons keeps the same visible rhythm: the edge sits as far from the last glyph as glyphs sit from each other. In the header that is 36 px both ways (icons `gap-2` inside their 48 px places, the theme menu `gap-5.5` after the icons; `HeaderMenus.astro`).
- A successful copy or send swaps the icon for `CopiedIcon`, the check in `text-success`, which every theme keeps at 3:1 on the surface (a graphic, WCAG 1.4.11); `useCopied` (`src/lib/copied.ts`) copies, shows it, and decides when it reverts. On a filled button, where the success color would not show, the plain `CheckIcon` takes the button's ink.
- Keycaps (`Keycap`) are `rounded-sm border border-line bg-surface-raised font-numeric text-xs`.

### Calculator

- A card: `CARD` with `p-3 shadow-sm`, in the `Calculator` component; while focus is inside it, where the keys go, its edge turns accent (`ACTIVE`: the border and `ring-1` in `--accent`, easing like a shell's edge), as a focused box's does. Introduced 2026-10-08 as a trial in its own commit. The converter places it with `CALCULATOR_PLACE`, at most `max-w-sm` wide: between the box and the table, flush left 16 px under the box, and from `md` in a column of its own (`w-72`) right of them, its parts lined up with the toolbar, the box, and the table (see "A column beside the rows").
- **Header**: the title "Calculator" (`text-sm font-medium text-ink-muted`, labelling the group) and a ghost close button.
- **Display**: a field's geometry, `rounded-lg border-2 border-edge bg-surface` around `FIELD_ROW`, so it is the same size as the box; the entry in `font-numeric` stepping down through `NUMBER_SIZES` (`src/lib/recipes.ts`) and keeping its end in view past the smallest; drawn by `NumberText`, so exponent markers and the running value look as they do in a box; a muted 0 when empty; at the row's right, why the entry has no value ("Too large"), in `text-sm font-medium text-danger`, like a table row's "Too large".
- **Keys** are `Button`s at `min-h-12` with `font-numeric text-lg`, four to a row (`gap-2`): digits secondary; C, ⌫, E, and the decimal mark `tonal`; the five operators `soft`; = primary.
- **Sending**: the `SendButton` under the keys, the row's width (`grid-flow-col auto-cols-fr`, so the gallery's two states share it); secondary, reading "Use" plus the box's unit symbol in semibold, with the copy check (`CopiedIcon`) while a send is confirmed, and `aria-disabled` while there is nothing to send.
- **Focus**: =, the send buttons, and close carry `data-calculator-stop`, the stops Tab cycles through; the other keys are `tabIndex={-1}`, reached by the arrow keys, which move by where each button sits (`nextInDirection` in `src/lib/spatial.ts`), never by an index. What Tab, Enter, a click, and a send do with focus is in docs/UX-SPEC.md §8.

### Links

- A link is ink, underlined in the accent (`underline decoration-accent decoration-2 underline-offset-4`), and at least 44 px tall when it stands on its own line (`inline-flex min-h-11 items-center`). The accent passes 3:1 against the page in every theme, enough for an underline, but not the 4.5:1 text needs, so the words stay ink. The one link today is the not-found page's way back.

### Copy

- **Sentence case** for every label, button, heading, message, and theme name: "Clear all", "Neo-noir", "Copy value". The only capitals inside a phrase are proper names.
- **Units follow the standards, not the sentence-case rule.** Symbols are case-sensitive and never altered: mL, kB, °F, km/h. Unit names are lowercase, including ones named after people (kelvin, newton), except "Celsius" and "Fahrenheit", which the SI Brochure and NIST write capitalized. Chips and rows show the plural name ("milliliters") next to the symbol.
- **Category names** are single capitalized words as labels: Length, Weight, Volume.
- **Short and plain.** No exclamation marks, no jargon in user-facing text. Error and empty-state text says what to try next.
- **Digit groups never break.** Where text may wrap, digits are grouped with U+202F, the narrow no-break space (the wordmark's lists write `_` for it), and a unit test rejects a plain space between two digits.

## Inventory

| Component         | Kind  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`          | TSX   | Native `<button>`, no runtime. `variant` (required): ghost, secondary (2 px edge), tonal (2 px edge on the raised surface, muted ink), soft (accent-soft fill), primary. `on` for a ghost button that is switched on; `aria-disabled` dims a button that should stay a Tab stop while it can do nothing. `square` for a lone icon with `aria-label`; `nested` inside a field                                                                                                                                                                                                                                                                              |
| `UnitChip`        | TSX   | The unit in the field, read like a list row: its symbol (`unitSymbol()`), then its name, on one baseline, which put the caret in the field, plus a 44 px remove control; `compact` hides the name, kept in the DOM so the field can measure it (`nameRef`), and leaves the symbol alone in ink. Both buttons stay out of the Tab order, since the field's own keys do their jobs                                                                                                                                                                                                                                                                          |
| `Keycap`          | TSX   | One key as printed; `label="Mod"` reads Ctrl, or ⌘ on Apple devices, and `label="Alt"` reads ⌥ there                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Wordmark`        | Astro | The site name with its theme art; hovering either plays it from `lib/wordmark.ts` (phrases, mix, type steps, frames) and `lib/wordmark-motion.ts` (fitting, pointer speed, timing, the art's symbol in `text-accent`), never under reduced motion. `manual` leaves it to the lab                                                                                                                                                                                                                                                                                                                                                                          |
| `ThemeArt`        | Astro | One small SVG per theme in its art tokens; all present on the page and shown by `in-data-[theme=…]`, or one alone with `theme` (the gallery). A `Record<ThemeId, …>` makes a new theme bring its art                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Calculator`      | TSX   | The calculator card: display, keys as native buttons 48 px tall in a labelled group, typed keys pressing them, the arrow keys moving between them, and a footer slot; `SendButton` is its "Use" button. What a key does is the caller's                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `NumberText`      | TSX   | A typed number as the converter draws it, in a field and in the calculator: exponent markers semibold, the running value of arithmetic muted. `runningValue()` gives that value                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ToolbarDivider`  | TSX   | The thin vertical rule between groups of icon buttons in a toolbar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ConversionTable` | TSX   | The table's units: a region named by its category (a heading for screen readers; on screen the category menu over the box names it), a card holding a grid whose rows each have the unit's cell (the value right-aligned on the left; on the right the symbol right-aligned on its last letter, an exponent hanging in a narrow column after it, and the name left-aligned; in subgrid columns) and a cell for its copy button; the value or a muted dash; the box's own unit in the accent-soft fill; a message in place of the rows when there is no answer. The field's cursor (`cursor`, `itemId`) moves through it; a click is the field's to act on |
| `ValueField`      | TSX   | The converter's box: a combobox input over the text layer, the chip, and a trailing slot, fitted by `useFieldFit`, its edge a shell's. What the keys do is its host's (`TableLayout`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CategoryMenu`    | TSX   | The converter's category menu: a fluid shell like the theme menu (`MENU_*` recipes), radios that the arrows move through without choosing, Enter or a click to choose, each choice's match count while a unit is typed. `tool` names its trigger as a toolbar's control (`data-tool`, ADR 0014)                                                                                                                                                                                                                                                                                                                                                           |
| `CategoryTiles`   | TSX   | The start, before any category: the categories as tiles, a listbox two across or four in a 512 px container, which the field's cursor moves through as a grid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `UnitMatches`     | TSX   | The matches for a typed unit: a listbox of groups, one per category with a header and count, each match its symbol then its name with matched letters heavier, or a category to open; no values                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `MatchedText`     | TSX   | A label with the part a query matched set heavier (core's `matchSpan`), for every list of matches                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `icons`           | TSX   | Inline SVG icons drawn for this project: close, copy, check (and `CopiedIcon`, the check in the success color), chevron down, undo, redo, eraser, keyboard, link, calculator, and backspace. Decorative, `aria-hidden`                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `PageHeader`      | Astro | The header every page shares: `Wordmark`, then `HeaderMenus`, in an `@container` row whose lines sit 20 px apart when the menus wrap. `actions` and `manual` pass through to them                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `HeaderMenus`     | Astro | The header's toolbar, the page's first plane (ADR 0014), its controls in their fixed order: the shortcuts map, the actions slot (`actions` prop; Copy URL on the converter page), then the theme menu. Below `sm` the theme menu sits 8 px from the icons (`gap-2`, 22 px seen), and in a header narrower than its container `sm` size, 384 px (`PageHeader` is an `@container`), the menus take their own line, flush left, theme menu first                                                                                                                                                                                                             |
| `ThemePicker`     | Astro | Fluid shell with a native radio group; the inline script opens it, applies and saves the choice, and lets arrow keys preview themes until Enter. Below `sm` an unseen sizer (every theme name stacked in one grid cell) makes it exactly as wide as the widest name, with the name centered                                                                                                                                                                                                                                                                                                                                                               |
| `ShortcutsHelp`   | Astro | Ghost icon button that grows into the shortcuts map from `src/lib/shortcuts.ts`; peeks on hover, pins on click; hidden on touch-first devices and below `sm`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

TSX components used in Astro files without a `client:` directive (the icons, `Button`, and `Keycap` inside the header menus) render to static HTML and ship no JavaScript. `TableLayout` lives in `features/converter/` because it composes the converter's state with these components. Arriving in milestone 3: a mode toggle; later, maybe, the calculator docked to the bottom of the screen on phones (docs/UX-SPEC.md §14).

## The gallery

`/dev/gallery` renders one card per theme, each pinned with `data-theme`, holding: the theme's art; the color tokens; a numeric type sample; the real box in frozen states (a long number with its exponent marker, a collapsed chip, and the copy check; arithmetic with its running value), the calculator mid-sum with one send confirmed beside one with nothing to send, and the table's pieces (the category menu before and after a choice, the start's tiles with the cursor on one, a table of values with the cursor on a row and a copy confirmed, a table of dashes, a message, and the matches for "250 p"), from `src/pages/dev/_gallery/FieldSamples.tsx`; the ghost icon buttons with a toolbar divider, one disabled and one switched on; the secondary and primary buttons; and keycaps. The page header (the wordmark, its art, and the menus) uses the page theme. axe checks the page in CI.

## Tuning labs

A visual or motion behavior with more than a couple of settings gets a lab page under `/dev`, so the owner tunes it by eye instead of by description: the real component in the page theme, every setting on a slider that shows its shipped value beside a changed one, settings that persist in that browser, and "Copy settings", which prints them as code to paste over the defaults, built from the settings objects' own keys so none is left out (a browser test checks every key). Every version that shipped stays loadable: when tuned settings ship, the ones they replace join the lab's presets under their version name (`src/pages/dev/_wordmark-lab/presets.ts`), so any earlier version can be compared or copied back as the defaults. A lab's controls live beside its page, in a folder named after it (`src/pages/dev/_wordmark-lab/`), use tokens like everything else, and are tools rather than design-system components, so they stay out of the gallery.

`/dev/wordmark-lab` is the first. It plays the header's wordmark with live settings (timing, pointer response, the mix of phrase kinds, the art's chances, the type steps), can play it without hovering, hold a phrase, show any phrase, or simulate pointer speed, and lists every phrase set in a box the name's size in the page theme. The sheet marks a phrase too long at every step, and a browser test fails if any theme has one.

## Brand assets

The mark is a big circle and a small one on one baseline, on a rounded tile in the accent: it reads like the name, big then small. `apps/web/scripts/brand-assets.mjs` draws it, and everything made from it, from the Daylight theme's tokens into `apps/web/public/`:

| File                   | Use                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `icon.svg`             | The tab icon, in browsers that take SVG                                                                                                 |
| `favicon.ico`          | The tab icon elsewhere, at 16 and 32 px                                                                                                 |
| `apple-touch-icon.png` | The home-screen icon on iOS: 180 px and square, since iOS rounds the corners itself                                                     |
| `og.png`               | The link preview, 1200 × 630: the mark beside the name and the line under it (`SITE.tagline` in `src/lib/site.ts`), in the display face |

Run `pnpm --filter @bigsmall/web brand` after changing the mark, the Daylight colors, the name, or the tagline, and commit what it writes. The files are images, so the token guard does not reach them; their colors come from the theme file. Introduced 2026-10-07 as a trial in its own commit: reverting it leaves the browser's default icon and no preview image.

## Adding a component

1. Check the inventory. Extend before you add.
2. Create `src/components/<Name>.tsx` (TSX: the React API, run on Preact, ADR 0007) or `<Name>.astro` (static, or driven by the inline script).
3. Style with the utilities above, the recipes, and the patterns in this file. Run `pnpm lint`.
4. Add it to `src/pages/dev/gallery.astro` in its real variants and states.
5. Run `pnpm e2e`. Fix any axe violation before merging.
6. Add a row to the inventory table.
