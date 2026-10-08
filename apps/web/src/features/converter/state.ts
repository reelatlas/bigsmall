import {
  convert,
  formatNumber,
  getCategory,
  getUnit,
  parse,
  search,
  type Category,
  type CategoryId,
  type ParsedInput,
  type Separators,
  type Unit,
  type UnitPreference,
} from '@bigsmall/core';
import { TYPING_CHUNK_MS } from '../../lib/timing';

/**
 * The converter's state and the pure reducer over it (docs/UX-SPEC.md §1, §7, §9): one box, the
 * category its table lists, the mode, and the calculator's entry, with one undo history for all of
 * it. No React, no DOM: everything here is unit-tested in node.
 */

/** The list's tier. Only 'basic' is reachable today; the mode toggle arrives in milestone 3 (docs/UX-SPEC.md §14). */
export type Mode = 'basic' | 'advanced';

/** The calculator's own entry (docs/UX-SPEC.md §8). `fresh` is true right after =, when a digit starts over. */
export interface CalculatorState {
  text: string;
  fresh: boolean;
}

export interface ConverterState {
  /** What the user typed into the box: a number, a unit's name, or both. */
  text: string;
  /** The unit in the box, by id. */
  unit: string | null;
  /**
   * The category the table lists: the unit's, or one chosen before any unit (docs/UX-SPEC.md §1).
   * Using a unit and choosing a category set it; removing the unit keeps it, so its table stays
   * in place; clear empties it.
   */
  category: CategoryId | null;
  mode: Mode;
  /**
   * The calculator's scratch entry. It lives here, outside the conversion, so one history holds
   * everything: undo goes from a send back into the arithmetic that produced it.
   */
  calc: CalculatorState;
}

/** Where typing lands: the box, or the calculator's entry. */
export type TextTarget = 'box' | 'calc';

/** The part of the state a URL or a later persistence layer restores, through the `hydrate` action. */
export type Restorable = Partial<Pick<ConverterState, 'text' | 'unit' | 'mode'>>;

export const EMPTY_CALC: CalculatorState = { text: '', fresh: false };

export const initialState: ConverterState = {
  text: '',
  unit: null,
  category: null,
  mode: 'basic',
  calc: EMPTY_CALC,
};

export type Action =
  /** A keystroke or paste in the box. `at` is a monotonic time in ms; only gaps between inputs matter. */
  | { type: 'input'; text: string; at: number }
  /** A whole new text as one undoable step: arithmetic turned into its value, a number sent from the calculator, a step of Escape. */
  | { type: 'replace'; text: string }
  /** A calculator key that edits its entry the way typing does: chunked for undo and Escape. */
  | { type: 'calcType'; text: string; fresh: boolean; at: number }
  /** = or C in the calculator: a whole new entry as one undoable step. */
  | { type: 'calcSet'; text: string; fresh: boolean }
  /** A unit taken into the box, from a row or a match: the unit, and the box's new text (the row's value, or the number as typed). */
  | { type: 'use'; unit: string; text: string }
  /**
   * A category chosen (its menu, a start tile, or a category match): the box keeps its number and
   * drops any query, and keeps its unit only if it is of that category, so a typed number is never
   * converted from a unit nobody chose (docs/UX-SPEC.md §1).
   */
  | { type: 'chooseCategory'; category: CategoryId }
  /** The unit taken out of the box (the chip's ×, Backspace on an empty box): its category stays. */
  | { type: 'unlock' }
  | { type: 'clear' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'hydrate'; state: Restorable };

export function reduce(state: ConverterState, action: Action): ConverterState {
  switch (action.type) {
    case 'input':
    case 'replace':
      return { ...state, text: action.text };

    case 'use': {
      const unit = getUnit(action.unit);
      if (!unit) return state;
      return { ...state, text: action.text, unit: unit.id, category: unit.category };
    }

    case 'chooseCategory': {
      const unit = state.unit ? getUnit(state.unit) : undefined;
      return {
        ...state,
        text: parse(state.text).valueText ?? '',
        // Choosing the category the box is already in changes nothing about its unit.
        unit: unit?.category === action.category ? state.unit : null,
        category: action.category,
      };
    }

    case 'unlock':
      return { ...state, unit: null };

    case 'calcType':
    case 'calcSet':
      return { ...state, calc: { text: action.text, fresh: action.fresh } };

    case 'clear':
      // Clear all empties the conversion; the calculator's scratch entry is not part of it.
      return { ...initialState, mode: state.mode, calc: state.calc };

    case 'setMode':
      return { ...state, mode: action.mode };

    case 'hydrate': {
      // A URL holds a unit, not a category: the unit names it.
      const next = { ...state, ...action.state };
      const unit = next.unit ? getUnit(next.unit) : undefined;
      return { ...next, category: unit?.category ?? null };
    }
  }
}

