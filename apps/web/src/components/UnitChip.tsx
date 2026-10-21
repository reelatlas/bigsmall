import type { Ingredient, ShoeBrand, Unit } from '@bigsmall/core';
import type { MouseEvent, Ref } from 'react';
import { cx, unitSymbol } from '../lib/recipes';
import { ChevronDownIcon, CloseIcon } from './icons';

interface ChipProps {
  /** Show the symbol only, when the field needs the room. The name stays in the labels. */
  compact: boolean;
  /**
   * The name's element, for a field that measures whether it has room for it (useFieldFit in
   * lib/fit-step.ts). Compact hides it rather than leaving it out, so it can be measured.
   */
  nameRef?: Ref<HTMLSpanElement>;
  /** An ingredient's chevron, which compact hides, for the field's fit to measure the same way. */
  chevronRef?: Ref<HTMLSpanElement>;
  /**
   * Called when the user activates the chip's body: the caret goes into the field, whose keys and
   * table change the unit.
   */
  onOpen: () => void;
  /** Called when the user removes the chip. */
  onRemove: () => void;
}

/**
 * A unit's chip, its symbol and then its name, a pair's too; or the second pill, Cooking's
 * ingredient (ADR 0021) or Shoe size's brand (ADR 0028), its name, which gives way to the number
 * by truncating where the box is narrow, and never goes compact, then a chevron: its body opens
 * every ingredient, or every brand, to choose from, and `expanded` turns the chevron over while
 * they show (a trial, Sean, 2026-10-16). The unit's chip draws the same chevron where `expanded`
 * is set: in Shoe size with a brand in the box, its body opens the brand's scales (ADR 0028,
 * 2026-10-20); a readout otherwise, the table being the list.
 */
type UnitChipProps = ChipProps &
  (
    | { unit: Unit; ingredient?: undefined; brand?: undefined; expanded?: boolean | undefined }
    | { ingredient: Ingredient; unit?: undefined; brand?: undefined; expanded?: boolean }
    | { brand: ShoeBrand; unit?: undefined; ingredient?: undefined; expanded?: boolean }
  );

// The chip lives inside a field: its corners nest inside the field's (docs/DESIGN-SYSTEM.md, "Fields").
const CHIP = 'inline-flex min-h-11 items-stretch rounded-nested bg-accent-soft text-ink';
// Baseline alignment keeps the name and the symbol on one line of type.
const BODY = 'inline-flex items-baseline gap-2 self-center px-3';
// Hover keeps the chip color and lightens it toward the surface, so it reads as the same chip
// (`accent-soft-hover`, derived in the bridge). Keyboard focus shows the base focus ring.
const HOVER = 'transition-colors hover:bg-accent-soft-hover';

/**
 * The unit in the field: its symbol, then its name, plus a remove control. The body puts the caret
 * in the field (`onOpen`), whose table is the unit list. Collapsed, the symbol stands alone in the
 * ink color.
 */
export function UnitChip({
  unit,
  ingredient,
  brand,
  expanded,
  compact,
  nameRef,
  chevronRef,
  onOpen,
  onRemove,
}: UnitChipProps) {
  // Both buttons stay out of the Tab order: the field's own keys change and remove the unit
  // (docs/UX-SPEC.md §5). They stay clickable and visible to screen readers.
  const tabIndex = -1;
  /** The second pill's thing, an ingredient or a brand, which the chip names. */
  const second = ingredient ?? brand ?? null;
  const name = unit ? unit.plural : (second?.name ?? '');
  const what = unit ? 'Unit' : ingredient ? 'Ingredient' : 'Brand';
  // A press moves focus nowhere: the caret stays in the field if it was there (a touch screen's
  // keyboard with it, until a choice is made), and a browser that gives a pressed button focus
  // never scrolls the page to center it, as WebKit does (docs/LEARNINGS.md, 2026-10-17). Cancelled
  // on mousedown, as the field's × does: cancelling pointerdown swallows the tap itself in WebKit.
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
  return (
    // A unit's chip keeps its size; an ingredient's or a brand's gives way, its name cut short.
    <span className={cx(CHIP, second ? 'min-w-0' : 'shrink-0')}>
      <button
        type="button"
        // What it is, not a picker it would open: a press puts the caret in the box, whose keys
        // and table change the unit (the full tidy, 2026-10-15); with a brand beside it the unit's
        // chip opens the brand's scales, `aria-expanded` saying so (ADR 0028, 2026-10-20).
        aria-label={`${what}: ${name}`}
        aria-expanded={expanded}
        tabIndex={tabIndex}
        onMouseDown={keepFocus}
        onClick={onOpen}
        className={cx('inline-flex min-w-0 rounded-l-nested', HOVER)}
      >
        {unit ? (
          <span className={BODY}>
            {/* A pair's chip is every chip's, symbol then name (Sean, 2026-10-19). The name's
                `hidden` is the fit's own, which measures by writing it: an element rendered
                otherwise keeps the fit's write (docs/LEARNINGS.md, 2026-10-19). */}
            <span className={unitSymbol(compact)}>{unit.symbol}</span>
            <span ref={nameRef ?? null} hidden={compact}>
              {name}
            </span>
            {expanded !== undefined && (
              // The pill's chevron: the chip opens the brand's scales (ADR 0028, 2026-10-20).
              <span className="shrink-0 self-center">
                <ChevronDownIcon
                  width="16"
                  height="16"
                  className={cx(
                    'block text-ink-muted transition-transform',
                    expanded && 'rotate-180',
                  )}
                />
              </span>
            )}
          </span>
        ) : (
          <span className={cx(BODY, 'min-w-0')}>
            <span ref={nameRef ?? null} className="truncate">
              {name}
            </span>
            {/* Gives way after the unit chip's name where the box lacks the room (useFieldFit). */}
            <span ref={chevronRef ?? null} hidden={compact} className="shrink-0 self-center">
              <ChevronDownIcon
                width="16"
                height="16"
                className={cx(
                  'block text-ink-muted transition-transform',
                  expanded && 'rotate-180',
                )}
              />
            </span>
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        tabIndex={tabIndex}
        onMouseDown={keepFocus}
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
