import {
  categories,
  convert,
  formatNumber,
  getCategory,
  getUnit,
  localeSeparators,
  parse,
  regionDefaults,
  search,
  suggest,
  type Category,
  type CategoryId,
  type SearchResult,
  type Separators,
  type Unit,
  type UnitPreference,
} from '@bigsmall/core';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Button } from '../../../components/Button';
import { ChevronDownIcon, CopyIcon } from '../../../components/icons';
import { UnitChip } from '../../../components/UnitChip';
import { typingUnit } from '../../../features/converter/state';
import { browserLocale, detectRegion } from '../../../lib/region';
import {
  CARD,
  cx,
  FIELD_ROW,
  NUMBER_SIZES,
  SHELL,
  SHELL_BORDERED,
  SHELL_PANEL,
} from '../../../lib/recipes';

/** How this visitor's numbers and units read, detected once. */
interface LabEnv {
  system: UnitPreference;
  locale: string | undefined;
  separators: Separators;
}

function detectEnv(): LabEnv {
  const locale = browserLocale();
  return {
    system: regionDefaults(detectRegion()).system,
    locale,
    separators: localeSeparators(locale),
  };
}

const BASIC_CATEGORIES = categories.filter((category) => category.tier === 'basic');

/** The full table's columns, the converter's own: value, spare width, symbol, name, copy. */
const TABLE_ROWS = 'grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,max-content)_auto] gap-y-0.5';

/** A list of units to pick, without values: the symbol, then the name, left-aligned. */
const PICK_ROWS = 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5';

/** Marks the category control, the stop above the field in the arrows' loop. */
const SELECTOR = 'data-category-trigger';

/** In place of a value the table cannot show yet: no number, or no unit to convert from. */
const NO_VALUE = '—';

/** At most this many matches, as in the converter's list. */
const MATCH_LIMIT = 20;

/**
 * Keys that start typing in the field when nothing on the page has focus: a letter, a digit, or
 * what a number can start with. Not Space, which scrolls the page.
 */
const STARTS_TYPING = /^[\p{L}\p{N}.,-]$/u;

function categoryOf(id: CategoryId): Category {
  return getCategory(id) ?? BASIC_CATEGORIES[0]!;
}

/** A category's units in the order the list and the table show them (ADR 0011). */
function unitsOf(category: CategoryId, env: LabEnv): Unit[] {
  return search('', { category, system: env.system, tier: 'basic' }).results.flatMap((result) =>
    result.kind === 'unit' ? [result.unit] : [],
  );
}

/**
 * Matches for the typed text from every category, by core's ranker: match class first, category
 * rows before units, then the visitor's system. The current category wins what is left of a tie
 * and hides nothing.
 */
function rankMatches(text: string, current: CategoryId | null, env: LabEnv): SearchResult[] {
  const { results } = suggest(text, {
    separators: env.separators,
    system: env.system,
    tier: 'basic',
    category: null,
    limit: 200,
  }).search;
  const kind = (result: SearchResult) => (result.kind === 'category' ? 0 : 1);
  const elsewhere = (result: SearchResult) =>
    (result.kind === 'unit' ? result.unit.category : result.category.id) === current ? 0 : 1;
  return [...results]
    .sort((a, b) => a.matchClass - b.matchClass || kind(a) - kind(b) || elsewhere(a) - elsewhere(b))
    .slice(0, MATCH_LIMIT);
}

