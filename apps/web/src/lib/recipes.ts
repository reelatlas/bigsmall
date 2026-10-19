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

/** A card: one raised area of related controls (the side panels through PANEL_CARD, the labs'). */
export const CARD = 'rounded-lg border border-line bg-surface';

/**
 * The card of the table's place (the start's tiles, the category's units, the matches), the list
 * the box's cursor moves through: a control's 2 px edge, like the box above it, since it is the
 * box's popup (ADR 0012) and holds the rows people pick. Its rows' corners nest in it
 * (rounded-nested). Sean, 2026-10-08. The edge itself is FIELD_EDGE, a field's resting edge,
 * which the calculator's display takes too (docs/DESIGN-SYSTEM.md, "Calculator").
 */
export const FIELD_EDGE = 'rounded-lg border-2 border-edge bg-surface';
export const LIST_CARD = FIELD_EDGE;

/**
 * A panel's title, naming its group as a label names what it labels: the calculator's and the
 * shortcuts map's, muted so the panel's content leads.
 */
export const PANEL_TITLE = 'text-sm font-medium text-ink-muted';

/** A group's title, a step smaller: Units' and Display's legends, the matches' groups. */
export const GROUP_TITLE = 'text-xs font-medium text-ink-muted';

/** A count beside a label (Hidden's, Units' reset, the matches' groups): its digits at the regular weight. */
export const COUNT = 'font-numeric font-normal';

/** A line over a row or a foot that fills, 4 px from it; each use sets its own margin. */
export const ROW_RULE = 'border-t border-line pt-1';

/**
 * A side panel while focus is inside it, where the keys go (the calculator, Settings' Units and
 * Display): its edge turns accent, 2 px like a focused box (its 1 px border and a 1 px ring, so
 * nothing moves), easing as the shells' edges do.
 */
const PANEL_ACTIVE =
  'transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-1 focus-within:ring-accent';

/** A side panel's card, the calculator's and Settings' (SidePanel): its accent edge while it has the keys. */
export const PANEL_CARD = cx(CARD, 'p-3 shadow-sm', PANEL_ACTIVE);

/** The row over a side panel's content: its title, then its close button at the right. */
export const PANEL_HEAD = 'mb-2 flex items-center justify-between';

/** A side panel's title, set in to line up with its content. */
export const PANEL_HEADING = cx('pl-1', PANEL_TITLE);

/**
 * A page's column, under its header: the main content's and the footer's. Full width up to its
 * own, since in the body's column (Base.astro) side margins of auto would shrink it to its content.
 * Its size is the stock one above the converter's column, a side panel, and their gutters
 * (576 + 16 + 320, and 16 each side; 896 until 2026-10-17, when the box gave up 48 px beside an
 * open panel); since 2026-10-18 the converter page's main spans the window instead
 * (CONVERTER_MAIN), so a panel may use the window's margin, and this column bounds the other pages
 * and their footer (the converter page's is CONVERTER_FOOT). Centered with its left edge on a
 * whole pixel (`mx-page`, global.css), since the scrollbar's room or an odd window would otherwise
 * put the column on a half.
 */
export const PAGE_COLUMN = 'mx-page w-full max-w-5xl px-frame';

/**
 * A page's main column (About, 404, and the dev pages; the converter page's is CONVERTER_MAIN),
 * with the page's frame: the frame token (--page-frame, global.css: Material's layout margin, 16
 * px on a phone and 24
 * from sm), PAGE_COLUMN's gutter sideways and this at the top, which the header's row sits on,
 * and at the bottom 48 px (pb-12), so a long page's content ends clear of the foot, which sits on
 * the frame itself (Sean, 2026-10-18: the foot hugged the last card; three frames, tried first,
 * read too big beside a desktop's table; 48, the section step's compact value, right on both)
 * (docs/DESIGN-SYSTEM.md, "The page's two ends mirror"; Sean, 2026-10-18: one logic on every
 * side and every screen, a standard's ratio where it scales, nothing of its own over the header).
 */
const MAIN_ENDS = 'pt-frame pb-12';
export const PAGE_MAIN = cx(PAGE_COLUMN, MAIN_ENDS);

/**
 * The content column, one width on every page (Sean, 2026-10-18): the converter's toolbar, box,
 * and table with the header over them, and About's header, tabs, and privacy line, capped at the
 * xl container size, 576 px, the narrowest stock width at which the box keeps every unit's name
 * beside a ten-digit number (measured 2026-10-17: at 528 px four of the eight longest names drop;
 * docs/DESIGN-SYSTEM.md, "A column beside the rows"), and centered on every page, so the header
 * sits in one place from page to page (Sean, 2026-10-18); on the converter page it is the second
 * track of the page's grid, after the page's margin, a side panel's track third (CONVERTER_GRID).
 */
