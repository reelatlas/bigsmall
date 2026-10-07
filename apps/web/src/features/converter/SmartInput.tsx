import { getCategory, search, suggest, type CategoryId, type Unit } from '@bigsmall/core';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { SuggestionPanel, type SuggestionItem } from '../../components/SuggestionPanel';
import { UnitChip } from '../../components/UnitChip';
import { useFitStep } from '../../lib/fit-step';
import type { BoxId, BoxView, EscapeTarget, HistoryAction, Mode } from './state';
import type { ConverterEnv } from './useConverter';

export interface SmartInputProps {
  box: BoxView;
  /** Accessible name of the field. */
  label: string;
  /** Id of the shared hint paragraph. */
  describedBy: string;
  mode: Mode;
  env: ConverterEnv;
  dispatch: (action: HistoryAction) => void;
  /** What Escape takes back once the list is closed: the latest chunk of typing, or the unit (docs/UX-SPEC.md §17). */
  escapeTarget: EscapeTarget;
  /** Reports the category the open list is inside, or null when the list is closed or at the top level. */
  onBrowse?: (box: BoxId, category: CategoryId | null) => void;
  /** Rendered at the end of the field, such as the copy button. */
  trailing?: ReactNode;
}

/**
 * The list has two levels: the categories, and one category's units. Without an override the
 * level follows the box (a locked unit, or the other box's unit, puts it inside that category).
 * 'all' forces the top level; a CategoryId forces that category.
 */
interface Override {
  scope: 'all' | CategoryId;
}

/** Type sizes the number steps down through until it fits on one line, largest first. */
const SIZE_STEPS = [
  'text-2xl sm:text-3xl',
  'text-xl sm:text-2xl',
  'text-lg sm:text-xl',
  'text-base sm:text-lg',
  'text-base',
] as const;
/** Numbers longer than this collapse the chip to its symbol, so the number keeps its size as long as it can. */
const COMPACT_CHIP = 6;

/**
 * The visible text lives in this layer over the field, whose own text is transparent. That is
 * what lets the exponent marker in "1.5E21" carry weight: a field cannot style part of its value.
 * The layer is also what the size steps are measured against.
 */
const MIRROR =
  'pointer-events-none absolute inset-0 flex items-center overflow-hidden font-numeric whitespace-pre text-ink';

/**
 * One box of the converter: a text field that takes a number, a unit, or both, with the locked
 * unit shown as a chip and a suggestion list that grows out of the field over the page
 * (docs/UX-SPEC.md §2–§5, §14–§17). Hand-built on the WAI-ARIA combobox pattern (ADR 0006).
 * Nothing locks on a keystroke: the best match is highlighted and Enter, a pick, or leaving the
 * field commits it.
 */