/**
 * How this visitor writes numbers: the separators typed text is read with, and the locale results
 * are formatted in (the runtime's own when undefined). The views, the calculator, and the island
 * share it.
 */
export interface NumberEnv {
  separators: Separators;
  locale?: string | undefined;
}

/** The box as the field shows it: its text, its unit, and the text as parsed. */
export interface BoxView {
  text: string;
  unit: Unit | null;
  parsed: ParsedInput;
}

export function selectBox(state: ConverterState, options: NumberEnv): BoxView {
  return {
    text: state.text,
    unit: state.unit ? (getUnit(state.unit) ?? null) : null,
    parsed: parse(state.text, options.separators),
  };
}

/**
 * Why a conversion has no answer to show: beyond what a double holds, rounded to zero, or
 * arithmetic with no answer (a division by zero, a power with no real value).
 */
export type NoAnswer = 'large' | 'small' | 'divide-by-zero' | 'not-real';

/**
 * What the converter says when there is no answer to show (docs/UX-SPEC.md §1, §8): in full in
 * place of the table's rows, and in short in a row or in the calculator's display.
 */
export const NO_ANSWER_MESSAGES: Record<NoAnswer, { long: string; short: string }> = {
  large: { long: 'Too large to convert', short: 'Too large' },
  small: { long: 'Too small to convert', short: 'Too small' },
  'divide-by-zero': { long: 'Can’t divide by zero', short: 'Can’t divide by zero' },
  'not-real': { long: 'No real answer', short: 'No real answer' },
};

/** What the matches say when a typed unit matches nothing (docs/UX-SPEC.md §1). */
export function noMatchMessage(query: string): string {
  return `No unit matches “${query}”. Try ml, feet, or °F.`;
}

// ---------------------------------------------------------------------------
// The table (ADR 0012, docs/UX-SPEC.md §1): under the box, what it needs next: the categories to
// start from, its category's units with their values, or the units a typed query matches.

/** Significant digits a row shows: few enough to compare rows at a glance. Copying gives them all. */
export const TABLE_PRECISION = 6;

/** In place of a value the table cannot show yet: no number, or no unit to convert from. */
export const NO_VALUE = '—';

/** At most this many matches while a unit is typed. */
const MATCH_LIMIT = 20;

/** A row, with what the table component shows (components/ConversionTable.tsx) and what lies behind it. */
export interface TableRow {
  unit: Unit;
  /** The unit's id. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  symbol: string;
  /** The value in this unit at full precision, for copying and for moving into the box; null without one. */
  value: number | null;
  /** As the row shows it: TABLE_PRECISION significant digits, "Too large" or "Too small", or NO_VALUE. */
  text: string;
  /**
   * What the text is: a value; a dash, while there is no number or no unit to convert from; or a
   * message, when a double cannot hold the value and there is nothing to copy or move.
   */
  tone: 'value' | 'empty' | 'message';
  /** The unit in the box. */
  inBox: boolean;
}

/** A match while a unit is typed: a unit, or a category whose name matched, to open. */
export type MatchRow =
  | { kind: 'unit'; unit: Unit; category: Category; inBox: boolean }
  | { kind: 'category'; category: Category };

interface TableViewBase {
  /** The categories the converter offers, in the start's tiles and in the category menu. */
  categories: Category[];
  /** What the live region says once the view settles, if anything. */
  announcement: string | null;
}

/** Before any category: the categories to start from. */
export interface StartView extends TableViewBase {
  kind: 'start';
}

/** A category's units in the listed order: with values once the box has a number and a unit, a dash for each until then. */
export interface UnitsView extends TableViewBase {
  kind: 'units';
  category: CategoryId;
  rows: TableRow[];
  /** In place of the rows when the box's value has no answer: "Too large to convert". */
  message: string | null;
}

