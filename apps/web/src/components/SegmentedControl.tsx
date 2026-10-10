import type { ReactNode } from 'react';

/**
 * A setting's few choices joined in one strip (docs/DESIGN-SYSTEM.md, "Settings"; Sean chose it
 * over separate pills, 2026-10-10): one edge around all, a line between each, the chosen ones
 * filled with the accent's soft tint. Each segment is drawn 32 px tall with less padding than the
 * converter's controls, the text kept at text-sm, and still takes a 44 px tap: the label is the
 * target, the shape inside it is what shows. The caller wraps a strip in a fieldset whose legend
 * names it (a visually hidden one where the choices say what they are).
 */

const TARGET =
  'group flex min-h-11 min-w-11 cursor-pointer items-center has-disabled:cursor-not-allowed';
const SEGMENT =
  'flex h-8 w-full items-center justify-center border-y-2 border-r-2 border-edge px-2.5 text-sm whitespace-nowrap text-ink group-first:rounded-l-md group-first:border-l-2 group-last:rounded-r-md peer-checked:bg-accent-soft peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus peer-disabled:text-ink-muted';

export interface SegmentedOption<T> {
  value: T;
  label: ReactNode;
}

/** One of a few: radios, which share `name`. */
export function SegmentedControl<T extends string | number>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex w-fit">
      {options.map((option) => (
        <label key={option.value} className={TARGET}>
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span className={SEGMENT}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/** Several of a few: checkboxes, each on or off by itself. */
export function SegmentedToggles<T extends string | number>({
  options,
  checked,
  onToggle,
}: {
  options: ReadonlyArray<SegmentedOption<T>>;
  checked: (value: T) => boolean;
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex w-fit">
      {options.map((option) => (
        <label key={option.value} className={TARGET}>
          <input
            type="checkbox"
            checked={checked(option.value)}
            onChange={() => onToggle(option.value)}
            className="peer sr-only"
          />
          <span className={SEGMENT}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
