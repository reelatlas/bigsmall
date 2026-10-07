import {
  convert,
  formatNumber,
  getCategory,
  getUnit,
  parse,
  search,
  type CategoryId,
  type ParsedInput,
  type Separators,
  type Unit,
  type UnitPreference,
} from '@bigsmall/core';
import { TYPING_CHUNK_MS } from '../../lib/timing';

/**
 * Converter state and the pure reducer over it (docs/UX-SPEC.md §3, §6, §7).
 * No React, no DOM: everything here is unit-tested in node.
 */

export type BoxId = 'a' | 'b';
/** The list's tier. Only 'basic' is reachable today; the mode toggle arrives in milestone 3 (docs/UX-SPEC.md §14). */
export type Mode = 'basic' | 'advanced';

export interface BoxState {
  /** What the user typed. Stale while the box is derived; the view computes the display text then. */
  text: string;
  unit: string | null;
}

/** The calculator's own entry (docs/UX-SPEC.md §8). `fresh` is true right after =, when a digit starts over. */
export interface CalculatorState {
  text: string;
  fresh: boolean;
}

export interface ConverterState {
  a: BoxState;
  b: BoxState;
  /** The box the user edited last. Its value is the truth; the other box is derived from it. */
  source: BoxId;
  mode: Mode;
  /**
   * The calculator's scratch entry. It lives here, outside the conversion, so one history holds
   * everything: undo goes from a send back into the arithmetic that produced it.
   */
  calc: CalculatorState;
}

/** Where typing lands: one of the boxes, or the calculator's entry. */
export type TextTarget = BoxId | 'calc';

/** The part of the state a URL or a later persistence layer restores, through the `hydrate` action. */
export type Restorable = Partial<Pick<ConverterState, 'a' | 'b' | 'source' | 'mode'>>;

const EMPTY_BOX: BoxState = { text: '', unit: null };

export const EMPTY_CALC: CalculatorState = { text: '', fresh: false };

export const initialState: ConverterState = {
  a: EMPTY_BOX,
  b: EMPTY_BOX,
  source: 'a',
  mode: 'basic',
  calc: EMPTY_CALC,
};

function other(box: BoxId): BoxId {
  return box === 'a' ? 'b' : 'a';
}

export type Action =
  /** A keystroke or paste. `at` is a monotonic time in ms; only gaps between inputs matter. */
  | { type: 'input'; box: BoxId; text: string; at: number }
  /** A whole new text as one undoable step: arithmetic turned into its value (Enter), or a number sent from the calculator. */
  | { type: 'replace'; box: BoxId; text: string }
  /** A calculator key that edits its entry the way typing does: chunked for undo and Escape. */
  | { type: 'calcType'; text: string; fresh: boolean; at: number }
  /** = or C in the calculator: a whole new entry as one undoable step. */
  | { type: 'calcSet'; text: string; fresh: boolean }
  /** Replace a box's text without making it the source (used to drop a query after a category pick). */
  | { type: 'setText'; box: BoxId; text: string }
  | { type: 'lock'; box: BoxId; unit: string }
  /** A row of the table moves into the box: its unit, and its value as text; the box becomes the source. */
  | { type: 'use'; box: BoxId; unit: string; text: string }
  | { type: 'unlock'; box: BoxId }
  | { type: 'swap' }
  | { type: 'clear' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'hydrate'; state: Restorable };

