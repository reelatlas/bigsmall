/**
 * The converter's two layouts (ADR 0009, docs/UX-SPEC.md §1): the table, the default, and two
 * boxes. The choice is saved like the theme, and the inline script in layouts/Base.astro applies
 * it to `<html data-layout>` before the page paints, so a saved choice never flashes the other.
 */

export type Layout = 'table' | 'boxes';

export const LAYOUT_STORAGE_KEY = 'bigsmall:layout';

export const DEFAULT_LAYOUT: Layout = 'table';

/** The switch's options, in the order it shows them. */
export const LAYOUTS: readonly { id: Layout; name: string }[] = [
  { id: 'table', name: 'Table' },
  { id: 'boxes', name: 'Two boxes' },
];

/** The layout the inline script applied, or the one the switch last set. Browser only. */
export function appliedLayout(): Layout {
  return document.documentElement.dataset['layout'] === 'boxes' ? 'boxes' : DEFAULT_LAYOUT;
}

/** Applies a layout to the page and saves it; with storage blocked it still applies, unsaved. */
export function applyLayout(layout: Layout): void {
  document.documentElement.dataset['layout'] = layout;
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  } catch {
    // Storage is blocked (a private window, say): the choice lasts until the page closes.
  }
}
