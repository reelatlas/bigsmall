/**
 * The fluid shell (docs/DESIGN-SYSTEM.md, "Fluid shells"): a control and the list or panel it
 * opens drawn as one shape over the page. The placeholder around it carries `group`, a fixed
 * size, and `data-open` while open; the shell takes SHELL, one of the two resting styles, and its
 * own position and radius. SmartInput (TSX) and the header menus (Astro, driven by the inline
 * script in layouts/Base.astro) all build from these, so the shape never drifts between them.
 */

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

/**
 * The row inside a field's shell: 60 px tall inside the 2 px border, the value 16 px in, and the
 * chip and trailing button 8 px from the top, bottom, and right (docs/DESIGN-SYSTEM.md, "Fields").
 */
export const FIELD_ROW = 'flex h-15 items-center gap-2 pr-2 pl-4';
