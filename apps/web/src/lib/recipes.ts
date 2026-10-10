/**
 * Class recipes (docs/DESIGN-SYSTEM.md, "Recipes"): the class lists more than one file builds
 * from, written once so a shared shape never drifts between Astro and TSX. A list only one file
 * uses stays in that file, as an UPPER_SNAKE constant beside its markup. Recipes hold tokens only,
 * like any class list (CLAUDE.md rule 3). TSX joins them with cx(), Astro with class:list.
 *
 * A recipe holds only what every use shares: a part that one use needs and another must not have
 * (an edge that fades, say) belongs to that use or to a variant recipe (docs/LEARNINGS.md,
 * "Merging recipes can undo a fix").
 */

/** Joins class lists, leaving out any a condition turned off. */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// Surfaces

/** A card: one raised area of related controls (the calculator, the wordmark lab's panels). */
export const CARD = 'rounded-lg border border-line bg-surface';

/**
 * The card of the table's place (the start's tiles, the category's units, the matches), the list
 * the box's cursor moves through: a control's 2 px edge, like the box above it, since it is the
 * box's popup (ADR 0012) and holds the rows people pick. Its rows' corners nest in it
 * (rounded-nested). Sean, 2026-10-08.
 */
export const LIST_CARD = 'rounded-lg border-2 border-edge bg-surface';

/**
 * A panel's title, naming its group as a label names what it labels: the calculator's and the
 * shortcuts map's, muted so the panel's content leads.
 */
export const PANEL_TITLE = 'text-sm font-medium text-ink-muted';

// Fluid shells (docs/DESIGN-SYSTEM.md, "Fluid shells"): a control and the list or panel it opens
// drawn as one shape over the page. The placeholder around a shell carries `group`, a fixed size,
// and `data-open` while open; the shell takes SHELL, one of the two resting styles, and its own
// position and radius. The fields (ValueField), the category menu (TSX), and the header menus
// (Astro, driven by the inline script in layouts/Base.astro) all build from these.

/** The edge, clip, and open state every shell shares: an accent edge and a shadow while open. */
export const SHELL =
  'overflow-hidden border-2 group-data-open:z-20 group-data-open:border-accent group-data-open:shadow-md';

/**
 * Bordered at rest (fields, the theme and category menus). The accent edge also shows keyboard
 * focus inside, and it eases between edge and accent because the shell itself stays in view.
 */
export const SHELL_BORDERED =
  'border-edge bg-surface transition-[border-color,box-shadow] focus-within:border-accent';

/**
 * A borderless icon button at rest (the shortcuts map) that becomes a card when open. No
 * transition: its panel appears and vanishes at once, so an edge that faded would be left behind
 * as a green square around the icon (docs/LEARNINGS.md, "A focus-within edge lingers").
 */
export const SHELL_GHOST = 'border-transparent group-data-open:bg-surface';

/** A menu's panel: hidden at rest, under a divider once its shell opens. */
export const SHELL_PANEL = 'hidden border-t border-line group-data-open:block';

// Menus (docs/DESIGN-SYSTEM.md, "Fluid shells"): a trigger and a group of radios in one shell,
// shared by the theme menu (ThemePicker.astro) and the category menu (CategoryMenu.tsx).

/** A menu's root: the toolbar row's height, holding the sizer in flow and the shell over it. */
export const MENU_ROOT = 'group relative h-12';

/**
 * A menu's sizer, unseen: every label stacked in one cell (`MENU_SIZER_LABEL`), at the trigger's
 * padding and type, so the menu is as wide as its widest label, open or closed.
 */
export const MENU_SIZER = 'invisible grid h-0 overflow-hidden px-3 text-sm';

/** One label in a menu's sizer, the chevron's room after it (a `size-4` span). */
export const MENU_SIZER_LABEL = 'col-start-1 row-start-1 flex items-center gap-2';

/**
 * A ghost menu's shell (the theme and category menus): nothing at rest, so its trigger is
 * all there is to see; open, a card around the trigger and its list, the same size. The card's
 * accent edge is a 2 px outline drawn inside its edge: like a border, nothing inside can paint over
 * it, and unlike one it takes no room, so nothing moves when it appears. Nothing clips at rest, so
 * the trigger's focus ring shows whole.
 */
export const MENU_SHELL =
  'absolute inset-x-0 top-0 rounded-md group-data-open:z-20 group-data-open:overflow-hidden group-data-open:bg-surface group-data-open:shadow-md group-data-open:outline-2 group-data-open:-outline-offset-2 group-data-open:outline-accent';

