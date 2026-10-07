import type { ReactNode } from 'react';

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
}

export interface SegmentedProps<V extends string> {
  /** Names the choice for screen readers, such as "Calculator fills". */
  legend: string;
  /** The radio group's name, unique on the page. */
  name: string;
  options: readonly SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
}

/**
 * A choice between a few options shown side by side: native radios inside labels, so arrow keys,
 * Space, and screen readers work as for any radio group. The chosen option takes the accent fill,
 * which every theme keeps at 3:1 against the surface, so the state reads without color names.
 * The track's 2 px transparent edge and 4 px gutter match a menu's, so `rounded-nested-md` nests.
 */
export function Segmented<V extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: SegmentedProps<V>) {
  return (
    <fieldset className="flex gap-1 rounded-md border-2 border-transparent bg-surface-raised p-1">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-nested-md px-3 text-sm font-medium text-ink-muted focus-ring-within-inset transition-colors has-checked:bg-accent has-checked:text-on-accent"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
