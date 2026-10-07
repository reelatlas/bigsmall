import {
  getCategory,
  parse,
  search,
  suggest,
  type CategoryId,
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
  toSuggestionItem,
  type SuggestionItem,
} from '../../components/SuggestionPanel';
import { NumberText, runningValue } from '../../components/NumberText';
import { UnitChip } from '../../components/UnitChip';
import { useFitStep } from '../../lib/fit-step';
import { cx, FIELD_ROW, NUMBER_SIZES, SHELL, SHELL_BORDERED } from '../../lib/recipes';
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
  /** Enter committed or kept the box's unit and closed the list; the converter decides whether the caret moves on (docs/UX-SPEC.md §5). */
  onEnter: () => void;
}

/**
 * The list has two levels: the categories, and one category's units. Without an override the
 * level follows the box (a locked unit, or the other box's unit, puts it inside that category).
 * 'top' forces the categories; a CategoryId forces that category.
 */
type Level = 'top' | CategoryId;

/** A number longer than this many characters collapses the chip to its symbol, so the number keeps its size as long as it can. */
const COMPACT_CHIP_AFTER = 6;

/** How many units of the other box's category an empty box suggests ("L, tsp, tbsp…"). */
const SCOPED_EXAMPLES = 3;

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
const OUT_OF_RANGE_SIZES = [
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
  onEnter,
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
    OUT_OF_RANGE_SIZES[useFitStep(outOfRangeRef, OUT_OF_RANGE, OUT_OF_RANGE_SIZES)];

  // A number too long even at the smallest size scrolls inside the field; the layer follows it.
  const syncScroll = () => {
    if (textLayerRef.current && inputRef.current) {
      textLayerRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };
  useLayoutEffect(syncScroll);

  const focusInput = () => inputRef.current?.focus();

  /**
   * How the list brings the highlighted row into view the next time the highlight changes. A row
   * the arrow keys reach scrolls in at the nearest edge. A row the list opens resting on is
   * centered, with its neighbors around it. A row the mouse moves over stays where it is: moving
   * the pointer never scrolls the list, which the wheel, trackpad, scrollbar, and touch do.
   */
  const reveal = useRef<'nearest' | 'center' | 'none'>('nearest');

  /** The row of `unitId` (by default the box's own unit) among `rows`, or -1. */
  const unitRow = (rows: readonly SuggestionItem[], unitId = box.unit?.id) =>
    unitId ? rows.findIndex((item) => item.kind === 'unit' && item.unit.id === unitId) : -1;

  /** Highlights a row the list opens on, centered: the box's unit, so the list starts where the box is. */
  const rest = (row: number) => {
    reveal.current = row >= 0 ? 'center' : 'nearest';
    setActive(row);
  };

  /** Highlights the row the mouse moved over, leaving the list's scroll where it is. */
  const point = (row: number) => {
    reveal.current = 'none';
    setActive(row);
  };

  /**
   * Opens the list at `next` resting on the box's unit, or on the unit just removed, when that
   * level lists it. `text` is the box's text once the change that opens it has landed.
   */
  const showList = (next: Level | null, text = box.text, unitId = box.unit?.id) => {
    setLevel(next);
    setOpen(true);
    const rows = buildList(text, next === 'top' ? null : (next ?? box.scope), listOptions).items;
    rest(unitRow(rows, unitId));
  };

  /**
   * Opens the list where the box is: on the best match of a query still typed, so Enter takes it
   * just as it would have before the list closed, otherwise resting on the box's unit.
   */
  const reopen = () => {
    setOpen(true);
    if (query) setActive(firstResult);
    else rest(unitRow(items));
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
      const text = query ? (suggestion.parsed.valueText ?? '') : box.text;
      if (query) dispatch({ type: 'setText', box: box.id, text });
      showList(item.category.id, text);
    }
    focusInput();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
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
      case 'ArrowUp':
        event.preventDefault();
        // A closed list opens resting on the box's unit, like a click or focus.
        if (!open && !query && unitRow(items) >= 0) {
          setOpen(true);
          rest(unitRow(items));
          break;
        }
        setOpen(true);
        if (!count) break;
        // From nothing, Down goes to the first unit or category; from the last row it wraps to
        // Back. Up from the first unit reaches Back, so Back is one key away in either direction.
        reveal.current = 'nearest';
        if (event.key === 'ArrowDown') {
          setActive((i) => (i < 0 ? Math.min(firstResult, count - 1) : (i + 1) % count));
        } else setActive((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter': {
        event.preventDefault();
        // On a closed list with nothing to commit or work out, Enter opens it again, so Enter
        // toggles the list.
        if (!open && !suggestion.exact && evaluatedText(box.text, env) === null) {
          reopen();
          break;
        }
        // Commit and close; the converter then moves the caret on when the other box still
        // needs a unit. Back and category rows move between the list's levels instead, so the
        // list stays open.
        const item = open && active >= 0 ? items[active] : undefined;
        if (item?.kind === 'category' || item?.kind === 'back') {
          pick(item);
          break;
        }
        // The box's own unit, highlighted because the list opened on it, changes nothing: Enter
        // does what it does with no row, evaluating any arithmetic, and closes.
        const own = item?.kind === 'unit' && item.unit.id === box.unit?.id;
        if (item && !own) pick(item);
        else if (!commitExact()) evaluate();
        closePanel();
        onEnter();
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
    // Back in a box that holds an uncommitted query, its best match is highlighted again;
    // otherwise the list rests on the box's unit, so it opens where the box is.
    reopen();
    if (!box.isSource && event.currentTarget.value) event.currentTarget.select();
  };

  // Leaving the box only closes the list: a query stays as typed until Enter or a pick.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    closePanel();
  };

  useEffect(() => {
    const how = reveal.current;
    reveal.current = 'nearest';
    if (!open || active < 0 || how === 'none') return;
    const row = document.getElementById(optionIdFor(listboxId, active));
    const list = document.getElementById(listboxId);
    if (!row || !list) return;
    if (how === 'center') {
      // Only the list scrolls: scrollIntoView would move the page too.
      const { top, height } = row.getBoundingClientRect();
      const box = list.getBoundingClientRect();
      list.scrollTop += top - box.top - (box.height - height) / 2;
    } else row.scrollIntoView({ block: 'nearest' });
  }, [open, active, listboxId]);

  const scopeName = scope ? getCategory(scope)?.name : undefined;

  // A fixed-height placeholder keeps the page layout still; the shell inside it grows downward
  // over the page when the list opens, so field and list read as one shape (lib/recipes.ts). Inside,
  // the chip and the trailing button keep the same 8 px from the top, bottom, and right edges
  // (docs/DESIGN-SYSTEM.md, "Fields").
  return (
    <div className="group relative h-16 min-w-0" data-open={open || undefined}>
      <div
        className={cx('absolute inset-x-0 top-0 rounded-lg shadow-sm', SHELL, SHELL_BORDERED)}
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
              data-box={box.id}
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
              spellcheck={false}
              enterKeyHint="done"
              placeholder={placeholder}
              value={box.text}
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
              className={cx(OUT_OF_RANGE, outOfRangeClass)}
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
              compact={box.text.length > COMPACT_CHIP_AFTER || box.message !== null}
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
            onHover={point}
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
    items: [...(hasBack ? [BACK_ITEM] : []), ...listed.map(toSuggestionItem)],
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
    .slice(0, SCOPED_EXAMPLES);
  return `${symbols.join(', ')}…`;
}
