import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Picks the largest of `steps` (a type ladder: class lists, largest first, such as NUMBER_SIZES
 * in lib/recipes.ts) at which the element's content fits
 * its width on one line. It measures before paint after every render, and again whenever the
 * element resizes, so a number shrinks as it grows and takes the room back when the field widens
 * or a chip disappears. The element must clip (`overflow-hidden`) and keep its content on one
 * line (`whitespace-pre` or `whitespace-nowrap`), except that a final step may wrap as a last
 * resort, which then always fits; `base` is its full class list without the size step.
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
    const element = ref.current;
    if (!element) return;
    let chosen = steps.length - 1;
    for (let i = 0; i < steps.length; i += 1) {
      element.className = `${base} ${steps[i]}`;
      if (element.scrollWidth <= element.clientWidth) {
        chosen = i;
        break;
      }
    }
    element.className = `${base} ${steps[chosen]}`;
    setStep(chosen);
  }, [ref, base, steps]);

  useLayoutEffect(fit);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, fit]);

  return step;
}