export function reduce(state: ConverterState, action: Action): ConverterState {
  switch (action.type) {
    case 'input':
    case 'replace':
      return {
        ...state,
        [action.box]: { ...state[action.box], text: action.text },
        // Only a number makes a box the source; typing a bare unit must not blank the other box.
        // A number too large or too small to hold still counts, so the other box can say so.
        source: parse(action.text).valueText !== undefined ? action.box : state.source,
      };

    case 'setText':
      return { ...state, [action.box]: { ...state[action.box], text: action.text } };

    case 'lock': {
      const unit = getUnit(action.unit);
      if (!unit) return state;
      const box = state[action.box];
      const next: ConverterState = {
        ...state,
        [action.box]: { text: parse(box.text).valueText ?? '', unit: unit.id },
      };
      const otherId = other(action.box);
      // Before any number is typed, the first box to get a unit becomes the source: it set the
      // category, so it leads the conversion (the table layout shows it) until a number moves it.
      const sourceHasNumber = parse(state[state.source].text).valueText !== undefined;
      if (!sourceHasNumber && state[otherId].unit === null) next.source = action.box;
      const otherUnit = state[otherId].unit ? getUnit(state[otherId].unit) : undefined;
      if (otherUnit && otherUnit.category !== unit.category) {
        // No cross-category pairs: the other box loses its unit and keeps its number only if it
        // was the source. The category label then names the new category.
        next[otherId] = {
          text: state.source === otherId ? (parse(state[otherId].text).valueText ?? '') : '',
          unit: null,
        };
      }
      return next;
    }

    case 'use': {
      // The table never shows the other box, but keeps it for a switch back to two boxes. When
      // the row is the other box's unit, the box's old unit takes its place, as swap does, so the
      // boxes never share a unit; any other row leaves it alone (docs/UX-SPEC.md §1).
      const unit = getUnit(action.unit);
      if (!unit) return state;
      const otherId = other(action.box);
      const next: ConverterState = {
        ...state,
        [action.box]: { text: action.text, unit: unit.id },
        source: action.box,
      };
      if (state[otherId].unit === unit.id)
        next[otherId] = { text: '', unit: state[action.box].unit };
      return next;
    }

    case 'unlock':
      return { ...state, [action.box]: { ...state[action.box], unit: null } };

    case 'swap':
      // Units and texts trade places; the typed value stays the source so nothing is re-rounded.
      return { ...state, a: state.b, b: state.a, source: other(state.source) };

    case 'calcType':
    case 'calcSet':
      return { ...state, calc: { text: action.text, fresh: action.fresh } };

    case 'clear':
      // Clear all empties the conversion; the calculator's scratch entry is not part of it.
      return { ...initialState, mode: state.mode, calc: state.calc };

    case 'setMode':
      return { ...state, mode: action.mode };

    case 'hydrate':
      return { ...state, ...action.state };
  }
}

export interface BoxView {
  id: BoxId;
  /** Text to show in the field: the typed text for the source, the formatted result for the other box. */
  text: string;
  unit: Unit | null;
  isSource: boolean;
  parsed: ParsedInput;
  /** Category suggestions should stay within: this box's unit, else the other box's. */
  scope: CategoryId | null;
  /** Shown in place of a value when the conversion has no answer to show here: "Too large to convert". */
  message: string | null;
}

export interface ConverterResult {
  box: BoxId;
  value: number;
  text: string;
}

/**
 * Why a conversion has no answer to show: beyond what a double holds, rounded to zero, or
 * arithmetic with no answer (a division by zero, a power with no real value).
 */
export type NoAnswer = 'large' | 'small' | 'divide-by-zero' | 'not-real';

/**
 * What each place says when there is no answer to show (docs/UX-SPEC.md §7, §8): a box, in place
 * of a result, and the calculator's display, which is shorter since nothing is converted yet.
 */
export const NO_ANSWER_MESSAGES: Record<NoAnswer, { box: string; calculator: string }> = {
  large: { box: 'Too large to convert', calculator: 'Too large' },
  small: { box: 'Too small to convert', calculator: 'Too small' },
  'divide-by-zero': { box: 'Can’t divide by zero', calculator: 'Can’t divide by zero' },
  'not-real': { box: 'No real answer', calculator: 'No real answer' },
};

export interface ConverterView {
  a: BoxView;
  b: BoxView;
  /** The conversion's category, which the category label names: either box's, since they share it. */
  category: CategoryId | null;
  result: ConverterResult | null;
  /**
   * Sentence for the live region: "5 milliliters is 0.02113376419 cups", or
   * "1e308 kilometers is too large to convert to millimeters".
   */
  announcement: string | null;
}

/**
 * How this visitor writes numbers: the separators typed text is read with, and the locale results
 * are formatted in (the runtime's own when undefined). The view, the calculator, and the island
 * share it.
 */
export interface NumberEnv {
  separators: Separators;
  locale?: string | undefined;
}

