import type { Unit } from '@bigsmall/core';
import { CloseIcon } from './icons';

export interface UnitChipProps {
  unit: Unit;
  /** Show the symbol only, when the number next to the chip needs the room. The name stays in the labels. */
  compact?: boolean;
  /** Called when the user activates the chip body, to change the unit. */
  onOpen?: () => void;
  /** Called when the user removes the chip. */
  onRemove?: () => void;
  /**
   * False takes both buttons out of the Tab order, for a host whose own keys already change and
   * remove the unit (the smart input). They stay clickable and visible to screen readers.
   */
  inTabOrder?: boolean;
}

// The chip lives inside a field: its corners nest inside the field's (docs/DESIGN-SYSTEM.md, "Fields").
const shell = 'inline-flex min-h-11 shrink-0 items-stretch rounded-nested bg-accent-soft text-ink';
// Baseline alignment keeps the symbol and the smaller name on one line of type.
const body = 'inline-flex items-baseline gap-2 self-center px-3';
const focus =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
// Hover keeps the chip color and lightens it toward the surface, so it reads as the same chip.
const hover =
  'transition-[background-color] duration-[var(--motion-fast)] ease-standard hover:bg-surface/40';

/** The locked unit inside a smart input: symbol and name, which open the unit list, plus a remove control. */
export function UnitChip({
  unit,
  compact = false,
  onOpen,
  onRemove,
  inTabOrder = true,
}: UnitChipProps) {
  const tabIndex = inTabOrder ? undefined : -1;
  const label = (
    <span className={body}>
      <span className="font-numeric font-semibold">{unit.symbol}</span>
      {!compact && <span className="text-sm text-ink-muted">{unit.plural}</span>}
    </span>
  );

  return (
    <span className={shell}>
      {onOpen ? (
        <button
          type="button"
          aria-label={`Change unit: ${unit.plural}`}
          tabIndex={tabIndex}
          onClick={onOpen}
          className={`inline-flex rounded-l-nested ${onRemove ? '' : 'rounded-r-nested'} ${hover} ${focus}`}
        >
          {label}
        </button>
      ) : (
        <span className="inline-flex">{label}</span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${unit.plural}`}
          tabIndex={tabIndex}
          onClick={onRemove}
          className={`inline-flex w-10 items-center justify-center rounded-r-nested text-ink-muted hover:text-ink ${hover} ${focus}`}
        >
          <CloseIcon width="16" height="16" />
        </button>
      )}
    </span>
  );
}
