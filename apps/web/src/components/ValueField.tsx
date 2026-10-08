import type { ParsedInput, Unit } from '@bigsmall/core';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ChangeEvent,
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
  text: string;
  /** The text as parsed, which draws its exponent markers and running value. */
  parsed: ParsedInput;
  /** The locale the running value is formatted in. */
  locale: string | undefined;
  unit: Unit | null;
  placeholder: string;
  /** Id of the hint that describes the field. */
  describedBy: string;
  /**
   * The combobox's popup, the list under the field: whether it shows, its id, the item the field
   * points at, and its kind, a listbox (the matches, the categories) or a grid (the units).
   */
  popup: {
    expanded: boolean;
    id: string;
    activeId: string | undefined;
    kind: 'listbox' | 'grid';
  };
  /** Rendered at the end of the field: the copy button. */
  trailing?: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
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
 * The converter's field (docs/DESIGN-SYSTEM.md, "Fields"): a combobox input over a text layer, the
 * unit chip, and a trailing slot, the row fitted by measurement, so the chip gives up its name
 * before the value steps down a size, in a box of any width. Its edge is a shell's at rest, the
 * accent while focus is inside. What the keys do is its host's (TableLayout).
 */
export function ValueField({
  inputRef,
  label,
  text,
  parsed,
  locale,
  unit,
  placeholder,
  describedBy,
  popup,
  trailing,
  onChange,
  onKeyDown,
  onChipOpen,
  onChipRemove,
}: ValueFieldProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const chipNameRef = useRef<HTMLSpanElement>(null);
  const inputId = `${useId()}-input`;

  // The row is measured, not counted: in any box, wide or narrow, the chip keeps its name while
  // the value fits beside it at full size, then the value steps down.
  const fitText = useMemo<FitText>(
    () => ({ ref: textLayerRef, base: TEXT_LAYER, steps: NUMBER_SIZES }),
    [],
  );
  const fit = useFieldFit(rowRef, chipNameRef, fitText);
  const sizeClass = NUMBER_SIZES[fit.step];

  // A number too long even at the smallest size scrolls inside the field; the layer follows it.
  const syncScroll = () => {
    if (textLayerRef.current && inputRef.current) {
      textLayerRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };
  useLayoutEffect(syncScroll);

  // The chip and the trailing button keep the same 8 px from the top, bottom, and right edges
  // (docs/DESIGN-SYSTEM.md, "Fields").
  return (
    <div className={cx('min-w-0 rounded-lg shadow-sm', SHELL, SHELL_BORDERED)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div ref={rowRef} className={FIELD_ROW}>
        <div className="relative min-w-0 flex-1 self-stretch">
          <input
            ref={inputRef}
            id={inputId}
            data-field
            type="text"
            role="combobox"
            aria-expanded={popup.expanded}
            aria-controls={popup.expanded ? popup.id : undefined}
            aria-activedescendant={popup.activeId}
            aria-haspopup={popup.kind}
            aria-autocomplete="list"
            aria-describedby={describedBy}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellcheck={false}
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
    </div>
  );
}
