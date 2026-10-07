import {
  formatNumber,
  getCategory,
  parse,
  search,
  suggest,
  type CategoryId,
  type ParsedInput,
  type SearchOptions,
  type Separators,
  type Suggestion,
  type Unit,
} from '@bigsmall/core';
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
import {
  BACK_ITEM,
  optionIdFor,
  SuggestionPanel,
  type SuggestionItem,
} from '../../components/SuggestionPanel';
import { UnitChip } from '../../components/UnitChip';
import { NUMBER_SIZES, useFitStep } from '../../lib/fit-step';
import { FIELD_ROW, SHELL, SHELL_BORDERED } from '../../lib/shell';
import { evaluatedText } from './calculator';
import type { BoxView, EscapeTarget, HistoryAction, Mode } from './state';
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
  /** What Escape takes back once the list is closed: the latest chunk of typing, or the unit (docs/UX-SPEC.md §9). */
  escapeTarget: EscapeTarget;
  /** Placeholder while the box has no unit and nothing scopes it, such as "5 ml, feet, °F…". */
  examples: string;
  /** The other box's unit, which a scoped placeholder leaves out. */
  counterpart: Unit | null;
  /** Rendered at the end of the field, such as the copy button. */
  trailing?: ReactNode;
}

/**
 * The list has two levels: the categories, and one category's units. Without an override the
 * level follows the box (a locked unit, or the other box's unit, puts it inside that category).
 * 'top' forces the categories; a CategoryId forces that category.
 */
type Level = 'top' | CategoryId;

/** Numbers longer than this collapse the chip to its symbol, so the number keeps its size as long as it can. */
const COMPACT_CHIP = 6;

/**
 * The text layer: the visible value lives here, over a field whose own text is transparent. That
 * is what lets the exponent marker in "1.5E21" carry weight, since a field cannot style part of
 * its value. The size steps are measured against this layer (docs/DESIGN-SYSTEM.md, "Fields").
 */
const TEXT_LAYER =
  'pointer-events-none absolute inset-0 flex items-center overflow-hidden font-numeric whitespace-pre text-ink';

/**
 * "Too large to convert" in place of a value shrinks the same way a long number does, and as a
 * last resort wraps to two lines, so it is never cut off.
 */
const OUT_OF_RANGE =
  'pointer-events-none absolute inset-0 flex items-center overflow-hidden font-medium text-danger';
const OUT_OF_RANGE_STEPS = [
  'text-base whitespace-nowrap sm:text-lg',
  'text-sm whitespace-nowrap',
  'text-xs whitespace-nowrap',
  'text-xs leading-tight whitespace-normal',
] as const;

/**
 * One box of the converter: a text field that takes a number, a unit, or both, with the committed
 * unit shown as a chip and a suggestion list that grows out of the field over the page
 * (docs/UX-SPEC.md §3, §5, §7–§9). Hand-built on the WAI-ARIA combobox pattern (ADR 0006).
 * Nothing commits on a keystroke: the best match is highlighted and Enter or a pick commits it.
 * Tab and leaving the box never commit, so moving between boxes never changes what was typed.
 */