/** While a unit is typed: matches from every category, under their category, without values. */
export interface MatchesView extends TableViewBase {
  kind: 'matches';
  /** The typed unit, whose matched letters the rows set heavier. */
  query: string;
  /** Each category's matches together, its own row first, the groups in the order of their best match. */
  rows: MatchRow[];
  /** How many units match, per category with any match; one that matched by name alone counts 0. */
  counts: Partial<Record<CategoryId, number>>;
}

export type TableView = StartView | UnitsView | MatchesView;

export interface TableOptions extends NumberEnv {
  /** The visitor's unit family, listed first. */
  system: UnitPreference;
  tier: 'basic' | 'all';
}

/** What the table shows under the box: the matches while a unit is typed, else the category's units, else the start. */
export function selectTable(state: ConverterState, options: TableOptions): TableView {
  const parsed = parse(state.text, options.separators);
  const unit = state.unit ? (getUnit(state.unit) ?? null) : null;
  const category = unit?.category ?? state.category;
  const base = {
    categories: search('', { tier: options.tier }).results.flatMap((result) =>
      result.kind === 'category' ? [result.category] : [],
    ),
  };
  if (typingUnit(parsed)) return selectMatches(base, parsed.query ?? '', unit, category, options);
  if (!category) return { ...base, kind: 'start', announcement: null };
  return selectUnits(base, category, unit, parsed, options);
}

/** What every view of the table carries. */
type ViewBase = Pick<TableViewBase, 'categories'>;

function selectUnits(
  shared: ViewBase,
  category: CategoryId,
  unit: Unit | null,
  parsed: ParsedInput,
  options: TableOptions,
): UnitsView {
  const listed = search('', {
    category,
    system: options.system,
    tier: options.tier,
  }).results.flatMap((result) => (result.kind === 'unit' ? [result.unit] : []));
  // A unit from beyond the mode's tier, reached by search, still shows where it is in use.
  if (unit && !listed.some((u) => u.id === unit.id)) listed.push(unit);
  const kind = getCategory(category)?.name.toLowerCase() ?? '';
  const base = { ...shared, kind: 'units', category } as const;

  const problem = parsed.outOfRange ?? parsed.invalid;
  if (unit && problem) {
    const from = spokenAmount(parsed, unit, options.locale);
    return {
      ...base,
      rows: [],
      message: NO_ANSWER_MESSAGES[problem].long,
      announcement:
        problem === 'large' || problem === 'small'
          ? `${from} is too ${problem} to convert`
          : NO_ANSWER_MESSAGES[problem].long,
    };
  }

  if (!unit || parsed.value === undefined) {
    // Nothing to convert yet: every unit, a dash for its value, so the table stays in place.
    const rows = listed.map((target) => emptyRow(target, unit));
    return { ...base, rows, message: null, announcement: `${rows.length} units of ${kind}` };
  }

  const value = parsed.value;
  const rows = listed.map((target) => valueRow(target, unit, value, options.locale));
  const from = spokenAmount(parsed, unit, options.locale);
  return {
    ...base,
    rows,
    message: null,
    announcement: `${from} in ${rows.length} units of ${kind}`,
  };
}

function valueRow(target: Unit, from: Unit, value: number, locale: string | undefined): TableRow {
  const converted = target.id === from.id ? value : safeConvert(value, from, target);
  const text =
    converted === undefined ? '' : formatNumber(converted, { precision: TABLE_PRECISION, locale });
  const tooSmall = converted === 0 && value !== 0;
  const shown = text && !tooSmall ? (converted ?? null) : null;
  return {
    unit: target,
    id: target.id,
    name: unitName(target, shown ?? Number.NaN),
    symbol: target.symbol,
    value: shown,
    text: !text ? NO_ANSWER_MESSAGES.large.short : tooSmall ? NO_ANSWER_MESSAGES.small.short : text,
    tone: shown === null ? 'message' : 'value',
    inBox: target.id === from.id,
  };
}

function emptyRow(target: Unit, inBox: Unit | null): TableRow {
  return {
    unit: target,
    id: target.id,
    name: target.plural,
    symbol: target.symbol,
    value: null,
    text: NO_VALUE,
    tone: 'empty',
    inBox: target.id === inBox?.id,
  };
}