function safeConvert(value: number, from: Unit, to: Unit): number | undefined {
  try {
    return convert(value, from, to);
  } catch {
    return undefined;
  }
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

// ---------------------------------------------------------------------------
// Rows

/** A row of the full table: a unit, and the value in it when there is one. */
interface TableRow {
  unit: Unit;
  value: number | undefined;
  text: string;
  /** A value; a dash for none yet; or a value too large for a double, in the danger color. */
  tone: 'value' | 'empty' | 'danger';
  inBox: boolean;
}

function tableRowsFor(value: number, from: Unit, env: LabEnv): TableRow[] {
  return unitsOf(from.category, env).map((unit) => {
    const converted = safeConvert(value, from, unit);
    const text =
      converted === undefined ? '' : formatNumber(converted, { precision: 6, locale: env.locale });
    return {
      unit,
      value: text ? converted : undefined,
      text: text || 'Too large',
      tone: text ? 'value' : 'danger',
      inBox: unit.id === from.id,
    };
  });
}

/** The table with nothing to convert yet: every unit, a dash for its value, the box's unit marked. */
function emptyRowsFor(category: CategoryId, unitId: string | null, env: LabEnv): TableRow[] {
  return unitsOf(category, env).map((unit) => ({
    unit,
    value: undefined,
    text: NO_VALUE,
    tone: 'empty',
    inBox: unit.id === unitId,
  }));
}

/** A match to pick while a unit is typed: a unit, or a category to open; no value. */
interface PickRow {
  key: string;
  /** Null for a category row. */
  unit: Unit | null;
  category: Category;
  /** The unit in the box. */
  marked: boolean;
}

/**
 * Matches grouped by category, in the order of each category's best match, so the best match
 * still comes first; a category row leads its group.
 */
function groupByCategory(rows: readonly PickRow[]): PickRow[] {
  const order: CategoryId[] = [];
  for (const row of rows) if (!order.includes(row.category.id)) order.push(row.category.id);
  return order.flatMap((id) =>
    rows
      .filter((row) => row.category.id === id)
      .sort((a, b) => (a.unit ? 1 : 0) - (b.unit ? 1 : 0)),
  );
}

/**
 * A row's fill: the unit in the box in the accent's soft tint, as in the converter; the row the
 * arrows are on, or the pointer is over, in the muted tint of a hovered row.
 */
function rowFill(inBox: boolean, current: boolean): string {
  if (inBox) return 'bg-accent-soft';
  return current ? 'bg-surface-raised' : 'hover:bg-surface-raised';
}

// ---------------------------------------------------------------------------
// The field and the start

/** The converter's field, drawn from the same recipes; the text is not fitted to size here. */
function Field({
  inputRef,
  text,
  unit,
  listId,
  expanded,
  activeId,
  onText,
  onKeyDown,
  onRemoveUnit,
}: {
  inputRef: RefObject<HTMLInputElement>;
  text: string;
  unit: Unit | null;
  listId: string;
  /** Rows are listed under the field for the arrows to reach. */
  expanded: boolean;
  /** The row the arrows are on, if any: the field keeps focus and points at it. */
  activeId: string | undefined;
  onText: (text: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveUnit: () => void;
}) {
  return (
    <div className="group relative h-16 min-w-0">
      <div className={cx('absolute inset-x-0 top-0 rounded-lg shadow-sm', SHELL, SHELL_BORDERED)}>
        <div className={FIELD_ROW}>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Value"
            aria-controls={listId}
            aria-expanded={expanded}
            aria-activedescendant={activeId}
            autoComplete="off"
            spellcheck={false}
            value={text}
            // What the field takes, never a value it might be mistaken for.
            placeholder={unit ? 'Number' : 'Number or unit'}
            onChange={(event) => onText(event.currentTarget.value)}
            onKeyDown={onKeyDown}
            className={cx(
              NUMBER_SIZES[0],
              'h-full min-w-0 flex-1 bg-transparent font-numeric text-ink caret-ink outline-none placeholder:text-ink-muted',
            )}
          />
          {/* The readout of the source: clicking it opens nothing, only puts the caret in the
              field; its × clears the unit. */}
          {unit && (
            <UnitChip
              unit={unit}
              compact={false}
              onOpen={() => inputRef.current?.focus()}
              onRemove={onRemoveUnit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Where the table will be, before there is a category: the categories, to start from. A grid the
 * arrows move through, ↑ ↓ by row and ← → across, while the caret stays in the field; Enter or a
 * click opens one.
 */
function CategoryTiles({
  id,
  cursor,
  onPick,
}: {
  id: string;
  cursor: number;
  onPick: (index: number) => void;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Categories"
      className={cx(CARD, 'mt-4 grid grid-cols-2 gap-1 p-2 sm:grid-cols-4')}
    >
      {BASIC_CATEGORIES.map((category, index) => (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take
        <li
          key={category.id}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === cursor}
          data-tile
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(index)}
          className={cx(
            'flex min-h-11 cursor-pointer items-center rounded-nested px-3 text-ink',
            rowFill(false, index === cursor),
          )}
        >
          {category.name}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Category controls

/**
 * The category menu: a fluid shell like the theme menu (lib/recipes.ts), its trigger and its
 * choices one shape that grows over the page when open. The choices are native radios, so the
 * arrows move through them and choose as they go, as the theme menu previews themes; Enter or
 * Escape closes it, back on the trigger, and so do a click outside and focus leaving it. Closed,
 * the trigger is a stop in the converter's arrow loop. While a unit is typed, each choice says
 * how many matches it has.
 */
function CategoryMenu({
  value,
  counts,
  onPick,
  onDone,
}: {
  value: CategoryId | null;
  counts: ReadonlyMap<CategoryId, number>;
  onPick: (id: CategoryId) => void;
  /** A choice was made, by a pointer or Enter: the converter takes the keyboard on to its units. */
  onDone: () => void;
}) {
  const menuId = useId();
  const groupName = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Opening moves focus onto the chosen category, or the first, as the theme menu does.
  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    (
      root?.querySelector<HTMLInputElement>('input:checked') ??
      root?.querySelector<HTMLInputElement>('input')
    )?.focus();
  }, [open]);

  // A click outside closes it; so do Enter and Escape inside, back on the trigger. Native
  // listeners, like the converter's undo keys: the wrapper is not itself interactive.
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) setOpen(false);
    };
    // Pressing a choice keeps focus where it is, or the menu would close on its own blur first.
    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as Element).closest('label')) event.preventDefault();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Enter') return;
      if (event.key === 'Enter' && event.target === triggerRef.current) return;
      event.preventDefault();
      setOpen(false);
      if (event.key === 'Enter') onDone();
      else triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('mousedown', onMouseDown);
      root.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onDone]);

  const chevron = (
    <ChevronDownIcon
      width="16"
      height="16"
      className="text-ink-muted transition-transform group-data-open:rotate-180"
    />
  );

  return (
    <div
      ref={rootRef}
      className="group relative mb-2 h-12 w-56"
      data-open={open || undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className={cx('absolute inset-x-0 top-0 rounded-md', SHELL, SHELL_BORDERED)}>
        <button
          ref={triggerRef}
          type="button"
          data-category-trigger=""
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((now) => !now)}
          className="flex h-11 w-full items-center justify-between gap-2 px-3 text-sm text-ink transition-colors outline-none hover:bg-surface-raised"
        >
          {value ? (
            <>
              <span className="text-ink-muted">Category</span>
              <span className="flex items-center gap-1">
                {categoryOf(value).name}
                {chevron}
              </span>
            </>
          ) : (
            <>
              <span>Choose a category</span>
              {chevron}
            </>
          )}
        </button>
        <fieldset id={menuId} className={cx(SHELL_PANEL, 'p-1')}>
          <legend className="sr-only">Category</legend>
          {BASIC_CATEGORIES.map((category) => {
            const count = counts.get(category.id);
            return (
              // A pointer's pick applies and closes the menu at once. Not on click: the arrows
              // check radios with a click of their own, which would close it mid-preview.
              <label
                key={category.id}
                onPointerUp={() => {
                  onPick(category.id);
                  setOpen(false);
                  onDone();
                }}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-nested-md px-2 text-sm text-ink focus-ring-within-inset hover:bg-surface-raised has-checked:bg-accent-soft"
              >
                <input
                  type="radio"
                  name={groupName}
                  value={category.id}
                  checked={category.id === value}
                  onChange={() => onPick(category.id)}
                  className="sr-only"
                />
                {category.name}
                {count !== undefined && count > 0 && (
                  <span className="font-numeric text-xs text-ink-muted">
                    {count} {count === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}

/**
 * Every category as a tab, wrapping so none hides off the edge. While a unit is typed, the tabs
 * of the categories with matches take the hover look and say how many.
 */
function CategoryTabs({
  value,
  counts,
  onPick,
}: {
  value: CategoryId | null;
  counts: ReadonlyMap<CategoryId, number>;
  onPick: (id: CategoryId) => void;
}) {
  return (
    <div role="group" aria-label="Category" className="mb-2 flex flex-wrap gap-1.5">
      {BASIC_CATEGORIES.map((category) => {
        const chosen = category.id === value;
        const count = counts.get(category.id);
        const matches = count !== undefined;
        return (
          <button
            key={category.id}
            type="button"
            data-category-trigger=""
            aria-pressed={chosen}
            onClick={() => onPick(category.id)}
            className={cx(
              'min-h-11 shrink-0 rounded-md border-2 px-3 text-sm font-medium',
              chosen
                ? 'border-accent bg-accent-soft text-ink'
                : matches
                  ? 'border-edge bg-surface-raised text-ink'
                  : 'border-edge text-ink-muted hover:text-ink',
            )}
          >
            {category.name}
            {matches && count > 0 && (
              <span className="ml-1.5 font-numeric text-xs text-ink-muted">{count}</span>
            )}
            {matches && <span className="sr-only">, has matches</span>}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The table's place

/**
 * The full table, as the converter shows it: the value left, then the symbol and the name; a dash
 * where there is no value yet, so the table stays in place when the number or the unit is cleared.
 */
function FullTable({
  id,
  rows,
  cursor,
  back,
  onPick,
  onCopy,
}: {
  id: string;
  rows: readonly TableRow[];
  cursor: number;
  back: (() => void) | null;
  onPick: (index: number) => void;
  onCopy: (index: number) => void;
}) {
  return (
    <div className={cx(CARD, 'mt-4 p-2')}>
      {back && (
        <button
          type="button"
          onClick={back}
          className="mb-1 flex min-h-11 w-full items-center rounded-nested border-b border-line px-2 text-sm text-ink-muted hover:bg-surface-raised hover:text-ink"
        >
          ← All categories
        </button>
      )}
      <ul id={id} role="listbox" aria-label="Units" className={TABLE_ROWS}>
        {rows.map((row, index) => (
          <li
            key={row.unit.id}
            role="presentation"
            className="col-span-5 grid grid-cols-subgrid items-center"
          >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take */}
            <div
              id={`${id}-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === cursor}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(index)}
              className={cx(
                'col-span-4 grid min-h-11 cursor-pointer grid-cols-subgrid items-center gap-x-2 rounded-nested px-2',
                rowFill(row.inBox, index === cursor),
              )}
            >
              <span
                className={cx(
                  'text-right font-numeric whitespace-nowrap',
                  row.tone === 'danger'
                    ? 'text-sm font-medium text-danger'
                    : row.tone === 'empty'
                      ? 'text-ink-muted'
                      : 'text-ink',
                )}
              >
                {row.text}
                {row.tone === 'empty' && <span className="sr-only">no value</span>}
              </span>
              <span className="col-start-3 text-right font-numeric font-semibold whitespace-nowrap text-ink-muted">
                {row.unit.symbol}
              </span>
              <span className="min-w-0 break-words hyphens-auto text-ink">
                {row.value === 1 ? row.unit.name : row.unit.plural}
                {row.inBox && <span className="sr-only">, in the box</span>}
              </span>
            </div>
            {row.value === undefined ? (
              <span className="size-11" />
            ) : (
              <Button
                variant="ghost"
                square
                nested
                tabIndex={-1}
                aria-label={`Copy ${row.unit.plural}`}
                onClick={() => onCopy(index)}
              >
                <CopyIcon />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The matches for a typed unit, without values, left-aligned so they read easily, under a header
 * per category.
 */
function PickList({
  id,
  rows,
  cursor,
  counts,
  onPick,
}: {
  id: string;
  rows: readonly PickRow[];
  cursor: number;
  counts: ReadonlyMap<CategoryId, number>;
  onPick: (index: number) => void;
}) {
  return (
    <div className={cx(CARD, 'mt-4 p-2')}>
      {rows.length === 0 ? (
        <p className="px-2 py-2.5 text-sm text-ink-muted">No unit matches. Try ml, feet, or °F.</p>
      ) : (
        <ul id={id} role="listbox" aria-label="Units" className={PICK_ROWS}>
          {rows.map((row, index) => [
            rows[index - 1]?.category.id !== row.category.id && (
              // A section's label: not an option, so the arrows pass over it.
              <li
                key={`section-${row.category.id}`}
                role="presentation"
                className={cx(
                  'col-span-2 flex items-baseline gap-1.5 px-2 pb-1 text-xs font-medium text-ink-muted',
                  index === 0 ? 'pt-1' : 'mt-1.5 border-t border-line pt-2',
                )}
              >
                <span className="text-ink">{row.category.name}</span>
                {(counts.get(row.category.id) ?? 0) > 0 && (
                  <span className="font-numeric">{counts.get(row.category.id)}</span>
                )}
              </li>
            ),
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take
            <li
              key={row.key}
              id={`${id}-${index}`}
              role="option"
              aria-selected={index === cursor}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(index)}
              className={cx(
                'col-span-2 grid min-h-11 cursor-pointer grid-cols-subgrid items-center rounded-nested px-2',
                rowFill(row.marked, index === cursor),
              )}
            >
              {row.unit ? (
                <>
                  <span className="font-numeric font-semibold whitespace-nowrap text-ink-muted">
                    {row.unit.symbol}
                  </span>
                  <span className="min-w-0 text-ink">
                    {row.unit.plural}
                    <span className="sr-only">, {row.category.name}</span>
                    {row.marked && <span className="sr-only">, in the box</span>}
                  </span>
                </>
              ) : (
                <span className="col-span-2 text-ink">
                  <span className="font-semibold">{row.category.name}</span>
                  <span className="ml-1.5 text-xs text-ink-muted">all its units</span>
                </span>
              )}
            </li>,
          ])}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The converter, with the table as the unit list

type Control = 'menu' | 'tabs' | 'table';

function TableIsTheList({ env, control }: { env: LabEnv; control: Control }) {
  const listId = useId();
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [text, setText] = useState('');
  /**
   * Where the arrows are. Null rests on the selection, the unit in the box, so the arrows move
   * from it, or on the field when there is none; -1 is the field, chosen with the arrows; 0 and
   * up, a row (or a category, before there is one) the arrows moved to.
   */
  const [position, setPosition] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Set when typing elsewhere lands in the field: the caret goes after the text it added. */
  const caretToEnd = useRef(false);
  const unit = unitId ? (getUnit(unitId) ?? null) : null;
  const parsed = parse(text, env.separators);
  /** The typed number, kept through every change of unit or category. */
  const number = parsed.valueText ?? '';

  // The table's place: the matches while a unit is typed; once a category is chosen, its table,
  // with values when there is a number and a unit and a dash for each otherwise; before any
  // category, the categories to start from.
  const matches = typingUnit(parsed) ? rankMatches(text, category, env) : null;
  const hasValues = Boolean(category && unit && parsed.value !== undefined);
  const view = matches ? 'matches' : category ? 'table' : 'start';

  const tableRows =
    view === 'table' && category
      ? hasValues && unit && parsed.value !== undefined
        ? tableRowsFor(parsed.value, unit, env)
        : emptyRowsFor(category, unitId, env)
      : [];
  const matchRows: PickRow[] = (matches ?? []).map((result) =>
    result.kind === 'unit'
      ? {
          key: result.unit.id,
          unit: result.unit,
          category: categoryOf(result.unit.category),
          marked: result.unit.id === unitId,
        }
      : { key: `#${result.category.id}`, unit: null, category: result.category, marked: false },
  );
  const pickRows = groupByCategory(matchRows);
  // The tabs already list every category, so their layout's start has nothing to move through.
  const tileCount = view === 'start' && control !== 'tabs' ? BASIC_CATEGORIES.length : 0;
  const rowCount = matches ? pickRows.length : view === 'table' ? tableRows.length : tileCount;

  /** The source's row in its category, in the one order every view lists units in. */
  const rowOf = (categoryId: CategoryId, id: string) =>
    unitsOf(categoryId, env).findIndex((each) => each.id === id);
  /** Where the arrows rest: the unit in the box, when the table lists it; else the field. */
  const rest = view === 'table' && category && unitId ? rowOf(category, unitId) : -1;
  const at = position === null ? rest : Math.min(position, rowCount - 1);
  /** The arrows have moved into the table: Escape first brings them back to rest. */
  const browsing = position !== null && position >= 0;

  // How many units match in each category; a category whose name matches counts, with none.
  const counts = new Map<CategoryId, number>();
  for (const row of matchRows) {
    counts.set(row.category.id, (counts.get(row.category.id) ?? 0) + (row.unit ? 1 : 0));
  }

  /** How many categories the start's grid shows in a row, as laid out: 2 on a phone, 4 wider. */
  const tilesPerRow = () => {
    const tiles = rootRef.current?.querySelectorAll<HTMLElement>('[data-tile]') ?? [];
    const top = tiles[0]?.offsetTop;
    let count = 0;
    for (const tile of tiles) {
      if (tile.offsetTop !== top) break;
      count += 1;
    }
    return Math.max(count, 1);
  };

  /** Typing always adds to the end of what is there, Backspace takes the last character back; Escape is how to clear. */
  const typedInto = (value: string, key: string) =>
    key === 'Backspace' ? value.slice(0, -1) : value + key;

  /**
   * Focus onto the category control, the stop above the field in the arrows' loop: the menu's
   * trigger, or the chosen tab. False when this layout has none.
   */
  const focusSelector = (): boolean => {
    const root = rootRef.current;
    const target =
      root?.querySelector<HTMLElement>(`[${SELECTOR}][aria-pressed="true"]`) ??
      root?.querySelector<HTMLElement>(`[${SELECTOR}]`);
    if (!target) return false;
    target.focus();
    setPosition(null);
    return true;
  };

  // Keys pressed on something else in the converter (a row, the chip, a copy button, the
  // category control). Native listeners: the wrapper is not itself interactive.
  // - Escape brings the caret back to the field; on the category control it lets go of focus,
  //   leaving just the page.
  // - On the category control, the arrows go on round the loop: up to the table's last row, down
  //   to the field.
  // - Typing lands in the field after what is there, as typing in a combobox's list does
  //   (WAI-ARIA): 554, then 67, reads 55467. Space keeps its own job on a button or a radio.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const input = inputRef.current;
      if (!input || event.target === input || event.defaultPrevented || event.isComposing) return;
      const target = event.target as HTMLElement;
      const onSelector = target.closest(`[${SELECTOR}]`) !== null;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (onSelector) target.blur();
        else {
          input.focus();
          setPosition(null);
        }
        return;
      }
      if (onSelector && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        input.focus();
        setPosition(event.key === 'ArrowUp' ? rowCount - 1 : null);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1 && event.key !== 'Backspace') return;
      if (event.key === ' ' && target.closest('button, input')) return;
      event.preventDefault();
      caretToEnd.current = true;
      input.focus();
      setText(typedInto(input.value, event.key));
      setPosition(null);
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  });

  // With nothing on the page focused, a letter or a digit starts typing in the field: the page
  // has one job. Never with focus in another control, never with Ctrl, Cmd, or Alt held.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      if (!STARTS_TYPING.test(event.key)) return;
      const input = inputRef.current;
      if (!input) return;
      event.preventDefault();
      caretToEnd.current = true;
      input.focus();
      setText(typedInto(input.value, event.key));
      setPosition(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  useLayoutEffect(() => {
    if (!caretToEnd.current) return;
    caretToEnd.current = false;
    const input = inputRef.current;
    input?.setSelectionRange(input.value.length, input.value.length);
  });

  // The row the arrows reach stays in view, as the page scrolls.
  useEffect(() => {
    if (browsing) document.getElementById(`${listId}-${at}`)?.scrollIntoView({ block: 'nearest' });
  }, [browsing, at, listId]);

  /**
   * An explicit choice of category: keeps the number and lists the category's units, with none
   * chosen for you, so a typed number means that number in the unit you pick. The arrows wait on
   * the first unit, for Enter to take.
   */
  const chooseCategory = (id: CategoryId) => {
    setCategory(id);
    setUnitId(null);
    setText(number);
    setPosition(0);
  };

  /** A unit taken into the box: it becomes the source, the category follows, and the arrows rest on its row. */
  const takeUnit = (target: Unit, nextText: string) => {
    setCategory(target.category);
    setUnitId(target.id);
    setText(nextText);
    setPosition(null);
    caretToEnd.current = true;
  };

  /**
   * Enter or a click on a row: its unit moves into the box, with its value when the table has one,
   * at the box's 10 digits, as if it had been typed. A category, a match or a start, opens it.
   */
  const takeRow = (index: number) => {
    if (view === 'start') {
      const chosen = BASIC_CATEGORIES[index];
      if (chosen) chooseCategory(chosen.id);
      return;
    }
    if (matches) {
      const row = pickRows[index];
      if (!row) return;
      if (row.unit) takeUnit(row.unit, number);
      else chooseCategory(row.category.id);
      return;
    }
    const row = tableRows[index];
    if (!row) return;
    if (row.inBox) {
      setPosition(null);
      return;
    }
    const converted =
      unit && parsed.value !== undefined ? safeConvert(parsed.value, unit, row.unit) : undefined;
    takeUnit(
      row.unit,
      converted === undefined ? number : formatNumber(converted, { locale: env.locale }),
    );
  };

  /** A click takes the row and leaves the caret in the field, so typing and the arrows go on from there. */
  const pick = (index: number) => {
    takeRow(index);
    inputRef.current?.focus();
  };

  /** A category chosen with the menu or the tabs: the keyboard goes on to its units. */
  const pickCategory = (id: CategoryId) => {
    chooseCategory(id);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The start's categories are a grid: ← → move across it once the arrows are in it; in the
    // field they move the caret as ever.
    const grid = view === 'start' && browsing;
    const step = view === 'start' && at >= 0 ? tilesPerRow() : 1;
    if (grid && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const next = at + (event.key === 'ArrowRight' ? 1 : -1);
      setPosition(Math.min(Math.max(next, 0), rowCount - 1));
    } else if (event.key === 'ArrowDown') {
      // The loop: the category control, the field, every row, and round to the control again,
      // each step from where the arrows are: the selection when they rest on it.
      event.preventDefault();
      if (at < 0 && rowCount > 0) setPosition(0);
      else if (at >= 0 && at + step < rowCount) setPosition(at + step);
      else if (!focusSelector()) setPosition(-1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (at >= 0) setPosition(at - step >= 0 ? at - step : -1);
      else if (!focusSelector()) setPosition(rowCount - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (browsing) takeRow(at);
      // From the field: a typed unit takes its best match; with a unit, the arrows come back to
      // rest on it; without one, Enter goes into the table, to pick a category or a unit.
      else if (matches) takeRow(0);
      else if (unit) setPosition(null);
      else if (rowCount > 0) setPosition(0);
    } else if (event.key === 'Escape') {
      // Escape, one step at a time: back from browsing the table; the typed unit; the number; the
      // unit and the category, back to the start; then it lets go, leaving just the page. Right
      // after Enter the arrows rest on the selection, so the first Escape already clears.
      event.preventDefault();
      if (browsing) {
        setPosition(null);
        inputRef.current?.scrollIntoView({ block: 'nearest' });
      } else if (matches) setText(number);
      else if (text !== '') {
        setText('');
      } else if (unitId || category) {
        setUnitId(null);
        setCategory(null);
        setPosition(null);
      } else inputRef.current?.blur();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      const row = view === 'table' && at >= 0 ? tableRows[at] : undefined;
      if (row?.value === undefined) return;
      event.preventDefault();
      copyText(String(row.value));
    }
  };

  return (
    <div ref={rootRef}>
      {control === 'menu' && (
        <CategoryMenu
          value={category}
          counts={counts}
          onPick={chooseCategory}
          onDone={() => {
            inputRef.current?.focus();
            setPosition(0);
          }}
        />
      )}
      {control === 'tabs' && (
        <CategoryTabs value={category} counts={counts} onPick={pickCategory} />
      )}
      {control === 'table' && (
        <p className="mb-1.5 min-h-5 px-4.5 text-sm font-medium text-ink-muted">
          {category ? categoryOf(category).name : ''}
        </p>
      )}
      <Field
        inputRef={inputRef}
        text={text}
        unit={unit}
        listId={listId}
        expanded={rowCount > 0}
        activeId={at >= 0 ? `${listId}-${at}` : undefined}
        onText={(next) => {
          setText(next);
          setPosition(null);
        }}
        onKeyDown={onKeyDown}
        onRemoveUnit={() => {
          setUnitId(null);
          setPosition(null);
          inputRef.current?.focus();
        }}
      />
      {view === 'matches' ? (
        <PickList
          id={listId}
          rows={pickRows}
          cursor={browsing ? at : -1}
          counts={counts}
          onPick={pick}
        />
      ) : view === 'table' ? (
        <FullTable
          id={listId}
          rows={tableRows}
          cursor={browsing ? at : -1}
          back={control === 'table' && !unit ? () => setCategory(null) : null}
          onPick={pick}
          onCopy={(index) => {
            const value = tableRows[index]?.value;
            if (value !== undefined) copyText(String(value));
          }}
        />
      ) : control === 'tabs' ? (
        // The tabs already show every category, so the table's place only waits for one.
        <p className={cx(CARD, 'mt-4 px-4 py-6 text-center text-sm text-ink-muted')}>
          The table appears once you pick a category.
        </p>
      ) : (
        <CategoryTiles id={listId} cursor={browsing ? at : -1} onPick={pick} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const VARIANTS = [
  {
    id: 'menu',
    name: 'A · Category menu',
    about:
      'The pick. ↑ ↓ loop through the category menu, the field, and every row (← → across the categories). Enter on a row moves it into the box; Enter in the field takes what is typed, or goes into the table. Esc steps back: off the table, the typed unit, the number, the unit and category, then the page. Typing anywhere lands in the field.',
  },
  {
    id: 'tabs',
    name: 'B · Category tabs',
    about:
      'The same, with every category always in view as tabs; while you type a unit, the tabs of the categories with matches light up.',
  },
  {
    id: 'table',
    name: 'C · Table as the list',
    about:
      'The same, with no category control: start from the categories in the table’s place, or type.',
  },
] as const;

type VariantId = (typeof VARIANTS)[number]['id'];

/** The lab: a switch between the prototypes, a line on each, and the chosen one, fresh. */
export function SelectionLab() {
  const [env] = useState(detectEnv);
  const [variant, setVariant] = useState<VariantId>('menu');
  const [run, setRun] = useState(0);
  const about = VARIANTS.find((option) => option.id === variant)?.about ?? '';

  return (
    <div className="mt-6 max-w-xl">
      <div role="group" aria-label="Prototype" className="-ml-4 flex flex-wrap gap-1">
        {VARIANTS.map((option) => (
          <Button
            key={option.id}
            variant="ghost"
            on={option.id === variant}
            aria-pressed={option.id === variant}
            onClick={() => setVariant(option.id)}
          >
            {option.name}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-muted">{about}</p>
      <div className="mt-2 -ml-4 flex flex-wrap items-center gap-1">
        <Button variant="ghost" onClick={() => setRun((count) => count + 1)}>
          Start over
        </Button>
      </div>
      <div key={`${variant}-${run}`} className="mt-6">
        <TableIsTheList env={env} control={variant} />
      </div>
    </div>
  );
}
