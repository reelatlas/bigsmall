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
  | { type: 'input'; box: BoxId; text: string }
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
