import type { InputHTMLAttributes, Ref } from 'react';
import { CheckIcon } from './icons';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className'
> {
  /** The input itself, for a caller that sets `indeterminate` on it (TriCheckbox). */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The drawn box: the native input's state, read through `peer`. Its ring is the one focus ring
 * (`focus-ring-peer`, global.css), on the box since the input itself is out of sight.
 */
const BOX =
  'pointer-events-none absolute inset-0 rounded-sm border-2 border-edge bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent peer-indeterminate:border-accent peer-indeterminate:bg-accent focus-ring-peer';

/**
 * A checkbox the design draws (docs/DESIGN-SYSTEM.md, "A list of choices"; 2026-10-18): the native
 * input, visually hidden, with a 16 px box beside it on the tokens, the check in the accent's ink
 * while it is on, a dash while a group is partly on (`indeterminate`, TriCheckbox), and the focus
 * ring on the box. The row around it, a 44 px label, is the target, as the segmented control's
 * radios have theirs, so a stuck head may pass over a list of them: the native 16 px box was a
 * target under WCAG 2.5.8's 24 px, which axe flagged the moment the stuck toolbar's button sat
 * beside one, and until then the head had to let go over Edit, Hidden, and a panel below md.
 * Keys, labels, and screen readers see the input as before. A fixed one (`disabled`) fades its
 * box alone, since its row still names the unit in the box (docs/DESIGN-SYSTEM.md, "States").
 */
export function Checkbox({ inputRef, ...props }: CheckboxProps) {
  return (
    <span className="relative inline-grid size-4 shrink-0 place-items-center has-disabled:opacity-50">
      <input ref={inputRef ?? null} type="checkbox" className="peer sr-only" {...props} />
      <span aria-hidden="true" className={BOX} />
      <CheckIcon className="pointer-events-none relative size-3 stroke-3 text-on-accent opacity-0 transition-opacity peer-checked:opacity-100" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto h-0.5 w-2 bg-on-accent opacity-0 transition-opacity peer-indeterminate:opacity-100"
      />
    </span>
  );
}
