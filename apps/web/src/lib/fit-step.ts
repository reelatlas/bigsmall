import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { cx } from './recipes';

/**
 * Text that steps down a type ladder to fit (docs/DESIGN-SYSTEM.md, "Type that steps to fit"):
 * its element, its full class list without the size step, and the ladder (class lists, largest
 * first, such as NUMBER_SIZES in lib/recipes.ts). The element must clip (`overflow-hidden`) and
 * keep its content on one line (`whitespace-pre` or `whitespace-nowrap`).
 */
export interface FitText {
  ref: RefObject<HTMLElement | null>;
  base: string;
  steps: readonly string[];
}

/** Puts the element at one step of its ladder and says whether its text then fits its width. */
function fitsAt(element: HTMLElement, text: FitText, step: number): boolean {
  element.className = cx(text.base, text.steps[step]);
  return element.scrollWidth <= element.clientWidth;
}

/**
 * The largest step at which the text fits, left on its element; null, the text left at the last
 * step, when none does.
 */
function largestFitting(text: FitText): number | null {
  const element = text.ref.current;
  if (!element) return null;
  for (let step = 0; step < text.steps.length; step += 1) {
    if (fitsAt(element, text, step)) return step;
  }
  return null;
}

/** The largest step at which the text fits, left on its element; the last when none does. */
function largestFit(text: FitText): number {
  return largestFitting(text) ?? Math.max(0, text.steps.length - 1);
}

/** Whether an element's text shows whole on its one line, not cut short; true with no element. */
function whole(element: HTMLElement | null | undefined): boolean {
  return !element || element.scrollWidth <= element.clientWidth;
}

/**
 * Runs `fit` before paint after every render, and again whenever `observed` changes width or the
 * theme changes, so text shrinks as it grows, takes the room back when its box widens, and fits
 * each theme's fonts, which change what fits without resizing anything. A change of height alone
 * is left out: every fit here is a matter of width, and a field's row grows taller as it wraps.
 */
export function useRefit(fit: () => void, observed: RefObject<HTMLElement | null>) {
  useLayoutEffect(fit);

  useEffect(() => {
    const element = observed.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    let width = -1;
    const resizes = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      fit();
    });
    resizes.observe(element);
    const themes = new MutationObserver(fit);
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      resizes.disconnect();
      themes.disconnect();
    };
  }, [observed, fit]);
}

/**
 * Picks the largest step of `steps` at which the element's content fits its width on one line;
 * `base` is its full class list without the size step (see FitText).
 *
 * The measurement writes the element's class directly, then the chosen step is rendered through
 * the island with the identical string, so the DOM and the tree never disagree.
 */
export function useFitStep(
  ref: RefObject<HTMLElement | null>,
  base: string,
  steps: readonly string[],
): number {
  const [step, setStep] = useState(0);

  const fit = useCallback(() => {
    if (ref.current) setStep(largestFit({ ref, base, steps }));
  }, [ref, base, steps]);

  useRefit(fit, ref);
  return step;
}

/**
 * How a field's row fits: how many of the parts that give way have (the chip's name, then a second
 * pill's chevron), the text's step, and, in a row with a second pill, whether the pills take a line
 * of their own under the text.
 */
export interface FieldFit {
  gaveWay: number;
  step: number;
  wrap: boolean;
}

/**
 * Measures a field's row, always from one line with every part shown, so the answer never flips
 * back and forth. There, does the text fit at its largest size, and a second pill's name (Cooking's
 * ingredient, ADR 0021) whole? If not, the parts give way in their order, the chip's name first:
 * with one pill, all of them, and the text takes the largest step that fits; with a second, one at
 * a time, the row staying one line as soon as the text fits at some step with that pill whole.
 * Where it fits at none, the pills take a line of their own under the text (`data-wrap` on the
 * row), the parts back there as far as both pills fit whole. Leaves the row, the parts, and the
 * text as chosen.
 */