/**
 * Matches for a typed unit from every category, by core's ranker, the current category first
 * among equal matches without hiding the others; grouped under their category, a category whose
 * name matched leading its group ("len" offers all of Length).
 */
function selectMatches(
  base: ViewBase,
  query: string,
  unit: Unit | null,
  current: CategoryId | null,
  options: TableOptions,
): MatchesView {
  const { results } = search(query, {
    system: options.system,
    tier: options.tier,
    prefer: current,
    limit: MATCH_LIMIT,
  });
  const ranked = results.flatMap((result): MatchRow[] => {
    if (result.kind === 'category') return [{ kind: 'category', category: result.category }];
    const category = getCategory(result.unit.category);
    const inBox = result.unit.id === unit?.id;
    return category ? [{ kind: 'unit', unit: result.unit, category, inBox }] : [];
  });
  const order: CategoryId[] = [];
  for (const row of ranked) if (!order.includes(row.category.id)) order.push(row.category.id);
  const rows = order.flatMap((id) => [
    ...ranked.filter((row) => row.category.id === id && row.kind === 'category'),
    ...ranked.filter((row) => row.category.id === id && row.kind === 'unit'),
  ]);
  const counts: Partial<Record<CategoryId, number>> = {};
  for (const row of rows) {
    counts[row.category.id] = (counts[row.category.id] ?? 0) + (row.kind === 'unit' ? 1 : 0);
  }
  const announcement =
    rows.length === 0
      ? 'No unit matches'
      : `${rows.length} ${rows.length === 1 ? 'match' : 'matches'}`;
  return { ...base, kind: 'matches', query, rows, counts, announcement };
}

/**
 * Whether typing has reached a unit: the text holds a query with a letter or a symbol in it,
 * beyond the characters numbers and sums are written with. The parser reads a half-typed number
 * as a query ("-" before "-5", "1e" before "1e5"), so those, and a lone "e" after a number, which
 * may be an exponent on its way, wait for the next key.
 */
function typingUnit(parsed: ParsedInput): boolean {
  const { query } = parsed;
  if (!query) return false;
  if (parsed.valueText !== undefined && /^[eE][-+−]?$/.test(query)) return false;
  return /[^\s\d.,+\-−*/×÷^()]/u.test(query);
}

/**
 * convert() throws only for a cross-category pair or a non-finite input, which the table and the
 * parser already rule out. A throw during render would take the island down, so an impossible
 * pair simply shows no value.
 */
function safeConvert(value: number, from: Unit, to: Unit): number | undefined {
  try {
    return convert(value, from, to);
  } catch {
    return undefined;
  }
}

function unitName(unit: Unit, value: number): string {
  return value === 1 ? unit.name : unit.plural;
}

/**
 * A typed amount as the live region says it, "250 milliliters": arithmetic by its value ("8
 * milliliters"), not by what was typed ("5+3").
 */
function spokenAmount(parsed: ParsedInput, unit: Unit, locale: string | undefined): string {
  const typed =
    parsed.expression && parsed.value !== undefined
      ? formatNumber(parsed.value, { locale })
      : (parsed.valueText ?? '');
  return `${typed} ${unitName(unit, parsed.value ?? Number.NaN)}`.trim();
}

// ---------------------------------------------------------------------------
// Undo, redo, and the calculator's Escape (docs/UX-SPEC.md §9). The most recent interaction is
// what gets undone. Typing is grouped into chunks the way editors coalesce undo: keystrokes in the
// box, or in the calculator, less than TYPING_CHUNK_MS apart belong together, and a space starts a
// new chunk. A unit used or taken out, a chosen category, a clear, a send, and = or C are each a
// step of their own. In the calculator, Escape steps back through its chunks, each step undoable;
// the box's Escape has steps of its own (TableLayout.tsx).

interface Snapshot {
  state: ConverterState;
  chunks: string[];
}

export interface History {
  past: Snapshot[];
  present: ConverterState;
  future: Snapshot[];
  /** The typing chunk in progress: in the box or the calculator, and when its latest key landed. */
  run: { target: TextTarget; at: number } | null;
  /** The calculator's chunks of typing, oldest first, each the text it started from: what its Escape takes back. */
  chunks: string[];
}