export function selectView(state: ConverterState, options: NumberEnv): ConverterView {
  const unitA = state.a.unit ? (getUnit(state.a.unit) ?? null) : null;
  const unitB = state.b.unit ? (getUnit(state.b.unit) ?? null) : null;
  const category = unitA?.category ?? unitB?.category ?? null;

  const sourceId = state.source;
  const targetId = other(sourceId);
  const sourceUnit = sourceId === 'a' ? unitA : unitB;
  const targetUnit = targetId === 'a' ? unitA : unitB;
  const sourceParsed = parse(state[sourceId].text, options.separators);

  let result: ConverterResult | null = null;
  let noAnswer: NoAnswer | null = null;
  if (sourceUnit && targetUnit) {
    if (sourceParsed.outOfRange || sourceParsed.invalid) {
      noAnswer = sourceParsed.outOfRange ?? sourceParsed.invalid ?? null;
    } else if (sourceParsed.value !== undefined) {
      // A result a double cannot hold comes back as Infinity or as a 0 that underflowed.
      const value = safeConvert(sourceParsed.value, sourceUnit, targetUnit);
      if (value !== undefined) {
        const text = formatNumber(value, { locale: options.locale });
        if (!text) noAnswer = 'large';
        else if (value === 0 && sourceParsed.value !== 0) noAnswer = 'small';
        else result = { box: targetId, value, text };
      }
    }
  }

  const box = (id: BoxId, unit: Unit | null, otherUnit: Unit | null): BoxView => {
    const isSource = id === sourceId;
    const stored = state[id].text;
    const typingQuery = parse(stored, options.separators).query !== undefined;
    // A derived box shows the result unless the user is typing a unit query into it.
    const text = isSource || typingQuery ? stored : (result?.text ?? '');
    return {
      id,
      text,
      unit,
      isSource,
      parsed: isSource ? sourceParsed : parse(text, options.separators),
      scope: unit?.category ?? otherUnit?.category ?? null,
      message: !isSource && !typingQuery && noAnswer ? NO_ANSWER_MESSAGES[noAnswer].box : null,
    };
  };

  let announcement: string | null = null;
  if (sourceUnit && targetUnit && (result || noAnswer)) {
    const amount = sourceParsed.value ?? Number.NaN;
    // Arithmetic is announced by its value ("8 milliliters"), not by what was typed ("5+3").
    const typed =
      sourceParsed.expression && sourceParsed.value !== undefined
        ? formatNumber(sourceParsed.value, { locale: options.locale })
        : (sourceParsed.valueText ?? '');
    const from = `${typed} ${unitName(sourceUnit, amount)}`.trim();
    if (result) announcement = `${from} is ${result.text} ${unitName(targetUnit, result.value)}`;
    else if (noAnswer === 'large' || noAnswer === 'small') {
      announcement = `${from} is too ${noAnswer} to convert to ${targetUnit.plural}`;
    } else if (noAnswer) announcement = NO_ANSWER_MESSAGES[noAnswer].box;
  }

  return {
    a: box('a', unitA, unitB),
    b: box('b', unitB, unitA),
    category,
    result,
    announcement,
  };
}

// ---------------------------------------------------------------------------
// The table layout (ADR 0009, docs/UX-SPEC.md §1): the source box's value in every unit of its
// category. The other box's unit is kept for a switch back to two boxes, but not shown.

/** Significant digits a row shows: few enough to compare rows at a glance. Copying gives them all. */
export const TABLE_PRECISION = 6;

/** A row, with what the table component shows (components/ConversionTable.tsx) and what lies behind it. */
export interface TableRow {
  unit: Unit;
  /** The unit's id. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  symbol: string;
  /** The value in this unit at full precision, for copying and for moving into the box; null when a double cannot hold it. */
  value: number | null;
  /** As the row shows it: TABLE_PRECISION significant digits, or "Too large" or "Too small". */
  text: string;
  /** False while the text is a message: there is nothing to copy or move. */
  hasValue: boolean;
  /** The unit in the box. */
  inBox: boolean;
}