function fitField(
  partRefs: readonly RefObject<HTMLElement | null>[],
  text: FitText,
  otherRef?: RefObject<HTMLElement | null>,
  rowRef?: RefObject<HTMLElement | null>,
): FieldFit {
  const element = text.ref.current;
  const other = otherRef?.current;
  // Only a row with a second pill ever wraps.
  const row = other ? rowRef?.current : null;
  const parts = partRefs.map((part) => part.current);
  /** The first `count` parts hidden, the rest shown. */
  const giveWay = (count: number) =>
    parts.forEach((part, at) => {
      if (part) part.hidden = at < count;
    });
  giveWay(0);
  row?.removeAttribute('data-wrap');
  if (!element || (fitsAt(element, text, 0) && whole(other))) {
    return { gaveWay: 0, step: 0, wrap: false };
  }
  if (!row) {
    giveWay(parts.length);
    return { gaveWay: parts.length, step: largestFit(text), wrap: false };
  }
  for (let count = 1; count <= parts.length; count += 1) {
    giveWay(count);
    const step = whole(other) ? largestFitting(text) : null;
    if (step !== null) return { gaveWay: count, step, wrap: false };
  }
  row.setAttribute('data-wrap', '');
  giveWay(0);
  const step = largestFit(text);
  for (let count = 0; count < parts.length; count += 1) {
    giveWay(count);
    if (whole(other)) return { gaveWay: count, step, wrap: true };
  }
  giveWay(parts.length);
  return { gaveWay: parts.length, step, wrap: true };
}

/**
 * Fits a field's row (docs/DESIGN-SYSTEM.md, "Fields"): the chip's name gives way before the
 * field's text steps down, so the name stays while the row has room for it and the text at its
 * largest size, in a field of any width. `text` is the field's text layer on its ladder; `parts`
 * are what gives way, in order (the chip's name, then a second pill's chevron), which the
 * measurement hides and shows itself as useFitStep writes classes (the field renders them with
 * the same `hidden`, the first `gaveWay` of them); `row` is the row, whose changes of width refit
 * the field; `other` a second pill's name, which the parts give way to as well where it would be
 * cut short, and beside which the row may wrap, the measurement setting `data-wrap` on the row as
 * the field renders it. `parts` must keep its identity between renders.
 */
export function useFieldFit(
  row: RefObject<HTMLElement | null>,
  parts: readonly RefObject<HTMLElement | null>[],
  text: FitText,
  other?: RefObject<HTMLElement | null>,
): FieldFit {
  const [fit, setFit] = useState<FieldFit>({ gaveWay: 0, step: 0, wrap: false });

  const refit = useCallback(() => {
    const next = fitField(parts, text, other, row);
    setFit((current) =>
      current.gaveWay === next.gaveWay && current.step === next.step && current.wrap === next.wrap
        ? current
        : next,
    );
  }, [parts, text, other, row]);

  useRefit(refit, row);
  return fit;
}

/**
 * Shows every column that may give way, then hides them in the order named until each cell still
 * shown fits its width on one line; a column's stand-ins show where it hides. Leaves the cells as
 * chosen and returns the columns hidden, or null while the grid is not drawn.
 */
function fitColumns(
  grid: RefObject<HTMLElement | null>,
  columns: readonly string[],
): string[] | null {
  const element = grid.current;
  if (!element) return null;
  const cells = (column: string) => [
    ...element.querySelectorAll<HTMLElement>(`[data-column="${column}"]`),
  ];
  const standIns = (column: string) => [
    ...element.querySelectorAll<HTMLElement>(`[data-instead="${column}"]`),
  ];
  const show = (column: string, shown: boolean) => {
    for (const cell of cells(column)) cell.hidden = !shown;
    for (const cell of standIns(column)) cell.hidden = shown;
  };
  for (const column of columns) show(column, true);
  const hidden: string[] = [];
  for (const column of columns) {
    const fits = columns.every(
      (each) =>
        hidden.includes(each) || cells(each).every((cell) => cell.scrollWidth <= cell.clientWidth),
    );
    if (fits) break;
    show(column, false);
    hidden.push(column);
  }
  return hidden;
}

/**
 * Fits a grid's columns that give way (docs/DESIGN-SYSTEM.md, "Columns that give way"): columns
 * that may hide, named in the order they give way, each cell marked `data-column` with its
 * column's name and kept to one line, clipped. A column shows while each of its cells fits whole;
 * otherwise it hides in every row at once, never one cell, so the rows keep reading alike. A
 * column may have stand-ins, marked `data-instead` with its name, which show exactly where it
 * hides (Both's fraction, under the decimal). The measurement hides and shows the cells itself, as
 * useFieldFit does the chip's name, and the grid renders them with the same `hidden`; `grid` is
 * the element whose resizes refit it, one whose size the fit never changes. `columns` must keep
 * its identity between renders (a constant).
 */
export function useColumnsFit(
  grid: RefObject<HTMLElement | null>,
  columns: readonly string[],
): readonly string[] {
  const [hidden, setHidden] = useState<readonly string[]>([]);

  const refit = useCallback(() => {
    const next = fitColumns(grid, columns);
    if (!next) return;
    setHidden((current) =>
      current.length === next.length && current.every((column, at) => column === next[at])
        ? current
        : next,
    );
  }, [grid, columns]);

  useRefit(refit, grid);
  return hidden;
}
