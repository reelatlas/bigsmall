import type { Unit } from '@bigsmall/core';
import { CloseIcon } from './icons';

export interface UnitChipProps {
  unit: Unit;
  /** Called when the user removes the chip. Omit for a read-only chip. */
  onRemove?: () => void;
}

/** The locked unit inside a smart input: symbol, name, and a remove control. */
export function UnitChip({ unit, onRemove }: UnitChipProps) {
  const body = (
    <>
      <span className="font-numeric font-semibold">{unit.symbol}</span>
      <span className="text-sm text-ink-muted">{unit.plural}</span>
    </>
  );
  const shell =
    'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-accent-soft px-3 text-ink';

  if (!onRemove) return <span className={shell}>{body}</span>;

  return (
    <span className={`${shell} pr-1`}>
      {body}
      <button
        type="button"
        aria-label={`Remove ${unit.plural}`}
        onClick={onRemove}
        className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-[background-color] duration-[var(--motion-fast)] ease-standard outline-none hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <CloseIcon width="16" height="16" />
      </button>
    </span>
  );
}