export const CONTENT_COLUMN = 'mx-auto w-full max-w-xl';

/**
 * The converter page's main from md: the page's frame as padding (48 px at the bottom, as
 * PAGE_MAIN) and a grid of three tracks (`grid-cols-margin-box-and-side` in global.css): the
 * page's margin, the content column's cap,
 * then a side panel's own width. Not the page column (PAGE_COLUMN), since the panel may sit past
 * it in the window's margin. With no panel the column sits where it does on every page, centered;
 * a panel opening beside the box takes the window's margin first, and the column slides left only
 * by what the panel still lacks: nothing in a wide window (from about 1310 px), as little as it
 * takes below, the box keeping its width wherever the window holds both and giving way below about
 * 960 px (a trial, Sean, 2026-10-18: no movement where there is room; that morning the pair
 * re-centered, the column sliding 168 px on every opening; from 2026-10-17 a track stood empty
 * beside the column). The panel carries the step between them, so an empty track is no width.
 * Every block between the page and the layout's cells spans the three tracks and hands them on
 * (IN_CONVERTER_GRID); the column's cells sit in the second track (COLUMN_CELL) and the panel in
 * the third. The footer under the page is the same grid (CONVERTER_FOOT), its line in the column's
 * track, so it follows the column when a panel slides it (Sean, 2026-10-18).
 */
const CONVERTER_GRID = 'md:grid md:grid-cols-margin-box-and-side';
export const CONVERTER_MAIN = cx('w-full px-frame', MAIN_ENDS, CONVERTER_GRID);
export const IN_CONVERTER_GRID = 'md:col-span-3 md:grid md:grid-cols-subgrid';
/** A cell of the converter's column: the grid's second track, after the page's margin. */
export const COLUMN_CELL = 'md:col-start-2';
/**
 * The footer's own: on the page's frame (pb-frame), in the small size (SiteFooter). Its place in
 * the body's column, after the content or at the window's bottom, is Base.astro's to give
 * (`mt-auto`), as whoever places a component spaces it (component rule 13).
 */
export const FOOT = 'pb-frame text-sm';
/**
 * The converter page's footer: the same three tracks as its main (CONVERTER_GRID), its line in
 * the column's track (COLUMN_CELL), so the About link starts where the name does and follows the
 * column when a panel slides it (Sean, 2026-10-18: the foot aligned to the column wherever it
 * is). The other pages' footer sits on the page column (SiteFooter).
 */
export const CONVERTER_FOOT = cx(FOOT, 'w-full px-frame', CONVERTER_GRID);

/**
 * A section's name stuck under the box while the table scrolls (docs/UX-SPEC.md §1; Sean,
 * 2026-10-17, kept the same day), the canvas behind it. The stuck layers, lowest to highest: the
 * rows (no z-index), a section's name (5), the head, the toolbar and the box (10,
 * `TABLE_HEAD_CELL` in TableLayout), and an open shell over all of them (`SHELL`, 20). Its `top`
 * is set in line, from the box's measured height.
 */
export const STUCK_HEADING = 'sticky z-5 bg-canvas';

/**
 * A section's heading on a page: About's sketchbook (centered there), the not-found page's, and
 * the gallery's theme names.
 */
export const SECTION_HEADING = 'font-display text-xl font-semibold';

/**
 * A disclosure's row, its chevron 4 px in: Every formula's categories, and Show all over them,
 * which takes their look so its chevron sits over theirs (Sean, 2026-10-16). The hand comes from
 * the base rule, as on every control (docs/DESIGN-SYSTEM.md, "Cursors").
 */
export const DISCLOSURE = 'flex min-h-11 items-center gap-3 px-1';

// A link standing on its own line (docs/DESIGN-SYSTEM.md, "Links"): ink, underlined in the accent,
// 44 px tall. The not-found page's way back.
export const LINK =
  'inline-flex min-h-11 items-center font-medium underline decoration-accent decoration-2 underline-offset-4';

// A link out of the way, the footer's (Sean, 2026-10-15): muted ink and no underline at rest, and
// on hover or keyboard focus a link's ink and accent underline, faded in. It stands alone, so no
// text around it needs telling apart from it (docs/DESIGN-SYSTEM.md, "Links").
export const QUIET_LINK =
  'inline-flex items-center py-3 -my-3 text-sm text-ink-muted underline decoration-transparent decoration-2 underline-offset-4 transition-[color,text-decoration-color] hover:text-ink hover:decoration-accent focus-visible:text-ink focus-visible:decoration-accent';