export function SmartInput({
  box,
  label,
  describedBy,
  mode,
  env,
  dispatch,
  escapeTarget,
  onBrowse,
  trailing,
}: SmartInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const idBase = useId();
  const inputId = `${idBase}-input`;
  const listboxId = `${idBase}-listbox`;
  const optionId = (index: number) => `${idBase}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [override, setOverride] = useState<Override | null>(null);

  const scope = override ? (override.scope === 'all' ? null : override.scope) : box.scope;
  const searchOptions = {
    category: scope,
    separators: env.separators,
    system: env.system,
    tier: mode,
  } as const;

  // A query that finds nothing inside the category widens to every category on its own, so a
  // unit from elsewhere is always one pick away.
  const scoped = suggest(box.text, searchOptions);
  const query = scoped.parsed.query ?? '';
  const widened = scope !== null && query !== '' && scoped.search.results.length === 0;
  const suggestion = widened ? suggest(box.text, { ...searchOptions, category: null }) : scoped;
  const noMatch = query !== '' && suggestion.search.results.length === 0;
  const listed = noMatch ? search('', { tier: mode }).results : suggestion.search.results;

  const items: SuggestionItem[] = listed.map((result) =>
    result.kind === 'unit'
      ? { kind: 'unit', key: result.unit.id, unit: result.unit }
      : { kind: 'category', key: `#${result.category.id}`, category: result.category },
  );

  const message = noMatch ? `No unit matches “${query}”. Try ml, feet, or °F.` : undefined;

  useEffect(() => {
    onBrowse?.(box.id, open ? scope : null);
  }, [open, scope, onBrowse, box.id]);

  const sizeClass = SIZE_STEPS[useFitStep(mirrorRef, MIRROR, SIZE_STEPS)];

  // A number too long even at the smallest size scrolls inside the field; the layer follows it.
  const syncScroll = () => {
    if (mirrorRef.current && inputRef.current) {
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };
  useLayoutEffect(syncScroll);

  const focusInput = () => inputRef.current?.focus();

  const showList = (next: Override | null) => {
    setOverride(next);
    setOpen(true);
    setActive(-1);
  };

  const closePanel = () => {
    setOpen(false);
    setActive(-1);
    setOverride(null);
  };

  const lock = (unit: Unit) => {
    dispatch({ type: 'lock', box: box.id, unit: unit.id });
    closePanel();
  };

  const unlock = (thenList: boolean) => {
    const category = box.unit?.category ?? null;
    dispatch({ type: 'unlock', box: box.id });
    if (thenList && category) showList({ scope: category });
    else closePanel();
  };

  /** Commit the exact match, if the query names exactly one unit. Used by Enter, Tab, and blur. */
  const commitExact = (): boolean => {
    if (!suggestion.exact) return false;
    lock(suggestion.exact);
    return true;
  };

  const pick = (item: SuggestionItem) => {
    if (item.kind === 'unit') {
      lock(item.unit);
    } else {
      if (box.isSource && query) {
        dispatch({ type: 'setText', box: box.id, text: suggestion.parsed.valueText ?? '' });
      }
      showList({ scope: item.category.id });
    }
    focusInput();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    dispatch({ type: 'input', box: box.id, text: value, at: performance.now() });
    const next = suggest(value, searchOptions);
    setOpen(true);
    setActive(next.parsed.query ? 0 : -1);
  };

  /**
   * Escape is "back": inside a category → the categories; at the categories → closed; closed →
   * take back the latest thing put into this box, one chunk of typing or the unit at a time.
   */
  const escape = () => {
    if (open && scope !== null) {
      showList({ scope: 'all' });
      return;
    }
    if (open) {
      closePanel();
      return;
    }
    if (escapeTarget === null) return;
    const category = box.unit?.category ?? null;
    dispatch({ type: 'stepBack', box: box.id });
    if (escapeTarget === 'unit' && category) showList({ scope: category });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey) return; // shortcuts such as undo are handled by the converter
    const count = items.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        if (count) setActive((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        if (count) setActive((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter': {
        // Commit and close, like clicking out, while keeping focus here.
        event.preventDefault();
        const item = open && active >= 0 ? items[active] : undefined;
        if (item?.kind === 'category') {
          pick(item);
          break;
        }
        if (item) pick(item);
        else commitExact();
        closePanel();
        break;
      }
      case 'Escape':
        event.preventDefault();
        escape();
        break;
      case 'Tab':
        commitExact();
        break;
      case 'Backspace':
        if (box.unit && event.currentTarget.value === '') {
          event.preventDefault();
          unlock(true);
        }
        break;
    }
  };

  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    setOpen(true);
    if (!box.isSource && event.target.value) event.target.select();
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    commitExact();
    closePanel();
  };

  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(`${idBase}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active, idBase]);

  const scopeName = scope ? getCategory(scope)?.name : undefined;

  // A fixed-height placeholder keeps the page layout still; the shell inside it grows downward
  // over the page when the list opens, so field and list read as one shape. The edge is a real
  // two-pixel border, which nothing inside can paint over.
  return (
    <div className="relative h-14 min-w-0">
      <div
        className={`absolute inset-x-0 top-0 overflow-hidden rounded-lg border-2 bg-surface transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-standard focus-within:border-accent ${
          open ? 'z-20 border-accent shadow-md' : 'border-line shadow-sm'
        }`}
        onBlur={onBlur}
      >
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div className="flex h-13 items-center gap-2 px-3">
          <div className="relative min-w-0 flex-1 self-stretch">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
              aria-autocomplete="list"
              aria-describedby={describedBy}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={box.unit ? '0' : 'Type 5 ml, feet, °F…'}
              value={box.text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onScroll={syncScroll}
              className={`${sizeClass} h-full w-full bg-transparent font-numeric text-transparent caret-ink outline-none selection:bg-accent-soft placeholder:text-ink-muted`}
            />
            <div ref={mirrorRef} aria-hidden="true" className={`${MIRROR} ${sizeClass}`}>
              <NumberText text={box.text} valueText={suggestion.parsed.valueText} />
            </div>
          </div>
          {box.unit && (
            <UnitChip
              unit={box.unit}
              compact={box.text.length > COMPACT_CHIP}
              onOpen={() => {
                showList(box.unit ? { scope: box.unit.category } : null);
                focusInput();
              }}
              onRemove={() => {
                unlock(false);
                focusInput();
              }}
            />
          )}
          {trailing}
        </div>
        {open && (
          <SuggestionPanel
            id={listboxId}
            items={items}
            activeIndex={active}
            optionId={optionId}
            onBack={
              scope !== null
                ? () => {
                    showList({ scope: 'all' });
                    focusInput();
                  }
                : undefined
            }
            scopeName={scopeName}
            message={message}
            showCategory={scope === null || widened}
            onPick={pick}
            onHover={setActive}
          />
        )}
      </div>
    </div>
  );
}

/**
 * The field's text with the exponent marker set in a heavier weight, so "1.5E21" reads as a
 * number with an exponent rather than a run of characters. Only the marker inside the parsed
 * number counts; an "e" that is still part of a unit query stays regular.
 */
function NumberText({ text, valueText }: { text: string; valueText: string | undefined }) {
  const start = valueText ? text.indexOf(valueText) : -1;
  const markerAt = valueText ? valueText.search(/[eE]/) : -1;
  if (!valueText || start < 0 || markerAt < 0) return text;
  const markerIndex = start + markerAt;
  return (
    <>
      {text.slice(0, markerIndex)}
      <span className="font-semibold" data-marker>
        {text[markerIndex]}
      </span>
      {text.slice(markerIndex + 1)}
    </>
  );
}
