import type { Ingredient, ParsedInput, Unit } from '@bigsmall/core';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useFieldFit, type FitText } from '../lib/fit-step';
import { cx, FIELD_ROW, NUMBER_SIZES, SHELL } from '../lib/recipes';
import { Button } from './Button';
import { ClearIcon } from './icons';
import { NumberText, runningValue } from './NumberText';
import { UnitChip } from './UnitChip';

export interface ValueFieldProps {
  inputRef: RefObject<HTMLInputElement>;
  /** Accessible name of the field. */
  label: string;
  text: string;
  /** The text as parsed, which draws its exponent markers and running value. */
  parsed: ParsedInput;
  /** The locale the running value is formatted in. */
  locale: string | undefined;
  unit: Unit | null;
  /** The ingredient beside the unit, Cooking's second pill (ADR 0021). */
  ingredient?: Ingredient | null;
  placeholder: string;
  /** Id of the text that describes the field (the converter's intro). */
  describedBy: string;
  /**
   * The combobox's popup, the list under the field: whether it shows, the ids of what it controls
   * (space-separated: the matches, and the hidden ones listed under their line once shown), the
   * item the field points at, and its kind, a listbox (the matches, the categories) or a grid (the
   * units).
   */
  popup: {
    expanded: boolean;
    controls: string;
    activeId: string | undefined;
    kind: 'listbox' | 'grid';
  };
  /** Symbol only (docs/UX-SPEC.md §7): the chip shows its symbol alone, as when it lacks the room. */
  symbolOnly?: boolean;
  /**
   * The field takes a number alone (a unit in the chip, no sign likely): a touch screen brings up
   * its number pad rather than letters (docs/UX-SPEC.md §1, ADR 0015).
   */
  numberPad?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** The field's × was clicked or tapped: its text goes, the unit stays. */
  onClear: () => void;
  /** The chip's body was clicked or tapped. */
  onChipOpen: () => void;
  /** The chip's × was clicked or tapped. */
  onChipRemove: () => void;
  /** The ingredient's pill was clicked or tapped. */
  onIngredientOpen?: () => void;
  /** The ingredient's × was clicked or tapped. */
  onIngredientRemove?: () => void;
}

/**
 * The text layer: the visible value lives here, over a field whose own text is transparent. That
 * is what lets the exponent marker in "1.5E21" carry weight, since a field cannot style part of
 * its value. The size steps are measured against this layer (docs/DESIGN-SYSTEM.md, "Fields").
 */
/**
 * The box's resting edge, a shell's that never opens: bordered, clipped to its corners, the
 * accent edge showing keyboard focus inside and easing between edge and accent, since the box
 * stays in view through the change.
 */
const FIELD_SHELL =
  'overflow-hidden border-edge bg-surface transition-[border-color,box-shadow] focus-within:border-accent';

const TEXT_LAYER =
  'pointer-events-none absolute inset-0 flex items-center overflow-hidden font-numeric whitespace-pre text-ink';

/**
 * The row, FIELD_ROW, which with Cooking's two pills (ADR 0021) wraps where the fit says so
 * (`data-wrap`, useFieldFit), never by the browser's own wrapping: the number and its clear on
 * the first line, the pills together on a line of their own at its right end.
 */
const ROW = cx(
  FIELD_ROW,
  'group/row data-wrap:h-auto data-wrap:min-h-15 data-wrap:flex-wrap data-wrap:gap-y-1 data-wrap:py-2',
);

/** The number's room, its clear's height on a line of its own. */
const NUMBER = 'relative min-w-0 flex-1 self-stretch group-data-wrap/row:min-h-11';

/** The two pills, one group, the whole second line where the row wraps. */
const PILLS =
  'flex min-w-0 items-center gap-2 group-data-wrap/row:basis-full group-data-wrap/row:justify-end';

/**
 * The converter's field (docs/DESIGN-SYSTEM.md, "Fields"): a combobox input over a text layer, its
 * clear while it holds text, and the unit chip, the row fitted by measurement, so the chip gives
 * up its name before the value steps down a size, in a box of any width. Its edge is a shell's at
 * rest, the accent while focus is inside. What the keys do is its host's (TableLayout).
 */
