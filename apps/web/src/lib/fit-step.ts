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

/** The largest step at which the text fits, left on its element; the last when none does. */
function largestFit(text: FitText): number {
  const element = text.ref.current;
  if (!element) return 0;
  const last = text.steps.length - 1;
  for (let step = 0; step < last; step += 1) {
    if (fitsAt(element, text, step)) return step;
  }
  fitsAt(element, text, last);
  return last;
}

/**
 * Runs `fit` before paint after every render, and again whenever `observed` resizes or the theme
 * changes, so text shrinks as it grows, takes the room back when its box widens, and fits each
 * theme's fonts, which change what fits without resizing anything.
 */
function useRefit(fit: () => void, observed: RefObject<HTMLElement | null>) {
  useLayoutEffect(fit);

  useEffect(() => {
    const element = observed.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const resizes = new ResizeObserver(fit);
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

/** How a field's row fits: whether the chip shows its symbol alone, and the text's step. */
export interface FieldFit {
  compact: boolean;
  step: number;
}

/**
 * Measures a field's row: with the chip's name shown, does the text fit at its largest size? If
 * not, the name is hidden and the text takes the largest step that fits without it. Leaves the
 * name and the text as chosen.
 */
function fitField(nameRef: RefObject<HTMLElement | null>, text: FitText): FieldFit {
  const name = nameRef.current;
  if (name) name.hidden = false;
  const element = text.ref.current;
  if (!element || fitsAt(element, text, 0)) return { compact: false, step: 0 };
  if (name) name.hidden = true;
  return { compact: name !== null, step: largestFit(text) };
}

/**
 * Fits a field's row (docs/DESIGN-SYSTEM.md, "Fields"): the chip's name gives way before the
 * field's text steps down, so the name stays while the row has room for it and the text at its
 * largest size, in a field of any width. `text` is the field's text layer on its ladder; `name`
 * is the chip's name, which the measurement hides and shows itself as useFitStep writes classes
 * (the chip renders it with the same `hidden`); `row` is the element whose resizes refit the
 * field, one whose size the fit never changes.
 */
export function useFieldFit(
  row: RefObject<HTMLElement | null>,
  name: RefObject<HTMLElement | null>,
  text: FitText,
): FieldFit {
  const [fit, setFit] = useState<FieldFit>({ compact: false, step: 0 });

  const refit = useCallback(() => {
    const next = fitField(name, text);
    setFit((current) =>
      current.compact === next.compact && current.step === next.step ? current : next,
    );
  }, [name, text]);

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
