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

// Fluid shells (docs/DESIGN-SYSTEM.md, "Fluid shells"): a control and the list or panel it opens
// drawn as one shape over the page. The placeholder around a shell carries `group`, a fixed size,
// and `data-open` while open; the shell takes SHELL, one of the two resting styles, and its own
// position and radius. SmartInput (TSX) and the header menus (Astro, driven by the inline script
// in layouts/Base.astro) all build from these.

/** The edge, clip, and open state every shell shares: an accent edge and a shadow while open. */
export const SHELL =
  'overflow-hidden border-2 group-data-open:z-20 group-data-open:border-accent group-data-open:shadow-md';

/**
 * Bordered at rest (fields, the theme menu). The accent edge also shows keyboard focus inside,
 * and it eases between edge and accent because the shell itself stays in view.
 */
export const SHELL_BORDERED =
  'border-edge bg-surface transition-[border-color,box-shadow] focus-within:border-accent';

/**
 * A borderless icon button at rest (the shortcuts map) that becomes a card when open. No
 * transition: its panel appears and vanishes at once, so an edge that faded would be left behind
 * as a green square around the icon (docs/LEARNINGS.md, "A focus-within edge lingers").
 */
export const SHELL_GHOST = 'border-transparent group-data-open:bg-surface';

/** A header menu's panel: hidden at rest, under a divider once its shell opens. */
export const SHELL_PANEL = 'hidden border-t border-line group-data-open:block';

// Fields (docs/DESIGN-SYSTEM.md, "Fields")

/**
 * The row inside a field's shell: 60 px tall inside the 2 px border, the value 16 px in, and the
 * chip and trailing button 8 px from the top, bottom, and right. The calculator's display uses it
 * too, so it is the same size as the boxes.
 */
export const FIELD_ROW = 'flex h-15 items-center gap-2 pr-2 pl-4';

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
