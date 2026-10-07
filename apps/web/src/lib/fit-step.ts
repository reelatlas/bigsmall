import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Text that steps down a type ladder to fit (docs/DESIGN-SYSTEM.md, "Type that steps to fit"):
 * its element, its full class list without the size step, and the ladder (class lists, largest
 * first, such as NUMBER_SIZES in lib/recipes.ts). The element must clip (`overflow-hidden`) and
 * keep its content on one line (`whitespace-pre` or `whitespace-nowrap`), except that a final step
 * may wrap as a last resort, which then always fits.
 */
export interface FitText {
  ref: RefObject<HTMLElement | null>;
  base: string;
  steps: readonly string[];
}

/** Puts the element at one step of its ladder and says whether its text then fits its width. */
function fitsAt(element: HTMLElement, text: FitText, step: number): boolean {
  element.className = `${text.base} ${text.steps[step]}`;
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
 * Runs `fit` before paint after every render, and again whenever `observed` resizes, so text
 * shrinks as it grows and takes the room back when its box widens.
 */
function useRefit(fit: () => void, observed: RefObject<HTMLElement | null>) {
  useLayoutEffect(fit);

  useEffect(() => {
    const element = observed.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
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

/** How a field's row fits: whether the chip shows its symbol alone, and each text's step. */
export interface FieldFit {
  compact: boolean;
  steps: readonly number[];
}

function sameFit(a: FieldFit, b: FieldFit): boolean {
  return a.compact === b.compact && a.steps.every((step, i) => step === b.steps[i]);
}

/**
 * Measures a field's row: with the chip's name shown, does every text fit at its largest size?
 * If not, the name is hidden and each text takes the largest step that fits without it. Leaves
 * the name and the texts as chosen.
 */
function fitField(nameRef: RefObject<HTMLElement | null>, texts: readonly FitText[]): FieldFit {
  const name = nameRef.current;
  if (name) name.hidden = false;
  const whole = texts.every((text) => !text.ref.current || fitsAt(text.ref.current, text, 0));
  if (whole) return { compact: false, steps: texts.map(() => 0) };
  if (name) name.hidden = true;
  return { compact: name !== null, steps: texts.map(largestFit) };
}

/**
 * Fits a field's row (docs/DESIGN-SYSTEM.md, "Fields"): the chip's name gives way before any of
 * the field's text steps down, so the name stays while the row has room for it and the text at
 * its largest size, in a field of any width. `texts` are the field's text layers, each on its
 * ladder, over the same room; `name` is the chip's name, which the measurement hides and shows
 * itself as useFitStep writes classes (the chip renders it with the same `hidden`); `row` is the
 * element whose resizes refit the field, one whose size the fit never changes.
 */
export function useFieldFit(
  row: RefObject<HTMLElement | null>,
  name: RefObject<HTMLElement | null>,
  texts: readonly FitText[],
): FieldFit {
  const [fit, setFit] = useState<FieldFit>(() => ({
    compact: false,
    steps: texts.map(() => 0),
  }));

  const refit = useCallback(() => {
    const next = fitField(name, texts);
    setFit((current) => (sameFit(current, next) ? current : next));
  }, [name, texts]);

  useRefit(refit, row);
  return fit;
}
