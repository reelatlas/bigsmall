import type { Unit } from '@bigsmall/core';
import type { Ref } from 'react';
import { cx, unitSymbol } from '../lib/recipes';
import { CloseIcon } from './icons';

export interface UnitChipProps {
  unit: Unit;
  /** Show the symbol only, when the field needs the room. The name stays in the labels. */
  compact: boolean;
  /**
   * The name's element, for a field that measures whether it has room for it (useFieldFit in
   * lib/fit-step.ts). Compact hides it rather than leaving it out, so it can be measured.
   */
  nameRef?: Ref<HTMLSpanElement>;
  /** Called when the user activates the chip body, to change the unit. */
  onOpen: () => void;
  /** Called when the user removes the chip. */
  onRemove: () => void;
}

// The chip lives inside a field: its corners nest inside the field's (docs/DESIGN-SYSTEM.md, "Fields").
const CHIP = 'inline-flex min-h-11 shrink-0 items-stretch rounded-nested bg-accent-soft text-ink';
// Baseline alignment keeps the name and the symbol on one line of type.
const BODY = 'inline-flex items-baseline gap-2 self-center px-3';
// Hover keeps the chip color and lightens it toward the surface, so it reads as the same chip.
// Keyboard focus shows the base focus ring.
const HOVER = 'transition-colors hover:bg-surface/40';

/**
 * The locked unit inside a field: its symbol, then its name, plus a remove control. The body opens
 * the unit list with two boxes and puts the caret in the field in the table layout, whose table is
 * the list (`onOpen`). Collapsed, the symbol stands alone in the ink color.
 */
export function UnitChip({ unit, compact, nameRef, onOpen, onRemove }: UnitChipProps) {
  // Both buttons stay out of the Tab order: the field's own keys change and remove the unit
  // (docs/UX-SPEC.md §5). They stay clickable and visible to screen readers.
  const tabIndex = -1;
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
          <span className={unitSymbol(compact)}>{unit.symbol}</span>
          <span ref={nameRef ?? null} hidden={compact}>
            {unit.plural}
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