export interface TableView {
  /** The box the table converts from: the source, the one box the table layout shows. */
  box: BoxId;
  category: CategoryId;
  /** Every unit of the category in the list's order, the box's own among them. */
  rows: TableRow[];
  /** In place of the rows when the box's value has no answer: "Too large to convert". */
  message: string | null;
  /** What the live region says once the table settles. */
  announcement: string;
}

export interface TableOptions extends NumberEnv {
  /** The visitor's unit family, listed first as in the suggestion list. */
  system: UnitPreference;
  tier: 'basic' | 'all';
}

/** The table, once the source box holds a number and a unit; null until then. */
export function selectTable(state: ConverterState, options: TableOptions): TableView | null {
  const boxId = state.source;
  const unit = state[boxId].unit ? getUnit(state[boxId].unit) : undefined;
  if (!unit) return null;
  const parsed = parse(state[boxId].text, options.separators);
  const problem = parsed.outOfRange ?? parsed.invalid;
  if (parsed.value === undefined && !problem) return null;

  const typed =
    parsed.expression && parsed.value !== undefined
      ? formatNumber(parsed.value, { locale: options.locale })
      : (parsed.valueText ?? '');
  const from = `${typed} ${unitName(unit, parsed.value ?? Number.NaN)}`.trim();
  const base = { box: boxId, category: unit.category };

  if (problem || parsed.value === undefined) {
    const kind = problem ?? 'large';
    return {
      ...base,
      rows: [],
      message: NO_ANSWER_MESSAGES[kind].box,
      announcement:
        kind === 'large' || kind === 'small'
          ? `${from} is too ${kind} to convert`
          : NO_ANSWER_MESSAGES[kind].box,
    };
  }

  const value = parsed.value;
  const row = (target: Unit): TableRow => {
    const converted = target.id === unit.id ? value : safeConvert(value, unit, target);
    const text =
      converted === undefined
        ? ''
        : formatNumber(converted, {
            precision: TABLE_PRECISION,
            locale: options.locale,
          });
    const tooSmall = converted === 0 && value !== 0;
    const shown = text && !tooSmall ? (converted ?? null) : null;
    return {
      unit: target,
      id: target.id,
      name: unitName(target, shown ?? Number.NaN),
      symbol: target.symbol,
      value: shown,
      text: !text
        ? NO_ANSWER_MESSAGES.large.calculator
        : tooSmall
          ? NO_ANSWER_MESSAGES.small.calculator
          : text,
      hasValue: shown !== null,
      inBox: target.id === unit.id,
    };
  };

  const listed = search('', {
    category: unit.category,
    system: options.system,
    tier: options.tier,
  }).results.flatMap((result) => (result.kind === 'unit' ? [result.unit] : []));
  // A unit from beyond the mode's tier, reached by search, still shows where it is in use.
  if (!listed.some((u) => u.id === unit.id)) listed.push(unit);
  const rows = listed.map(row);

  const kind = getCategory(unit.category)?.name.toLowerCase() ?? '';
  const announcement = `${from} in ${rows.length} units of ${kind}`.trim();
  return { ...base, rows, message: null, announcement };
}

/**
 * Where the caret goes after Enter in `from` (docs/UX-SPEC.md §5): on to the other box when a
 * unit there is all the conversion still needs, this box having its unit and a number to
 * convert. Null keeps the caret in the box.
 */
export function nextBox(view: ConverterView, from: BoxId): BoxId | null {
  const to = other(from);
  const source = view.a.isSource ? view.a : view.b;
  const hasNumber = source.parsed.valueText !== undefined;
  return view[from].unit && !view[to].unit && hasNumber ? to : null;
}

/**
 * convert() throws only for a cross-category pair or a non-finite input, which lock, the URL
 * reader, and the parser already rule out. A throw during render would take the island down,
 * so an impossible pair simply shows no result.
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

// ---------------------------------------------------------------------------
// Undo, redo, and Escape (docs/UX-SPEC.md §9). The most recent interaction is what gets
// undone. Typing is grouped into chunks the way editors coalesce undo: keystrokes in one box,
// or in the calculator, less than TYPING_CHUNK_MS apart belong together, and a space starts a
// new chunk. A lock, unlock, swap, use, clear, send, =, or C is its own entry. Escape steps back
// through the same chunks, one box (or the calculator) at a time, and each step is undoable.

/** What Escape can step back through in one box: a chunk of typing (with the text it started from) or the unit. */
export type BoxEntry = { kind: 'text'; before: string } | { kind: 'unit' };

