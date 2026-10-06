import { search, suggest, type CategoryId, type Unit } from '@bigsmall/core';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { SuggestionPanel, type SuggestionItem } from '../../components/SuggestionPanel';
import { UnitChip } from '../../components/UnitChip';
import type { BoxView, HistoryAction, Mode } from './state';
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
  /** Rendered at the end of the field, such as the copy button. */
  trailing?: ReactNode;
}

/**
 * Where the list is looking when it is not the default scope: an expanded category.
 * `origin` decides what Escape does next: a list the user opened goes back, a list Escape
 * itself opened (after removing a unit) closes.
 */
interface Override {
  scope: CategoryId;
  origin: 'pick' | 'escape';
}

/** Numbers longer than this step down one size so about eleven digits fit beside a chip. */
const LONG_NUMBER = 9;
/** Numbers longer than this collapse the chip to its symbol. */
const COMPACT_CHIP = 6;

/**
 * One box of the converter: a text field that takes a number, a unit, or both, with the locked
 * unit shown as a chip and a suggestion listbox floating below (docs/UX-SPEC.md §2–§5, §14–§15).
 * Hand-built on the WAI-ARIA combobox pattern (ADR 0006): the input keeps focus, the listbox is
 * virtual-focused through aria-activedescendant.
 */
export function SmartInput({
  box,
  label,
  describedBy,
  mode,
  env,
  dispatch,
  trailing,
}: SmartInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const idBase = useId();
  const inputId = `${idBase}-input`;
  const listboxId = `${idBase}-listbox`;
  const optionId = (index: number) => `${idBase}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [override, setOverride] = useState<Override | null>(null);
  /** What Escape clears next: the thing most recently put into this box (docs/UX-SPEC.md §15). */
  const lastEntered = useRef<'text' | 'unit' | null>(null);

  const scope = override ? override.scope : box.scope;
  const searchOptions = {
    category: scope,
    separators: env.separators,
    system: env.system,
    tier: mode,
  } as const;

  // A query that finds nothing inside the scope widens to every category on its own, so a unit
  // from elsewhere is always one pick away and no "search all" control is needed.
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
    lastEntered.current = 'unit';
    closePanel();
  };

  const unlock = (thenList: boolean) => {
    const category = box.unit?.category ?? null;
    dispatch({ type: 'unlock', box: box.id });
    lastEntered.current = box.text ? 'text' : null;
    if (thenList && category) showList({ scope: category, origin: 'escape' });
    else closePanel();
  };

  const clearText = () => {
    dispatch({ type: 'input', box: box.id, text: '' });
    lastEntered.current = box.unit ? 'unit' : null;
  };

  /** Lock the exact match now (keystroke, when nothing longer could still be typed) or at a word boundary. */
  const tryLock = (reason: 'keystroke' | 'boundary', current = suggestion): boolean => {
    if (!current.exact) return false;
    if (reason === 'keystroke' && current.search.canExtend) return false;
    lock(current.exact);
    return true;
  };

  const pick = (item: SuggestionItem) => {
    if (item.kind === 'unit') {
      lock(item.unit);
    } else {
      if (box.isSource && query) {
        dispatch({ type: 'setText', box: box.id, text: suggestion.parsed.valueText ?? '' });
      }
      showList({ scope: item.category.id, origin: 'pick' });
    }
    focusInput();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    dispatch({ type: 'input', box: box.id, text: value });
    if (value) lastEntered.current = 'text';
    const next = suggest(value, searchOptions);
    setOpen(true);
    setActive(next.parsed.query ? 0 : -1);
    tryLock('keystroke', next);
  };

  /**
   * Escape is "back", one step at a time: an expanded list → the previous list; an open panel → closed;
   * then whatever was put into the box most recently (text or unit), then the other.
   */
  const escape = () => {
    if (override?.origin === 'pick') {
      showList(null);
      return;
    }
    if (open) {
      closePanel();
      return;
    }
    const canClearText = box.isSource && box.text !== '';
    const target = lastEntered.current ?? (canClearText ? 'text' : 'unit');
    if (target === 'text' && canClearText) clearText();
    else if (box.unit) unlock(true);
    else if (canClearText) clearText();
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
        else tryLock('boundary');
        closePanel();
        break;
      }
      case 'Escape':
        event.preventDefault();
        escape();
        break;
      case 'Tab':
        tryLock('boundary');
        break;
      case ' ':
        if (tryLock('boundary')) event.preventDefault();
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
    tryLock('boundary');
    closePanel();
  };

  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(`${idBase}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active, idBase]);

  const long = box.text.length > LONG_NUMBER;

  return (
    <div
      className="relative min-w-0 rounded-lg border border-line bg-surface shadow-sm transition-[border-color] duration-[var(--motion-fast)] ease-standard focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus"
      onBlur={onBlur}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="flex min-h-14 items-center gap-2 px-3">
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
          className={`min-w-0 flex-1 bg-transparent py-3 font-numeric text-ink outline-none placeholder:text-ink-muted ${
            long ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
          }`}
        />
        {box.unit && (
          <UnitChip
            unit={box.unit}
            compact={box.text.length > COMPACT_CHIP}
            onOpen={() => {
              showList(null);
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
        <div className="absolute inset-x-0 top-full z-20 mt-1">
          <SuggestionPanel
            id={listboxId}
            items={items}
            activeIndex={active}
            optionId={optionId}
            onBack={
              override
                ? () => {
                    showList(null);
                    focusInput();
                  }
                : undefined
            }
            message={message}
            showCategory={scope === null || widened}
            onPick={pick}
            onHover={setActive}
          />
        </div>
      )}
    </div>
  );
}
