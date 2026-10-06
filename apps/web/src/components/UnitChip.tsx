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
}

const shell = 'inline-flex min-h-11 shrink-0 items-stretch rounded-md bg-accent-soft text-ink';
const body = 'inline-flex items-center gap-2 px-3';
const focus =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
// Hover keeps the chip color and lightens it toward the surface, so it reads as the same chip.
const hover =
  'transition-[background-color] duration-[var(--motion-fast)] ease-standard hover:bg-surface/40';

/** The locked unit inside a smart input: symbol and name, which open the unit list, plus a remove control. */
export function UnitChip({ unit, compact = false, onOpen, onRemove }: UnitChipProps) {
  const label = (
    <>
      <span className="font-numeric font-semibold">{unit.symbol}</span>
      {!compact && <span className="text-sm text-ink-muted">{unit.plural}</span>}
    </>
  );

  return (
    <span className={shell}>
      {onOpen ? (
        <button
          type="button"
          aria-label={`Change unit: ${unit.plural}`}
          onClick={onOpen}
          className={`${body} rounded-l-md ${hover} ${focus}`}
        >
          {label}
        </button>
      ) : (
        <span className={body}>{label}</span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${unit.plural}`}
          onClick={onRemove}
          className={`inline-flex w-10 items-center justify-center rounded-r-md text-ink-muted hover:text-ink ${hover} ${focus}`}
        >
          <CloseIcon width="16" height="16" />
        </button>
      )}
    </span>
  );
}