export type EscapeTarget = 'text' | 'unit' | null;

type Entries = Record<TextTarget, BoxEntry[]>;

interface Snapshot {
  state: ConverterState;
  entries: Entries;
}

export interface History {
  past: Snapshot[];
  present: ConverterState;
  future: Snapshot[];
  /** The typing chunk in progress: which box or the calculator, and when its latest key landed. */
  run: { box: TextTarget; at: number } | null;
  /** Per box and for the calculator, oldest first, what Escape can step back through. */
  entries: Entries;
}

export type HistoryAction =
  | Action
  | { type: 'undo' }
  | { type: 'redo' }
  /** Escape with the list closed, or in the calculator: take back the latest thing put in. */
  | { type: 'stepBack'; box: TextTarget };

export const HISTORY_LIMIT = 50;

const NO_ENTRIES: Entries = { a: [], b: [], calc: [] };

export const initialHistory: History = {
  past: [],
  present: initialState,
  future: [],
  run: null,
  entries: NO_ENTRIES,
};

function sameState(a: ConverterState, b: ConverterState): boolean {
  return (
    a.a.text === b.a.text &&
    a.a.unit === b.a.unit &&
    a.b.text === b.b.text &&
    a.b.unit === b.b.unit &&
    a.source === b.source &&
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

function textOf(state: ConverterState, target: TextTarget): string {
  return target === 'calc' ? state.calc.text : state[target].text;
}

/**
 * Whether the stored text is what the user sees: always for the calculator; for a box, unless
 * the view shows a result in its place (a derived number).
 */
function showsText(state: ConverterState, target: TextTarget): boolean {
  if (target === 'calc') return true;
  return state.source === target || parse(state[target].text).query !== undefined;
}

function unitOf(state: ConverterState, target: TextTarget): string | null {
  return target === 'calc' ? null : state[target].unit;
}

/** Index of the latest entry Escape can act on in this box or the calculator, or -1. */
function latestEntry(entries: BoxEntry[], state: ConverterState, target: TextTarget): number {
  const text = textOf(state, target);
  const textCounts = showsText(state, target);
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i]!;
    const applies =
      entry.kind === 'unit'
        ? unitOf(state, target) !== null
        : textCounts && isCheckpoint(entry.before, text);
    if (applies) return i;
  }
  return -1;
}

/**
 * What Escape would take back in this box once its list is closed: the latest chunk of typing
 * still present in the text, or the unit. Without a usable entry (a conversion loaded from the
 * URL, say) it falls back to the text, then the unit.
 */
export function escapeTarget(history: History, target: TextTarget): EscapeTarget {
  const state = history.present;
  const index = latestEntry(history.entries[target], state, target);
  if (index >= 0) return history.entries[target][index]!.kind;
  if (showsText(state, target) && textOf(state, target) !== '') return 'text';
  if (unitOf(state, target) !== null) return 'unit';
  return null;
}

function withoutUnit(entries: BoxEntry[]): BoxEntry[] {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i]!.kind === 'unit') return [...entries.slice(0, i), ...entries.slice(i + 1)];
  }
  return entries;
}

function commit(
  history: History,
  present: ConverterState,
  run: History['run'],
  entries: Entries,
  entryState: ConverterState = history.present,
): History {
  const snapshot: Snapshot = { state: entryState, entries: history.entries };
  const past = [...history.past, snapshot].slice(-HISTORY_LIMIT);
  return { past, present, future: [], run, entries };
}

function stepBack(history: History, box: TextTarget): History {
  const target = escapeTarget(history, box);
  if (target === null) return history;
  const log = history.entries[box];
  const index = latestEntry(log, history.present, box);
  const kept = index >= 0 ? log.slice(0, index) : log;
  const entry = index >= 0 ? log[index] : undefined;
  const text = entry?.kind === 'text' ? entry.before : '';
  let present: ConverterState;
  if (box === 'calc') present = reduce(history.present, { type: 'calcSet', text, fresh: false });
  else if (target === 'unit') present = reduce(history.present, { type: 'unlock', box });
  else present = reduce(history.present, { type: 'input', box, text, at: 0 });
  if (sameState(present, history.present))
    return { ...history, entries: { ...history.entries, [box]: kept } };
  return commit(history, present, null, { ...history.entries, [box]: kept });
}

