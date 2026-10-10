import type { ReactNode } from 'react';
import { cx, OPTION_ROW } from '../lib/recipes';

export interface SwitchProps {
  /** What it turns on, after the switch. */
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * One setting that takes effect at once, on or off (docs/DESIGN-SYSTEM.md, "Settings"): a list
 * of choices takes checkboxes, one of a few a segmented control. The whole row is the control and
 * its 44 px tap; the track leads and the label follows, as a checkbox's does (Sean, 2026-10-10).
 * The track is drawn in the control edge, filled with the accent once on.
 */
export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(OPTION_ROW, 'w-full gap-2 text-left')}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex h-6 w-10 shrink-0 items-center rounded-full border-2 p-0.5 transition-colors',
          checked ? 'border-accent bg-accent' : 'border-edge bg-surface',
        )}
      >
        <span
          className={cx(
            'size-4 rounded-full transition-transform',
            checked ? 'translate-x-4 bg-on-accent' : 'bg-ink-muted',
          )}
        />
      </span>
      {label}
    </button>
  );
}
