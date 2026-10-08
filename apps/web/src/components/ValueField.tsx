import type { ParsedInput, Unit } from '@bigsmall/core';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useFieldFit, type FitText } from '../lib/fit-step';
import { cx, FIELD_ROW, NUMBER_SIZES, SHELL, SHELL_BORDERED } from '../lib/recipes';
import { NumberText, runningValue } from './NumberText';
import { UnitChip } from './UnitChip';

export interface ValueFieldProps {
  inputRef: RefObject<HTMLInputElement>;
  /** Accessible name of the field. */
  label: string;
  /** Marks the input with the converter box it holds (`data-box`), so focus can be sent to it. */
  boxId: string;
  text: string;
  /** The text as parsed, which draws its exponent markers and running value. */
  parsed: ParsedInput;
  /** The locale the running value is formatted in. */
  locale: string | undefined;
  unit: Unit | null;
  placeholder: string;
  /** Shown in place of a value that cannot be shown: "Too large to convert". */
  message: string | null;
  /** Id of the hint that describes the field. */
  describedBy: string;
  /**
   * The combobox's popup: whether it shows, its id, the row the field points at, and its kind,
   * a listbox (the suggestion list, the table layout's matches and categories) or a grid (the
   * table layout's units).
   */
  popup: {
    expanded: boolean;
    id: string | undefined;
    activeId: string | undefined;
    kind: 'listbox' | 'grid';
  };
  /** The shell is open, grown over the page around `panel` (docs/DESIGN-SYSTEM.md, "Fluid shells"). */
  open?: boolean;
  /** Rendered inside the shell under the field's row: the suggestion list. */
  panel?: ReactNode;
  /** Rendered at the end of the field, such as the copy button. */
  trailing?: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Focus left the shell, the field and its panel both. */
  onLeave?: () => void;
  /** The chip's body was clicked or tapped. */
  onChipOpen: () => void;
  /** The chip's × was clicked or tapped. */
  onChipRemove: () => void;
}

/**
 * The text layer: the visible value lives here, over a field whose own text is transparent. That
 * is what lets the exponent marker in "1.5E21" carry weight, since a field cannot style part of
 * its value. The size steps are measured against this layer (docs/DESIGN-SYSTEM.md, "Fields").
 */
const TEXT_LAYER =
  'pointer-events-none absolute inset-0 flex items-center overflow-hidden font-numeric whitespace-pre text-ink';

/**
 * "Too large to convert" in place of a value shrinks the same way a long number does, the chip's
 * name giving way first, and as a last resort wraps to two lines, so it is never cut off.
 */
const OUT_OF_RANGE =
  'pointer-events-none absolute inset-0 flex items-center overflow-hidden font-medium text-danger';
const OUT_OF_RANGE_SIZES = [
  'text-base whitespace-nowrap sm:text-lg',
  'text-sm whitespace-nowrap',
  'text-xs whitespace-nowrap',
  'text-xs leading-tight whitespace-normal',
] as const;

/**
 * The converter's field, in both layouts (docs/DESIGN-SYSTEM.md, "Fields"): a combobox input over
 * a text layer, the unit chip, a trailing slot, and the out-of-range message, the row fitted by
 * measurement, so the chip gives up its name before the value steps down a size, in a box of any
 * width. A fixed-height placeholder keeps the page still; the shell inside it grows downward over
 * the page around `panel` when open, so field and list read as one shape. What the keys do is the
 * caller's: SmartInput with two boxes, TableLayout in the table layout.
 */
export function ValueField({
  inputRef,
  label,
  boxId,
  text,
  parsed,
  locale,
  unit,
  placeholder,
  message,
  describedBy,
  popup,
  open = false,
  panel,
  trailing,
  onChange,
  onKeyDown,
  onFocus,
  onLeave,
  onChipOpen,
  onChipRemove,
}: ValueFieldProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const outOfRangeRef = useRef<HTMLDivElement>(null);
  const chipNameRef = useRef<HTMLSpanElement>(null);
  const idBase = useId();
  const inputId = `${idBase}-input`;
  const outOfRangeId = `${idBase}-out-of-range`;

  // The row is measured, not counted: in any box, wide or narrow, the chip keeps its name while
  // the value or message fits beside it at full size, then the text steps down.
  const fitTexts = useMemo<readonly FitText[]>(
    () => [
      { ref: textLayerRef, base: TEXT_LAYER, steps: NUMBER_SIZES },
      { ref: outOfRangeRef, base: OUT_OF_RANGE, steps: OUT_OF_RANGE_SIZES },
    ],
    [],
  );
  const fit = useFieldFit(rowRef, chipNameRef, fitTexts);
  const sizeClass = NUMBER_SIZES[fit.steps[0] ?? 0];
  const outOfRangeClass = OUT_OF_RANGE_SIZES[fit.steps[1] ?? 0];

  // A number too long even at the smallest size scrolls inside the field; the layer follows it.
  const syncScroll = () => {
    if (textLayerRef.current && inputRef.current) {
      textLayerRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };
  useLayoutEffect(syncScroll);

  // Leaving the shell, field and panel both, is the caller's to handle (SmartInput closes its list).
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onLeave?.();
  };

  // Inside the shell the chip and the trailing button keep the same 8 px from the top, bottom, and
  // right edges (docs/DESIGN-SYSTEM.md, "Fields").
  return (
    <div className="group relative h-16 min-w-0" data-open={open || undefined}>
      <div
        className={cx('absolute inset-x-0 top-0 rounded-lg shadow-sm', SHELL, SHELL_BORDERED)}
        onBlur={onBlur}
      >
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div ref={rowRef} className={FIELD_ROW}>
          <div className="relative min-w-0 flex-1 self-stretch">
            <input
              ref={inputRef}
              id={inputId}
              data-box={boxId}
              type="text"
              role="combobox"
              aria-expanded={popup.expanded}
              aria-controls={popup.expanded ? popup.id : undefined}
              aria-activedescendant={popup.activeId}
              aria-haspopup={popup.kind}
              aria-autocomplete="list"
              aria-describedby={message ? `${describedBy} ${outOfRangeId}` : describedBy}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellcheck={false}
              enterKeyHint="done"
              placeholder={placeholder}
              value={text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onScroll={syncScroll}
              className={cx(
                sizeClass,
                'h-full w-full bg-transparent font-numeric text-transparent caret-ink outline-none selection:bg-accent-soft placeholder:text-ink-muted',
              )}
            />
            <div ref={textLayerRef} aria-hidden="true" className={cx(TEXT_LAYER, sizeClass)}>
              <NumberText text={text} parsed={parsed} running={runningValue(parsed, locale)} />
            </div>
            {/* Always rendered, so its size is re-measured on resize; empty when there is no message. */}
            <div
              ref={outOfRangeRef}
              id={outOfRangeId}
              className={cx(OUT_OF_RANGE, outOfRangeClass)}
            >
              {message ?? ''}
            </div>
          </div>
          {unit && (
            // Out of the Tab order: the field's own keys do what the chip does. Pointers and screen
            // readers still reach both buttons.
            <UnitChip
              unit={unit}
              compact={fit.compact}
              nameRef={chipNameRef}
              onOpen={onChipOpen}
              onRemove={onChipRemove}
            />
          )}
          {trailing}
        </div>
        {panel}
      </div>
    </div>
  );
}
