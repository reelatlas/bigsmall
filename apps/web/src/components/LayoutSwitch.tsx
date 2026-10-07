import { useId } from 'react';
import { LAYOUTS, type Layout } from '../lib/layout';
import { cx, SHELL_BORDERED } from '../lib/recipes';
import { TableIcon, TwoBoxesIcon } from './icons';

export interface LayoutSwitchProps {
  value: Layout;
  onChange: (layout: Layout) => void;
}

const ICONS = { table: TableIcon, boxes: TwoBoxesIcon } as const;

/**
 * The converter's layout switch, in the header beside the theme menu (docs/UX-SPEC.md §10): two
 * native radios drawn as icons, so the arrow keys and screen readers work as in any radio group.
 * It carries the theme menu's bordered edge, which turns accent while a radio has focus, and the
 * focused option also shows an inset ring. The shell clips the chosen option's fill to its curve.
 */
export function LayoutSwitch({ value, onChange }: LayoutSwitchProps) {
  const name = useId();
  return (
    <fieldset className={cx('flex overflow-hidden rounded-md border-2', SHELL_BORDERED)}>
      <legend className="sr-only">Layout</legend>
      {LAYOUTS.map((option) => {
        const Icon = ICONS[option.id];
        return (
          <label
            key={option.id}
            title={option.name}
            className="flex size-11 cursor-pointer items-center justify-center text-ink-muted focus-ring-within-inset hover:bg-surface-raised hover:text-ink has-checked:bg-accent-soft has-checked:text-ink"
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <Icon />
            <span className="sr-only">{option.name}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
