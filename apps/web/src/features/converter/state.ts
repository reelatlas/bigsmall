import {
  convert,
  formatNumber,
  getUnit,
  parse,
  type CategoryId,
  type ParsedInput,
  type Separators,
  type Unit,
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

export interface ConverterState {
  a: BoxState;
  b: BoxState;
  /** The box the user edited last. Its value is the truth; the other box is derived from it. */
  source: BoxId;
  mode: Mode;
}

/** The part of the state a URL or a later persistence layer restores, through the `hydrate` action. */
export type Restorable = Partial<Pick<ConverterState, 'a' | 'b' | 'source' | 'mode'>>;

const EMPTY_BOX: BoxState = { text: '', unit: null };

export const initialState: ConverterState = {
  a: EMPTY_BOX,
  b: EMPTY_BOX,
  source: 'a',
  mode: 'basic',
};

function other(box: BoxId): BoxId {
  return box === 'a' ? 'b' : 'a';
}

export type Action =
  /** A keystroke or paste. `at` is a monotonic time in ms; only gaps between inputs matter. */
  | { type: 'input'; box: BoxId; text: string; at: number }
  /** Replace a box's text without making it the source (used to drop a query after a category pick). */
  | { type: 'setText'; box: BoxId; text: string }
  | { type: 'lock'; box: BoxId; unit: string }
  | { type: 'unlock'; box: BoxId }
  | { type: 'swap' }
  | { type: 'clear' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'hydrate'; state: Restorable };

export function reduce(state: ConverterState, action: Action): ConverterState {
  switch (action.type) {
    case 'input':
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
      // category, so it anchors the conversion and the category label until a number moves them.
      const sourceHasNumber = parse(state[state.source].text).valueText !== undefined;
      if (!sourceHasNumber && state[otherId].unit === null) next.source = action.box;
      const otherUnit = state[otherId].unit ? getUnit(state[otherId].unit) : undefined;
      if (otherUnit && otherUnit.category !== unit.category) {
        // No cross-category pairs: the other box loses its unit and keeps its number only if it
        // was the source. The category label moving to this box shows the switch.
        next[otherId] = {
          text: state.source === otherId ? (parse(state[otherId].text).valueText ?? '') : '',
          unit: null,
        };
      }
      return next;
    }

    case 'unlock':
      return { ...state, [action.box]: { ...state[action.box], unit: null } };

    case 'swap':
      // Units and texts trade places; the typed value stays the source so nothing is re-rounded.
      return { ...state, a: state.b, b: state.a, source: other(state.source) };

    case 'clear':
      return { ...initialState, mode: state.mode };

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

/** Why a conversion has no displayable answer: beyond what a double holds, or rounded to zero. */
export type OutOfRange = 'large' | 'small';

const OUT_OF_RANGE_MESSAGE: Record<OutOfRange, string> = {
  large: 'Too large to convert',
  small: 'Too small to convert',
};

export interface ConverterView {
  a: BoxView;
  b: BoxView;
  category: CategoryId | null;
  /**
   * The box the conversion is anchored on, which carries the category label: the source when it
   * has a unit, otherwise the box whose unit set the category. Null while no unit is chosen.
   */
  anchor: BoxId | null;
  result: ConverterResult | null;
  /**
   * Sentence for the live region: "5 milliliters is 0.02113376419 cups", or
   * "1e308 kilometers is too large to convert to millimeters".
   */
  announcement: string | null;
}

export interface ViewOptions {
  separators: Separators;
  locale?: string | undefined;
}

export function selectView(state: ConverterState, options: ViewOptions): ConverterView {
  const unitA = state.a.unit ? (getUnit(state.a.unit) ?? null) : null;
  const unitB = state.b.unit ? (getUnit(state.b.unit) ?? null) : null;
  const category = unitA?.category ?? unitB?.category ?? null;

  const sourceId = state.source;
  const targetId = other(sourceId);
  const sourceUnit = sourceId === 'a' ? unitA : unitB;
  const targetUnit = targetId === 'a' ? unitA : unitB;
  const sourceParsed = parse(state[sourceId].text, options.separators);

  let result: ConverterResult | null = null;
  let outOfRange: OutOfRange | null = null;
  if (sourceUnit && targetUnit) {
    if (sourceParsed.outOfRange) {
      outOfRange = sourceParsed.outOfRange;
    } else if (sourceParsed.value !== undefined) {
      // A result a double cannot hold comes back as Infinity or as a 0 that underflowed.
      const value = safeConvert(sourceParsed.value, sourceUnit, targetUnit);
      if (value !== undefined) {
        const text = formatNumber(value, options.locale ? { locale: options.locale } : {});
        if (!text) outOfRange = 'large';
        else if (value === 0 && sourceParsed.value !== 0) outOfRange = 'small';
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
      message: !isSource && !typingQuery && outOfRange ? OUT_OF_RANGE_MESSAGE[outOfRange] : null,
    };
  };

  let announcement: string | null = null;
  if (sourceUnit && targetUnit && (result || outOfRange)) {
    const amount = sourceParsed.value ?? Number.NaN;
    const from = `${sourceParsed.valueText ?? ''} ${unitName(sourceUnit, amount)}`.trim();
    announcement = result
      ? `${from} is ${result.text} ${unitName(targetUnit, result.value)}`
      : `${from} is too ${outOfRange} to convert to ${targetUnit.plural}`;
  }

  const anchor: BoxId | null = category ? (sourceUnit ? sourceId : targetId) : null;

  return {
    a: box('a', unitA, unitB),
    b: box('b', unitB, unitA),
    category,
    anchor,
    result,
    announcement,
  };
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
// Undo, redo, and Escape (docs/UX-SPEC.md §14, §17). The most recent interaction is what gets
// undone. Typing is grouped into chunks the way editors coalesce undo: keystrokes in one box
// less than TYPING_CHUNK_MS apart belong together, and a space starts a new chunk. A lock,
// unlock, swap, or clear is its own entry. Escape steps back through the same chunks, one box
// at a time, and each step is itself undoable.

/** What Escape can step back through in one box: a chunk of typing (with the text it started from) or the unit. */
export type BoxEntry = { kind: 'text'; before: string } | { kind: 'unit' };

export type EscapeTarget = 'text' | 'unit' | null;

type Entries = Record<BoxId, BoxEntry[]>;

interface Snapshot {
  state: ConverterState;
  entries: Entries;
}

export interface History {
  past: Snapshot[];
  present: ConverterState;
  future: Snapshot[];
  /** The typing chunk in progress: which box, and when its latest keystroke landed. */
  run: { box: BoxId; at: number } | null;
  /** Per box, oldest first, what Escape can step back through. */
  entries: Entries;
}

export type HistoryAction =
  | Action
  | { type: 'undo' }
  | { type: 'redo' }
  /** Escape with the list closed: take back the latest thing put into this box. */
  | { type: 'stepBack'; box: BoxId };

export const HISTORY_LIMIT = 50;

const NO_ENTRIES: Entries = { a: [], b: [] };

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
    a.mode === b.mode
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

/** Whether the box's stored text is what the user sees (the view shows a result instead for a derived number). */
function showsText(state: ConverterState, box: BoxId): boolean {
  return state.source === box || parse(state[box].text).query !== undefined;
}

/** Index of the latest entry Escape can act on in this box, or -1. */
function latestEntry(entries: BoxEntry[], state: ConverterState, box: BoxId): number {
  const current = state[box];
  const textCounts = showsText(state, box);
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i]!;
    const applies =
      entry.kind === 'unit'
        ? current.unit !== null
        : textCounts && isCheckpoint(entry.before, current.text);
    if (applies) return i;
  }
  return -1;
}

/**
 * What Escape would take back in this box once its list is closed: the latest chunk of typing
 * still present in the text, or the unit. Without a usable entry (a conversion loaded from the
 * URL, say) it falls back to the text, then the unit.
 */
export function escapeTarget(history: History, box: BoxId): EscapeTarget {
  const state = history.present;
  const index = latestEntry(history.entries[box], state, box);
  if (index >= 0) return history.entries[box][index]!.kind;
  if (showsText(state, box) && state[box].text !== '') return 'text';
  if (state[box].unit !== null) return 'unit';
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

function stepBack(history: History, box: BoxId): History {
  const target = escapeTarget(history, box);
  if (target === null) return history;
  const log = history.entries[box];
  const index = latestEntry(log, history.present, box);
  const kept = index >= 0 ? log.slice(0, index) : log;
  const entry = index >= 0 ? log[index] : undefined;
  const present =
    target === 'unit'
      ? reduce(history.present, { type: 'unlock', box })
      : reduce(history.present, {
          type: 'input',
          box,
          text: entry?.kind === 'text' ? entry.before : '',
          at: 0,
        });
  if (sameState(present, history.present))
    return { ...history, entries: { ...history.entries, [box]: kept } };
  return commit(history, present, null, { ...history.entries, [box]: kept });
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
    case 'input': {
      const { box, at } = action;
      // The chunk starts from what the user saw: a derived box shows a result, not its stale text.
      const before = showsText(history.present, box) ? history.present[box].text : '';
      const run = { box, at };
      const continues =
        history.run?.box === box &&
        at - history.run.at <= TYPING_CHUNK_MS &&
        !startsWord(before, action.text);
      if (continues) return { ...history, present, run };
      const entries = {
        ...history.entries,
        [box]: [...history.entries[box], { kind: 'text', before } satisfies BoxEntry],
      };
      return commit(history, present, run, entries);
    }
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
      return commit(history, present, null, { a: history.entries.b, b: history.entries.a });
    case 'clear':
      return commit(history, present, null, NO_ENTRIES);
  }
}
