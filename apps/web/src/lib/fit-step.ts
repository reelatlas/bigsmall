import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

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
