import {
  convert,
  formatNumber,
  getCategory,
  getUnit,
  parse,
  type CategoryId,
  type ParsedInput,
  type Separators,
  type Unit,
} from '@bigsmall/core';

/**
 * Converter state and the pure reducer over it (docs/UX-SPEC.md §3, §6, §7).
 * No React, no DOM: everything here is unit-tested in node.
 */

export type BoxId = 'a' | 'b';
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
  /** One-line status such as "Switched to Temperature". Cleared on the next input. */
  notice: string | null;
}

export const EMPTY_BOX: BoxState = { text: '', unit: null };

export const initialState: ConverterState = {
  a: EMPTY_BOX,
  b: EMPTY_BOX,
  source: 'a',
  mode: 'basic',
  notice: null,
};

export function other(box: BoxId): BoxId {
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
  | { type: 'hydrate'; state: Partial<Pick<ConverterState, 'a' | 'b' | 'source' | 'mode'>> };

export function reduce(state: ConverterState, action: Action): ConverterState {
  switch (action.type) {
    case 'input':
      return {
        ...state,
        [action.box]: { ...state[action.box], text: action.text },
        // Only a number makes a box the source; typing a bare unit must not blank the other box.
        source: parse(action.text).value !== undefined ? action.box : state.source,
        notice: null,
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
        notice: null,
      };
      const otherId = other(action.box);
      const otherUnit = state[otherId].unit ? getUnit(state[otherId].unit) : undefined;
      if (otherUnit && otherUnit.category !== unit.category) {
        // No silent cross-category pairs: the other box loses its unit and keeps its number only if it was the source.
        next[otherId] = {
          text: state.source === otherId ? (parse(state[otherId].text).valueText ?? '') : '',
          unit: null,
        };
        next.notice = `Switched to ${getCategory(unit.category)?.name ?? unit.category}`;
      }
      return next;
    }

    case 'unlock':
      return { ...state, [action.box]: { ...state[action.box], unit: null }, notice: null };

    case 'swap':
      // Units and texts trade places; the typed value stays the source so nothing is re-rounded.
      return { ...state, a: state.b, b: state.a, source: other(state.source), notice: null };

    case 'clear':
      return { ...initialState, mode: state.mode };

    case 'setMode':
      return { ...state, mode: action.mode };

    case 'hydrate':
      return { ...state, ...action.state, notice: null };
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
}

export interface ConverterResult {
  box: BoxId;
  value: number;
  text: string;
}

export interface ConverterView {
  a: BoxView;
  b: BoxView;
  category: CategoryId | null;
  result: ConverterResult | null;
  error: string | null;
  /** Sentence for the live region, e.g. "5 milliliters is 0.02113376419 cups". */
  announcement: string | null;
  notice: string | null;
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
  let error: string | null = null;
  if (sourceUnit && targetUnit && sourceParsed.value !== undefined) {
    try {
      const value = convert(sourceParsed.value, sourceUnit, targetUnit);
      const text = formatNumber(value, options.locale ? { locale: options.locale } : {});
      if (text) result = { box: targetId, value, text };
      else error = 'That number is too large to convert.';
    } catch {
      error = 'That number cannot be converted.';
    }
  }

  const box = (id: BoxId, unit: Unit | null, otherUnit: Unit | null): BoxView => {
    const isSource = id === sourceId;
    const stored = state[id].text;
    // A derived box shows the result unless the user is typing a unit query into it.
    const text = isSource || parse(stored).query !== undefined ? stored : (result?.text ?? '');
    return {
      id,
      text,
      unit,
      isSource,
      parsed: isSource ? sourceParsed : parse(text, options.separators),
      scope: unit?.category ?? otherUnit?.category ?? null,
    };
  };

  let announcement: string | null = null;
  if (result && sourceUnit && targetUnit && sourceParsed.value !== undefined) {
    const from =
      `${sourceParsed.valueText ?? ''} ${unitName(sourceUnit, sourceParsed.value)}`.trim();
    announcement = `${from} is ${result.text} ${unitName(targetUnit, result.value)}`;
  }

  return {
    a: box('a', unitA, unitB),
    b: box('b', unitB, unitA),
    category,
    result,
    error,
    announcement,
    notice: state.notice,
  };
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

/** Longest pause between two keystrokes that still belong to one typing chunk, in ms. */
export const TYPING_CHUNK_MS = 700;

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
      present: { ...previous.state, notice: null },
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
      present: { ...next.state, notice: null },
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