export function ValueField({
  inputRef,
  label,
  text,
  parsed,
  locale,
  unit,
  ingredient = null,
  placeholder,
  describedBy,
  popup,
  symbolOnly = false,
  numberPad = false,
  onChange,
  onKeyDown,
  onClear,
  onChipOpen,
  onChipRemove,
  onIngredientOpen,
  onIngredientRemove,
}: ValueFieldProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const chipNameRef = useRef<HTMLSpanElement>(null);
  /** The ingredient's name, which the unit chip's name gives way to where it would be cut short. */
  const ingredientNameRef = useRef<HTMLSpanElement>(null);
  /** No name to measure: with Symbol only the chip never shows one, so the number has its room. */
  const noName = useRef<HTMLSpanElement>(null);
  const inputId = `${useId()}-input`;

  // The row is measured, not counted: in any box, wide or narrow, the chip keeps its name while
  // the value fits beside it at full size, then the value steps down.
  const fitText = useMemo<FitText>(
    () => ({ ref: textLayerRef, base: TEXT_LAYER, steps: NUMBER_SIZES }),
    [],
  );
  const fit = useFieldFit(rowRef, symbolOnly ? noName : chipNameRef, fitText, ingredientNameRef);
  const sizeClass = NUMBER_SIZES[fit.step];

  // A number too long even at the smallest size scrolls inside the field; the layer follows it.
  const syncScroll = () => {
    if (textLayerRef.current && inputRef.current) {
      textLayerRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };
  useLayoutEffect(syncScroll);

  // The chip keeps the same 8 px from the top, bottom, and right edges (docs/DESIGN-SYSTEM.md,
  // "Fields").
  return (
    <div className={cx('min-w-0 rounded-lg shadow-sm', SHELL, FIELD_SHELL)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div ref={rowRef} data-wrap={fit.wrap ? '' : undefined} className={ROW}>
        <div className={NUMBER}>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={popup.expanded}
            aria-controls={popup.expanded ? popup.controls : undefined}
            aria-activedescendant={popup.activeId}
            aria-haspopup={popup.kind}
            aria-autocomplete="list"
            aria-describedby={describedBy}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellcheck={false}
            inputMode={numberPad ? 'decimal' : 'text'}
            enterKeyHint="done"
            placeholder={placeholder}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            className={cx(
              sizeClass,
              'h-full w-full bg-transparent font-numeric text-transparent caret-ink outline-none selection:bg-accent-soft placeholder:text-ink-muted',
            )}
          />
          <div ref={textLayerRef} aria-hidden="true" className={cx(TEXT_LAYER, sizeClass)}>
            <NumberText text={text} parsed={parsed} running={runningValue(parsed, locale)} />
            {/* Empty, the placeholder's room, unseen, so the fit keeps it whole: the number is
                never squeezed out beside the pills. */}
            {text === '' && <span className="invisible">{placeholder}</span>}
          </div>
        </div>
        {text !== '' && (
          // The field's own clear, beside what it clears, the chip's × inside the chip: the text
          // goes, the unit stays (Sean, 2026-10-15). Out of the Tab order, as Escape clears from
          // the keyboard; a press never takes focus from the field, so a keyboard that is up stays.
          <Button
            variant="ghost"
            square
            nested
            tabIndex={-1}
            aria-label={parsed.query ? 'Clear text' : 'Clear number'}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClear}
          >
            <ClearIcon />
          </Button>
        )}
        {(() => {
          const unitChip = unit && (
            // Out of the Tab order: the field's own keys do what the chip does. Pointers and
            // screen readers still reach both buttons.
            <UnitChip
              unit={unit}
              compact={symbolOnly || fit.compact}
              nameRef={chipNameRef}
              onOpen={onChipOpen}
              onRemove={onChipRemove}
            />
          );
          if (!ingredient) return unitChip;
          // Cooking's second pill, after the unit's, each removable (ADR 0021); the two wrap as
          // one, the ingredient's name cut short only where their own line is too narrow.
          return (
            <div className={PILLS}>
              {unitChip}
              <UnitChip
                ingredient={ingredient}
                compact={false}
                nameRef={ingredientNameRef}
                onOpen={onIngredientOpen ?? onChipOpen}
                onRemove={onIngredientRemove ?? onChipRemove}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
