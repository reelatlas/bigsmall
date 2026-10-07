import type { Unit } from '@bigsmall/core';
import { cx } from '../lib/recipes';
import { CloseIcon } from './icons';

export interface UnitChipProps {
  unit: Unit;
  /** Show the symbol only, when the field needs the room. The name stays in the labels. */
  compact: boolean;
  /** Called when the user activates the chip body, to change the unit. */
  onOpen: () => void;
  /** Called when the user removes the chip. */
  onRemove: () => void;
  /**
   * False takes both buttons out of the Tab order, for a host whose own keys already change and
   * remove the unit (the smart input). They stay clickable and visible to screen readers.
   */
  inTabOrder: boolean;
}

// The chip lives inside a field: its corners nest inside the field's (docs/DESIGN-SYSTEM.md, "Fields").
const CHIP = 'inline-flex min-h-11 shrink-0 items-stretch rounded-nested bg-accent-soft text-ink';
// Baseline alignment keeps the name and the symbol on one line of type.
const BODY = 'inline-flex items-baseline gap-2 self-center px-3';
// Hover keeps the chip color and lightens it toward the surface, so it reads as the same chip.
// Keyboard focus shows the base focus ring.
const HOVER = 'transition-colors hover:bg-surface/40';

/**
 * The locked unit inside a smart input: its name, then its symbol, the way a row of the unit list
 * reads (SuggestionPanel), which open the unit list, plus a remove control. Collapsed, the symbol
 * stands alone in the ink color.
 */
export function UnitChip({ unit, compact, onOpen, onRemove, inTabOrder }: UnitChipProps) {
  const tabIndex = inTabOrder ? undefined : -1;
  return (
    <span className={CHIP}>
      <button
        type="button"
        aria-label={`Change unit: ${unit.plural}`}
        tabIndex={tabIndex}
        onClick={onOpen}
        className={cx('inline-flex rounded-l-nested', HOVER)}
      >
        <span className={BODY}>
          {!compact && <span>{unit.plural}</span>}
          <span className={cx('font-numeric font-semibold', !compact && 'text-ink-muted')}>
            {unit.symbol}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${unit.plural}`}
        tabIndex={tabIndex}
        onClick={onRemove}
        className={cx(
          'inline-flex w-11 items-center justify-center rounded-r-nested text-ink-muted hover:text-ink',
          HOVER,
        )}
      >
        <CloseIcon width="16" height="16" />
      </button>
    </span>
  );
}