/** Typing in a box or the calculator: it joins the chunk in progress or starts a new one. */
function typed(
  history: History,
  present: ConverterState,
  target: TextTarget,
  before: string,
  after: string,
  at: number,
): History {
  const run = { box: target, at };
  const continues =
    history.run?.box === target &&
    at - history.run.at <= TYPING_CHUNK_MS &&
    !startsWord(before, after);
  if (continues) return { ...history, present, run };
  const entries = {
    ...history.entries,
    [target]: [...history.entries[target], { kind: 'text', before } satisfies BoxEntry],
  };
  return commit(history, present, run, entries);
}

export function reduceWithHistory(history: History, action: HistoryAction): History {
  if (action.type === 'undo') {
    const previous = history.past[history.past.length - 1];
    if (!previous) return history;
    return {
      past: history.past.slice(0, -1),
      present: previous.state,
      future: [{ state: history.present, entries: history.entries }, ...history.future],
      run: null,
      entries: previous.entries,
    };
  }
  if (action.type === 'redo') {
    const next = history.future[0];
    if (!next) return history;
    return {
      past: [...history.past, { state: history.present, entries: history.entries }],
      present: next.state,
      future: history.future.slice(1),
      run: null,
      entries: next.entries,
    };
  }
  if (action.type === 'stepBack') return stepBack(history, action.box);

  const present = reduce(history.present, action);
  if (sameState(present, history.present)) return { ...history, present };

  switch (action.type) {
    case 'hydrate':
      return { past: [], present, future: [], run: null, entries: NO_ENTRIES };
    case 'setText':
    case 'setMode':
      return { ...history, present };
    case 'replace':
      return commit(history, present, null, history.entries);
    case 'input': {
      const { box } = action;
      // The chunk starts from what the user saw: a derived box shows a result, not its stale text.
      const before = showsText(history.present, box) ? history.present[box].text : '';
      return typed(history, present, box, before, action.text, action.at);
    }
    case 'calcType':
      return typed(history, present, 'calc', history.present.calc.text, action.text, action.at);
    case 'calcSet':
      // = and C start the entry over, so Escape then clears it rather than restoring the sum.
      return commit(history, present, null, { ...history.entries, calc: [] });
    case 'lock': {
      // Undoing a lock keeps the number and drops the unit, so the entry is "before, minus the query".
      const { box } = action;
      const before = history.present[box];
      const entryState: ConverterState = {
        ...history.present,
        [box]: { text: parse(before.text).valueText ?? '', unit: before.unit },
      };
      const entries = { ...history.entries };
      if (before.unit === null) entries[box] = [...entries[box], { kind: 'unit' }];
      const otherId = other(box);
      if (history.present[otherId].unit !== null && present[otherId].unit === null) {
        entries[otherId] = withoutUnit(entries[otherId]);
      }
      return commit(history, present, null, entries, entryState);
    }
    case 'unlock':
      return commit(history, present, null, {
        ...history.entries,
        [action.box]: withoutUnit(history.entries[action.box]),
      });
    case 'swap':
      return commit(history, present, null, {
        a: history.entries.b,
        b: history.entries.a,
        calc: history.entries.calc,
      });
    case 'use': {
      // The box holds a new number and unit at once, so its old chunks no longer apply; Escape
      // then clears the number, then the unit, as for a conversion loaded from a URL. The other
      // box, if it took the box's old unit, starts over the same way.
      const otherId = other(action.box);
      const entries = { ...history.entries, [action.box]: [] };
      if (present[otherId].unit !== history.present[otherId].unit) entries[otherId] = [];
      return commit(history, present, null, entries);
    }
    case 'clear':
      return commit(history, present, null, { ...NO_ENTRIES, calc: history.entries.calc });
  }
}
