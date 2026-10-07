import type { Unit } from '@bigsmall/core';
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
const shell = 'inline-flex min-h-11 shrink-0 items-stretch rounded-nested bg-accent-soft text-ink';
// Baseline alignment keeps the symbol and the smaller name on one line of type.
const body = 'inline-flex items-baseline gap-2 self-center px-3';
// Hover keeps the chip color and lightens it toward the surface, so it reads as the same chip.
// Keyboard focus shows the base focus ring.
const hover = 'transition-colors hover:bg-surface/40';

/** The locked unit inside a smart input: symbol and name, which open the unit list, plus a remove control. */
export function UnitChip({ unit, compact, onOpen, onRemove, inTabOrder }: UnitChipProps) {
  const tabIndex = inTabOrder ? undefined : -1;
  return (
    <span className={shell}>
      <button
        type="button"
        aria-label={`Change unit: ${unit.plural}`}
        tabIndex={tabIndex}
        onClick={onOpen}
        className={`inline-flex rounded-l-nested ${hover}`}
      >
        <span className={body}>
          <span className="font-numeric font-semibold">{unit.symbol}</span>
          {!compact && <span className="text-sm text-ink-muted">{unit.plural}</span>}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${unit.plural}`}
        tabIndex={tabIndex}
        onClick={onRemove}
        className={`inline-flex w-11 items-center justify-center rounded-r-nested text-ink-muted hover:text-ink ${hover}`}
      >
        <CloseIcon width="16" height="16" />
      </button>
    </span>
  );
}