// A link inside a muted sentence (docs/DESIGN-SYSTEM.md, "Links"): at rest the sentence's own
// muted ink and no underline, so the line reads as plain text, and on hover or focus a link's ink
// and accent underline, faded in, as the footer's quiet link does (Sean, 2026-10-18: the names are
// a courtesy, not a way anywhere; WCAG 1.4.1 noted, his call). Inline, so no 44 px of its own:
// its target is the line's (WCAG 2.5.8's inline exception). The privacy line's two names.
export const INLINE_LINK =
  'underline decoration-transparent decoration-2 underline-offset-4 transition-[color,text-decoration-color] hover:text-ink hover:decoration-accent focus-visible:text-ink focus-visible:decoration-accent';

// Fluid shells (docs/DESIGN-SYSTEM.md, "Fluid shells"): a control and the list or panel it opens
// drawn as one shape over the page. The placeholder around a shell carries `group`, a fixed size,
// and `data-open` while open; the shell takes SHELL, its own resting style beside its one use
// (the box's bordered edge in ValueField, the shortcuts map's ghost in ShortcutsHelp), and its own
// position and radius. The box, the menus, and the shortcuts map all build from these.

/**
 * The edge and open state every shell shares: an accent edge and a shadow while open. Each shell
 * clips as its shape needs, the box always, the shortcuts map only while open, so the focus ring
 * around its icon at rest is not cut off (Sean, 2026-10-15).
 */
export const SHELL =
  'border-2 group-data-open:z-20 group-data-open:border-accent group-data-open:shadow-md';

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
 * A row holding a control, filled as the table's cursor fills a row: under the pointer, and while
 * its control has the keyboard's focus, whose own ring stays (Sean, 2026-10-15). A whole row is the
 * target, so the whole row says which one is meant.
 */
export const CHOICE_FILL = 'hover:bg-surface-raised has-focus-visible:bg-surface-raised';

/** A row in a list of choices: 44 px tall, in the nested corner (a setting's row, a menu's choice, More's items). */
export const CHOICE_ROW = 'flex min-h-11 items-center rounded-nested-md px-2 text-sm text-ink';

/** A choice someone picks, with a pointer's cursor. */
const OPTION_BASE = cx(CHOICE_ROW, 'cursor-pointer');

/**
 * A setting's row, a checkbox's with its words 8 px from it, filled under the pointer and while
 * its control has focus (CHOICE_FILL).
 */
export const OPTION_ROW = cx(OPTION_BASE, 'gap-2', CHOICE_FILL);

/**
 * A menu's choice: a label around its visually hidden radio, the checked one in the accent's soft
 * fill, the raised surface under the pointer. Focus moves with the choice, so it is ringed inside
 * rather than filled, and the accent stays.
 */
export const MENU_OPTION = cx(
  OPTION_BASE,
  'focus-ring-within-inset hover:bg-surface-raised has-checked:bg-accent-soft',
);

// Fields (docs/DESIGN-SYSTEM.md, "Fields")

/**
 * The row inside a field's shell: 60 px tall inside the 2 px border, the value 16 px in, and the
 * chip and trailing button 8 px from the top, bottom, and right. The calculator's display uses it
 * too, so it is the same size as the boxes.
 */
export const FIELD_ROW = 'flex h-15 items-center gap-2 pr-2 pl-4';

/**
 * A text field of a form (the feedback form's Your email and Message; the labs' controls take the
 * same): its label over its input in a stack, the input 44 px with the fields' 2 px edge on the
 * surface, a message 128 px tall with the row's vertical padding. The input's text is 16 px
 * (`text-base`), the size under which a phone zooms into a focused field and hides what is typed
 * (Sean, 2026-10-17; docs/LEARNINGS.md); the label stays 14.
 */
export const FIELD_STACK = 'grid gap-1 text-sm';
export const FIELD_LABEL = 'text-sm font-medium';
export const TEXT_INPUT =
  'min-h-11 min-w-0 rounded-md border-2 border-edge bg-surface px-3 text-base text-ink';
export const TEXT_AREA = cx(TEXT_INPUT, 'min-h-32 py-2');

// Text

/**
 * A unit's symbol, wherever it shows (the chip, the lists, the table, the matches): semibold in
 * equal-width digits, on one line, muted beside its name, in ink when it stands alone (a collapsed
 * chip).
 */
export function unitSymbol(alone = false): string {
  return cx('font-numeric font-semibold whitespace-nowrap', alone ? 'text-ink' : 'text-ink-muted');
}

/** A unit's name beside its symbol: in the ink, or kept for screen readers alone (Symbol only). */
export function unitName(shown: boolean): string {
  return shown ? 'min-w-0 text-ink' : 'sr-only';
}

/**
 * Why a value has no answer, said short in its place ("Too large"): a table row's, and the
 * calculator display's at its right.
 */
export const NO_ANSWER = 'text-sm font-medium text-danger';

/** A message in place of a list's rows (no answer, no match), set in the rows' gutter. */
export const LIST_MESSAGE = 'px-2 py-2.5';

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
