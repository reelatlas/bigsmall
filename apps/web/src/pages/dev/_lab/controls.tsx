import { useId, type ReactNode } from 'react';
import { CARD, cx, FIELD_STACK, TEXT_INPUT } from '../../../lib/recipes';

// The controls the /dev labs share (docs/DESIGN-SYSTEM.md, "Tuning labs"): tools for tuning,
// not design-system components, so they stay out of the gallery.

/** Class lists the labs use more than once; the ones they share with the site are in lib/recipes.ts. */
export const HEADING = 'font-display text-lg font-semibold';
export const FIELD = FIELD_STACK;
export const INPUT = TEXT_INPUT;
export const SELECT = cx(INPUT, 'w-full');
export const CHECK = 'flex min-h-11 items-center gap-2 text-sm';

interface SliderProps {
  label: string;
  value: number;
  /** The shipped default, shown beside a changed value. */
  shipped: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: ReactNode;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  value,
  shipped,
  min,
  max,
  step,
  unit = '',
  hint,
  disabled,
  onChange,
}: SliderProps) {
  const id = useId();
  const changed = value !== shipped;
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <label htmlFor={id} className={changed ? 'font-semibold' : undefined}>
          {label}
        </label>
        <output htmlFor={id} className="font-numeric text-ink-muted">
          {value}
          {unit}
          {changed && ` (shipped ${shipped}${unit})`}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-11 w-full accent-accent disabled:opacity-50"
      />
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cx(CARD, 'grid min-w-0 grid-cols-1 content-start gap-4 p-5', className)}>
      <legend className={cx('px-1', HEADING)}>{title}</legend>
      {children}
    </fieldset>
  );
}
