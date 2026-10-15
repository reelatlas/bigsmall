import type { ReactNode } from 'react';

/**
 * A setting's few choices joined in one strip (docs/DESIGN-SYSTEM.md, "Settings"; Sean chose it
 * over separate pills, 2026-10-10): one edge around all, a line between each, the chosen ones
 * filled with the accent's soft tint. Each segment is drawn 32 px tall with less padding than the
 * converter's controls, the text kept at text-sm, and still takes a 44 px tap: the label is the
 * target, the shape inside it is what shows. The caller wraps a strip in a fieldset whose legend
 * names it (a visually hidden one where the choices say what they are). A strip is marked
 * `data-strip`, so a side panel's arrows take it as one row (SidePanel). Each seam is drawn once:
 * every segment has its whole edge and overlaps the one before by the edge's width, its own left
 * edge clear over its neighbour's line (its fill kept inside its edge), so no seam is two lines that
 * a scaled screen rounds apart. With focus a segment's own edge turns the focus color and it is
 * lifted over its neighbours: the highlight is the edge, the same width at rest and with focus, on
 * all four sides alike wherever the segment is (Sean, 2026-10-15).
 */

const TARGET =
  'group flex min-h-11 min-w-11 cursor-pointer items-center not-first:-ml-0.5 has-disabled:cursor-not-allowed';
const SEGMENT =
  'flex h-8 w-full items-center justify-center border-2 border-edge border-l-transparent bg-clip-padding px-2.5 text-sm whitespace-nowrap text-ink group-first:rounded-l-md group-first:border-l-edge group-last:rounded-r-md peer-checked:bg-accent-soft peer-focus-visible:relative peer-focus-visible:z-10 peer-focus-visible:border-focus peer-disabled:text-ink-muted';

export interface SegmentedOption<T> {
  value: T;
  label: ReactNode;
  /** Out of reach for now, in the muted ink, skipped by the arrows (Units' Custom with no set yet). */
  disabled?: boolean;
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
    <div className="flex w-fit" data-strip>
      {options.map((option) => (
        <label key={option.value} className={TARGET}>
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            disabled={option.disabled}
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
    <div className="flex w-fit" data-strip>
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