/**
 * A menu's trigger, as wide as the menu, which is as wide as its widest label: a ghost button, 44
 * px, with a ghost button's corners, tint, and focus ring, covering the whole menu, 12 px from each
 * edge to the label and the chevron, open or closed. Open, it is the card's top row.
 */
export const MENU_TRIGGER =
  'my-0.5 flex h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-ink transition-colors hover:bg-surface-raised group-data-open:rounded-b-none';

/** The chevron at a trigger's end, turned over while the menu is open; it never moves. */
export const MENU_CHEVRON =
  'ml-auto shrink-0 text-ink-muted transition-transform group-data-open:rotate-180';

/**
 * A row in a list of choices: 44 px tall, in the nested corner, the raised surface under the
 * pointer. A menu's choice, a setting's switch, a setting's checkbox.
 */
export const OPTION_ROW =
  'flex min-h-11 cursor-pointer items-center rounded-nested-md px-2 text-sm text-ink hover:bg-surface-raised';

/** A menu's choice: a label around its visually hidden radio, the checked one in the accent's soft fill. */
export const MENU_OPTION = cx(OPTION_ROW, 'focus-ring-within-inset has-checked:bg-accent-soft');

// Fields (docs/DESIGN-SYSTEM.md, "Fields")

/**
 * The row inside a field's shell: 60 px tall inside the 2 px border, the value 16 px in, and the
 * chip and trailing button 8 px from the top, bottom, and right. The calculator's display uses it
 * too, so it is the same size as the boxes.
 */
export const FIELD_ROW = 'flex h-15 items-center gap-2 pr-2 pl-4';

// Text

/**
 * A unit's symbol, wherever it shows (the chip, the lists, the table, the matches): semibold in
 * equal-width digits, muted beside its name, in ink when it stands alone (a collapsed chip).
 */
export function unitSymbol(alone = false): string {
  return cx('font-numeric font-semibold', alone ? 'text-ink' : 'text-ink-muted');
}

/**
 * Why a value has no answer, said short in its place ("Too large"): a table row's, and the
 * calculator display's at its right.
 */
export const NO_ANSWER = 'text-sm font-medium text-danger';

// Lists a field's cursor moves through (docs/DESIGN-SYSTEM.md, "Lists"): the table, the matches,
// and the start's categories, whose rows the arrows reach while the caret stays in the field.

/** A row the cursor moves through: 44 px, inset in the card's gutter, its corners nesting in the card's. */
export const CURSOR_ROW = 'min-h-11 cursor-pointer rounded-nested px-2';

/**
 * A cursor row's fill: the unit in the box in the accent's soft tint, the chip's color; the row
 * the cursor is on, or the pointer is over, in the muted tint of a hovered row. Never an outline.
 */
export function rowFill(selected: boolean, current: boolean): string {
  if (selected) return 'bg-accent-soft';
  return current ? 'bg-surface-raised' : 'hover:bg-surface-raised';
}

// Type ladders (docs/DESIGN-SYSTEM.md, "Type that steps to fit"): the sizes text steps down
// through, largest first, until it fits. useFitStep (lib/fit-step.ts) fits a ladder in an island;
// fitPhrase (lib/wordmark-motion.ts) fits the wordmark's.

/** A number in a field or in the calculator's display: one line, a size smaller on phones. */
export const NUMBER_SIZES = [
  'text-2xl sm:text-3xl',
  'text-xl sm:text-2xl',
  'text-lg sm:text-xl',
  'text-base sm:text-lg',
  'text-base',
] as const;

/**
 * A wordmark phrase (lib/wordmark.ts, fitSteps), from the name's own size down, so a short swap
 * stays as large as the name and an equation or idiom takes a smaller size.
 */
export const WORDMARK_SIZES = [
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-base',
  'text-sm',
] as const;
export type WordmarkSize = (typeof WORDMARK_SIZES)[number];

// The wordmark (docs/UX-SPEC.md §1)

/** The name's face, at any size: the header sets it at the ladder's first size. */
export const WORDMARK_FACE = 'font-display font-semibold tracking-tight';

/**
 * The live line while the wordmark plays: over the held box, centered on it, sized by a step.
 * The lab's sheet sets phrases the same way.
 */
export const PLAYING_LINE =
  'absolute inset-y-0 left-0 flex origin-left items-center text-left whitespace-pre';

/** The line over the theme art that shows the symbol the art flips to; the motion shows and hides it. */
export const ART_LINE = 'absolute inset-0 items-center justify-center whitespace-pre text-accent';
