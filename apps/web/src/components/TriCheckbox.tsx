import { useLayoutEffect, useRef } from 'react';
import { Checkbox, type CheckboxProps } from './Checkbox';

/** All of a group on, some of it, or none. */
export type TriState = 'all' | 'some' | 'none';

export interface TriCheckboxProps extends Omit<
  CheckboxProps,
  'checked' | 'defaultChecked' | 'inputRef'
> {
  state: TriState;
}

/**
 * A checkbox over a group (docs/DESIGN-SYSTEM.md, "A list of choices"; Sean, 2026-10-15): checked
 * while all of the group is on, a dash while some of it is (`indeterminate`, which screen readers
 * hear as mixed), clear while none is. What a press does is the caller's; the convention, kept by
 * Settings' systems and the table's sections, is that a dash or a clear box turns the whole group
 * on and a checked one turns it off. The box is the one Checkbox draws (2026-10-18; the native one
 * in the accent until then).
 */
export function TriCheckbox({ state, ...props }: TriCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  // In a layout effect, so the dash is drawn with the render that asked for it.
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'some';
  });
  return <Checkbox inputRef={ref} checked={state === 'all'} {...props} />;
}