export function SmartInput({
  box,
  label,
  describedBy,
  mode,
  env,
  dispatch,
  escapeTarget,
  examples,
  counterpart,
  trailing,
}: SmartInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const outOfRangeRef = useRef<HTMLDivElement>(null);
  const idBase = useId();
  const inputId = `${idBase}-input`;
  const listboxId = `${idBase}-listbox`;
  const outOfRangeId = `${idBase}-out-of-range`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [level, setLevel] = useState<Level | null>(null);

  const scope = level ? (level === 'top' ? null : level) : box.scope;
  const listOptions = {
    separators: env.separators,
    system: env.system,
    // The UI's modes map onto core's tiers: basic lists basic units, advanced lists them all.
    tier: mode === 'basic' ? 'basic' : 'all',
  } as const;
  const { suggestion, query, widened, noMatch, items, firstResult } = buildList(
    box.text,
    scope,
    listOptions,
  );

  const notFound = noMatch ? `No unit matches “${query}”. Try ml, feet, or °F.` : undefined;

  // What the empty field suggests: a number once it has a unit, a few units of its category
  // once the other box has chosen one, otherwise this box's own examples. A message about the
  // conversion takes the placeholder's place, so a value that cannot be shown never reads as 0.
  const placeholder = box.message
    ? ''
    : box.unit
      ? '0'
      : box.scope
        ? scopedExamples(box.scope, counterpart, listOptions.tier)
        : examples;

  const sizeClass = NUMBER_SIZES[useFitStep(textLayerRef, TEXT_LAYER, NUMBER_SIZES)];
  const outOfRangeClass =
    OUT_OF_RANGE_STEPS[useFitStep(outOfRangeRef, OUT_OF_RANGE, OUT_OF_RANGE_STEPS)];

  // A number too long even at the smallest size scrolls inside the field; the layer follows it.
  const syncScroll = () => {
    if (textLayerRef.current && inputRef.current) {
      textLayerRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };
  useLayoutEffect(syncScroll);

  const focusInput = () => inputRef.current?.focus();

  const showList = (next: Level | null) => {
    setLevel(next);
    setOpen(true);
    setActive(-1);
  };

  const closePanel = () => {
    setOpen(false);
    setActive(-1);
    setLevel(null);
  };

  const lock = (unit: Unit) => {
    dispatch({ type: 'lock', box: box.id, unit: unit.id });
    closePanel();
  };

  const unlock = (thenList: boolean) => {
    const category = box.unit?.category ?? null;
    dispatch({ type: 'unlock', box: box.id });
    if (thenList && category) showList(category);
    else closePanel();
  };

  /** Enter with nothing to commit on arithmetic: it becomes its value, the unit staying (docs/UX-SPEC.md §5). */
  const evaluate = () => {
    const text = evaluatedText(box.text, env);
    if (text !== null) dispatch({ type: 'replace', box: box.id, text });
  };

  /** Commit the exact match, if the query names exactly one unit: Enter with no row highlighted. */
  const commitExact = (): boolean => {
    if (!suggestion.exact) return false;
    lock(suggestion.exact);
    return true;
  };

  /**
   * Up to the categories with the category just left highlighted, so Enter goes straight back
   * in. When a query hides that row, the best match is highlighted instead, as while typing.
   */
  const goUp = () => {
    const top = buildList(box.text, null, listOptions);
    const left = top.items.findIndex(
      (item) => item.kind === 'category' && item.category.id === scope,
    );
    setLevel('top');
    setOpen(true);
    setActive(left >= 0 ? left : top.query ? top.firstResult : -1);
  };

  const pick = (item: SuggestionItem) => {
    if (item.kind === 'back') {
      goUp();
    } else if (item.kind === 'unit') {
      lock(item.unit);
    } else {
      // Entering a category drops the query that found it, in either box, and keeps any number.
      if (query) {
        dispatch({ type: 'setText', box: box.id, text: suggestion.parsed.valueText ?? '' });
      }
      showList(item.category.id);
    }
    focusInput();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    dispatch({ type: 'input', box: box.id, text: value, at: performance.now() });
    setOpen(true);
    setActive(parse(value, env.separators).query ? firstResult : -1);
  };

  /**
   * Escape is "back": inside a category → the categories; at the categories → closed; closed →
   * take back the latest thing put into this box, one chunk of typing or the unit at a time.
   */
  const escape = () => {
    if (open && scope !== null) {
      goUp();
      return;
    }
    if (open) {
      closePanel();
      return;
    }
    if (escapeTarget === null) return;
    const category = box.unit?.category ?? null;
    dispatch({ type: 'stepBack', box: box.id });
    if (escapeTarget === 'unit' && category) showList(category);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey) return; // shortcuts such as undo are handled by the converter
    const count = items.length;
    switch (event.key) {
      case 'ArrowDown':
        // From nothing, Down goes to the first unit or category; from the last row it wraps to
        // Back. Up from the first unit reaches Back, so Back is one key away in either direction.
        event.preventDefault();
        setOpen(true);
        if (count) setActive((i) => (i < 0 ? Math.min(firstResult, count - 1) : (i + 1) % count));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        if (count) setActive((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter': {
        // Commit and close while keeping focus here. Back and category rows move between the
        // list's levels instead, so the list stays open.
        event.preventDefault();
        const item = open && active >= 0 ? items[active] : undefined;
        if (item?.kind === 'category' || item?.kind === 'back') {
          pick(item);
          break;
        }
        if (item) pick(item);
        else if (!commitExact()) evaluate();
        closePanel();
        break;
      }
      case 'Escape':
        event.preventDefault();
        escape();
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
    // Back in a box that holds an uncommitted query, its best match is highlighted again, so
    // Enter takes it just as it would have before the box was left.
    setOpen(true);
    setActive(query ? firstResult : -1);
    if (!box.isSource && event.target.value) event.target.select();
  };

  // Leaving the box only closes the list: a query stays as typed until Enter or a pick.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    closePanel();
  };

  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(optionIdFor(listboxId, active))?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active, listboxId]);

  const scopeName = scope ? getCategory(scope)?.name : undefined;

  // A fixed-height placeholder keeps the page layout still; the shell inside it grows downward
  // over the page when the list opens, so field and list read as one shape (lib/shell.ts). Inside,
  // the chip and the trailing button keep the same 8 px from the top, bottom, and right edges
  // (docs/DESIGN-SYSTEM.md, "Fields").
  return (
    <div className="group relative h-16 min-w-0" data-open={open || undefined}>
      <div
        className={`absolute inset-x-0 top-0 rounded-lg shadow-sm ${SHELL} ${SHELL_BORDERED}`}
        onBlur={onBlur}
      >
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <div className={FIELD_ROW}>
          <div className="relative min-w-0 flex-1 self-stretch">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              aria-activedescendant={
                open && active >= 0 ? optionIdFor(listboxId, active) : undefined
              }
              aria-autocomplete="list"
              aria-describedby={box.message ? `${describedBy} ${outOfRangeId}` : describedBy}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={placeholder}
              value={box.text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onScroll={syncScroll}
              className={`${sizeClass} h-full w-full bg-transparent font-numeric text-transparent caret-ink outline-none selection:bg-accent-soft placeholder:text-ink-muted`}
            />
            <div ref={textLayerRef} aria-hidden="true" className={`${TEXT_LAYER} ${sizeClass}`}>
              <NumberText
                text={box.text}
                parsed={suggestion.parsed}
                running={runningValue(suggestion.parsed, env.locale)}
              />
            </div>
            {/* Always rendered, so its size is re-measured on resize; empty when there is no message. */}
            <div
              ref={outOfRangeRef}
              id={outOfRangeId}
              className={`${OUT_OF_RANGE} ${outOfRangeClass}`}
            >
              {box.message ?? ''}
            </div>
          </div>
          {box.unit && (
            // Out of the Tab order: Tab goes to the next box, and the field's own keys do what
            // the chip does (Down or typing lists the units; Backspace on an empty field or
            // Escape removes the unit). Pointers and screen readers still reach both buttons.
            // A message needs the room a long number does, so it also collapses the chip.
            <UnitChip
              unit={box.unit}
              compact={box.text.length > COMPACT_CHIP || box.message !== null}
              inTabOrder={false}
              onOpen={() => {
                showList(box.unit ? box.unit.category : null);
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
            label={`${label} suggestions`}
            items={items}
            activeIndex={active}
            query={noMatch ? undefined : query}
            scopeName={scopeName}
            notFound={notFound}
            showCategory={scope === null || widened}
            onPick={pick}
            onHover={setActive}
          />
        )}
      </div>
    </div>
  );
}

/** What a list needs besides its scope: the visitor's number format, unit family, and tier. */
type ListOptions = Required<Pick<SearchOptions, 'system' | 'tier'>> & { separators: Separators };

interface ListModel {
  suggestion: Suggestion;
  /** The unit query; '' when only a number, or nothing, is typed. */
  query: string;
  /** A query found nothing in the scope, so the list widened to every category. */
  widened: boolean;
  /** A query found nothing anywhere, so the list offers the categories. */
  noMatch: boolean;
  items: SuggestionItem[];
  /** The best match's row: the first, or the one after Back. */
  firstResult: number;
}

/**
 * The rows a box lists at one level: the scope's units, or the categories without a scope. A
 * query that finds nothing inside the scope widens to every category on its own, so a unit from
 * elsewhere is always one pick away. Inside a category the Back row comes first, so the arrow
 * keys reach it like any other row.
 */
function buildList(text: string, scope: CategoryId | null, options: ListOptions): ListModel {
  const scoped = suggest(text, { ...options, category: scope });
  const query = scoped.parsed.query ?? '';
  const widened = scope !== null && query !== '' && scoped.search.results.length === 0;
  const suggestion = widened ? suggest(text, { ...options, category: null }) : scoped;
  const noMatch = query !== '' && suggestion.search.results.length === 0;
  const listed = noMatch ? search('', { tier: options.tier }).results : suggestion.search.results;
  const hasBack = scope !== null;
  return {
    suggestion,
    query,
    widened,
    noMatch,
    firstResult: hasBack ? 1 : 0,
    items: [
      ...(hasBack ? [BACK_ITEM] : []),
      ...listed.map((result): SuggestionItem =>
        result.kind === 'unit'
          ? { kind: 'unit', key: result.unit.id, unit: result.unit }
          : { kind: 'category', key: `#${result.category.id}`, category: result.category },
      ),
    ],
  };
}

/**
 * A few units an empty box could take once the other box has chosen its category, in display
 * order (most common first) and without the other box's unit: "L, tsp, tbsp…" beside milliliters.
 */
function scopedExamples(
  scope: CategoryId,
  counterpart: Unit | null,
  tier: 'basic' | 'all',
): string {
  const symbols = search('', { category: scope, tier })
    .results.flatMap((result) =>
      result.kind === 'unit' && result.unit.id !== counterpart?.id ? [result.unit.symbol] : [],
    )
    .slice(0, 3);
  return `${symbols.join(', ')}…`;
}

/**
 * The field's text with each exponent marker set in a heavier weight, so "1.5E21" reads as a
 * number with an exponent rather than a run of characters, then the running value of arithmetic
 * in the muted color ("5 + 3 = 8"). The parser says where the markers are, so an "e" that is
 * still part of a unit query stays regular.
 */
function NumberText({
  text,
  parsed,
  running,
}: {
  text: string;
  parsed: ParsedInput;
  running: string | null;
}) {
  const start = parsed.valueText ? text.indexOf(parsed.valueText) : -1;
  const marks = start < 0 ? [] : (parsed.exponentMarks ?? []).map((at) => start + at);
  const pieces: ReactNode[] = [];
  let from = 0;
  for (const at of marks) {
    pieces.push(
      text.slice(from, at),
      <span key={at} className="font-semibold" data-marker>
        {text[at]}
      </span>,
    );
    from = at + 1;
  }
  pieces.push(text.slice(from));
  return (
    <>
      {pieces}
      {running !== null && (
        <span className="text-ink-muted" data-running>
          {` = ${running}`}
        </span>
      )}
    </>
  );
}

/** The value of a box holding arithmetic and nothing else, formatted as results are. */
function runningValue(parsed: ParsedInput, locale: string | undefined): string | null {
  if (!parsed.expression || parsed.value === undefined || parsed.query) return null;
  return formatNumber(parsed.value, locale ? { locale } : {});
}