export type HistoryAction =
  | Action
  | { type: 'undo' }
  | { type: 'redo' }
  /** Escape in the calculator: take back its latest chunk of typing. */
  | { type: 'stepBack' };

export const HISTORY_LIMIT = 50;

export const initialHistory: History = {
  past: [],
  present: initialState,
  future: [],
  run: null,
  chunks: [],
};

function sameState(a: ConverterState, b: ConverterState): boolean {
  return (
    a.text === b.text &&
    a.unit === b.unit &&
    a.category === b.category &&
    a.mode === b.mode &&
    a.calc.text === b.calc.text &&
    a.calc.fresh === b.calc.fresh
  );
}

/** True when the new text extends the old one with a space: the space opens a new chunk. */
function startsWord(before: string, after: string): boolean {
  return after.length > before.length && after.startsWith(before) && after[before.length] === ' ';
}

/** A chunk can be stepped back through only while its starting text is still a proper prefix of the text. */
function isCheckpoint(before: string, text: string): boolean {
  return before.length < text.length && text.startsWith(before);
}

function commit(
  history: History,
  present: ConverterState,
  run: History['run'],
  chunks: string[],
): History {
  const snapshot: Snapshot = { state: history.present, chunks: history.chunks };
  const past = [...history.past, snapshot].slice(-HISTORY_LIMIT);
  return { past, present, future: [], run, chunks };
}

/**
 * Escape in the calculator: the latest chunk of typing still in its entry goes; without one (right
 * after = or C), the entry clears. A step undo can reverse.
 */
function stepBack(history: History): History {
  const text = history.present.calc.text;
  if (text === '') return history;
  let index = history.chunks.length - 1;
  while (index >= 0 && !isCheckpoint(history.chunks[index]!, text)) index -= 1;
  const kept = index >= 0 ? history.chunks.slice(0, index) : history.chunks;
  const before = index >= 0 ? history.chunks[index]! : '';
  const present = reduce(history.present, { type: 'calcSet', text: before, fresh: false });
  return commit(history, present, null, kept);
}

/** Typing in the box or the calculator: it joins the chunk in progress or starts a new one. */
function typed(
  history: History,
  present: ConverterState,
  target: TextTarget,
  before: string,
  after: string,
  at: number,
): History {
  const run = { target, at };
  const continues =
    history.run?.target === target &&
    at - history.run.at <= TYPING_CHUNK_MS &&
    !startsWord(before, after);
  if (continues) return { ...history, present, run };
  // Only the calculator's chunks are kept, for its Escape.
  const chunks = target === 'calc' ? [...history.chunks, before] : history.chunks;
  return commit(history, present, run, chunks);
}

export function reduceWithHistory(history: History, action: HistoryAction): History {
  if (action.type === 'undo') {
    const previous = history.past[history.past.length - 1];
    if (!previous) return history;
    return {
      past: history.past.slice(0, -1),
      present: previous.state,
      future: [{ state: history.present, chunks: history.chunks }, ...history.future],
      run: null,
      chunks: previous.chunks,
    };
  }
  if (action.type === 'redo') {
    const next = history.future[0];
    if (!next) return history;
    return {
      past: [...history.past, { state: history.present, chunks: history.chunks }],
      present: next.state,
      future: history.future.slice(1),
      run: null,
      chunks: next.chunks,
    };
  }
  if (action.type === 'stepBack') return stepBack(history);

  const present = reduce(history.present, action);
  if (sameState(present, history.present)) return { ...history, present };

  switch (action.type) {
    case 'hydrate':
      return { past: [], present, future: [], run: null, chunks: [] };
    case 'setMode':
      return { ...history, present };
    case 'input':
      return typed(history, present, 'box', history.present.text, action.text, action.at);
    case 'calcType':
      return typed(history, present, 'calc', history.present.calc.text, action.text, action.at);
    case 'calcSet':
      // = and C start the entry over, so Escape then clears it rather than restoring the sum.
      return commit(history, present, null, []);
    case 'replace':
    case 'use':
    case 'chooseCategory':
    case 'unlock':
    case 'clear':
      return commit(history, present, null, history.chunks);
  }
}
