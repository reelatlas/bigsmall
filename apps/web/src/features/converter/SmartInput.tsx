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
import {
  SuggestionPanel,
  type PanelHeader,
  type SuggestionItem,
} from '../../components/SuggestionPanel';
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
  /** Rendered at the end of the field, such as the copy button on the result box. */
  trailing?: ReactNode;
}

/**
 * Where the list is looking when it is not the default scope. 'all' is the escape hatch out of
 * the category scope; a CategoryId is an expanded category. `origin` decides what Escape does next:
 * a list the user opened goes back, a list Escape itself opened (after unlocking) closes.
 */
interface Override {
  scope: 'all' | CategoryId;
  origin: 'pick' | 'escape';
}

/**
 * One box of the converter: a text field that takes a number, a unit, or both, with the locked
 * unit shown as a chip and a suggestion listbox below (docs/UX-SPEC.md §2–§5, §14).
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

  const scope = override ? (override.scope === 'all' ? null : override.scope) : box.scope;
  const searchOptions = {
    category: scope,
    separators: env.separators,
    system: env.system,
    tier: mode,
  } as const;

  const suggestion = suggest(box.text, searchOptions);
  const query = suggestion.parsed.query ?? '';
  const noMatch = query !== '' && suggestion.search.results.length === 0;
  const listed = noMatch ? search('', { tier: mode }).results : suggestion.search.results;

  const items: SuggestionItem[] = listed.map((result) =>
    result.kind === 'unit'
      ? { kind: 'unit', key: result.unit.id, unit: result.unit }
      : { kind: 'category', key: `#${result.category.id}`, category: result.category },
  );

  const message = noMatch
    ? `No unit matches “${query}”. Try ml, feet, or °F.`
    : !query && !box.unit && suggestion.parsed.value !== undefined
      ? 'Now pick a unit'
      : undefined;

  const focusInput = () => inputRef.current?.focus();

  const showList = (next: Override | null) => {
    setOverride(next);
    setOpen(true);
    setActive(-1);
  };

  const header: PanelHeader | undefined = override
    ? {
        label: 'Back',
        back: true,
        onClick: () => {
          showList(null);
          focusInput();
        },
      }
    : scope
      ? {
          label: 'Search all categories',
          back: false,
          onClick: () => {
            showList({ scope: 'all', origin: 'pick' });
            focusInput();
          },
        }
      : undefined;

  const lock = (unit: Unit) => {
    dispatch({ type: 'lock', box: box.id, unit: unit.id });
    setOverride(null);
    setOpen(false);
    setActive(-1);
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
    const next = suggest(value, searchOptions);
    setOpen(true);
    setActive(next.parsed.query ? 0 : -1);
    tryLock('keystroke', next);
  };

  /** Escape is "back", one step at a time: expanded list → unit → panel → text (docs/UX-SPEC.md §14). */
  const escape = () => {
    if (override?.origin === 'pick') {
      showList(null);
      return;
    }
    if (box.unit) {
      const category = box.unit.category;
      dispatch({ type: 'unlock', box: box.id });
      showList({ scope: category, origin: 'escape' });
      return;
    }
    if (open) {
      setOpen(false);
      setActive(-1);
      setOverride(null);
      return;
    }
    if (box.isSource && box.text) dispatch({ type: 'input', box: box.id, text: '' });
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
        event.preventDefault();
        const item = open && active >= 0 ? items[active] : undefined;
        if (item) pick(item);
        else tryLock('boundary');
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
          dispatch({ type: 'unlock', box: box.id });
          setOpen(true);
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
    setOpen(false);
    setActive(-1);
    setOverride(null);
  };

  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(`${idBase}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active, idBase]);

  return (
    <div
      className="min-w-0 rounded-lg border border-line bg-surface shadow-sm transition-[border-color] duration-[var(--motion-fast)] ease-standard focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus"
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
          className="min-w-0 flex-1 bg-transparent py-3 font-numeric text-2xl text-ink outline-none placeholder:text-ink-muted sm:text-3xl"
        />
        {box.unit && (
          <UnitChip
            unit={box.unit}
            onOpen={() => {
              showList(null);
              focusInput();
            }}
            onRemove={() => {
              dispatch({ type: 'unlock', box: box.id });
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
          header={header}
          message={message}
          showCategory={scope === null}
          onPick={pick}
          onHover={setActive}
        />
      )}
    </div>
  );
}
