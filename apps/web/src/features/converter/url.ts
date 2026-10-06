import { getUnit, parse } from '@bigsmall/core';
import type { BoxId, ConverterState } from './state';

/**
 * The conversion in the URL, so links and bookmarks reproduce it (docs/UX-SPEC.md §10):
 *   /?a=milliliter&b=us-cup&v=5&s=a
 * a, b: unit ids · v: the typed number in canonical form · s: which box holds v.
 */

export const PARAM = { a: 'a', b: 'b', value: 'v', source: 's' } as const;

export function stateToParams(state: ConverterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.a.unit) params.set(PARAM.a, state.a.unit);
  if (state.b.unit) params.set(PARAM.b, state.b.unit);
  const value = parse(state[state.source].text).value;
  if (value !== undefined) {
    params.set(PARAM.value, String(value));
    params.set(PARAM.source, state.source);
  }
  return params;
}

export type HydratedState = Partial<Pick<ConverterState, 'a' | 'b' | 'source'>>;

/** Reads a URL back into state. Unknown units are dropped; a second unit from another category is dropped too. */
export function paramsToState(params: URLSearchParams): HydratedState | null {
  const unitA = validUnit(params.get(PARAM.a));
  let unitB = validUnit(params.get(PARAM.b));
  if (unitA && unitB && getUnit(unitA)?.category !== getUnit(unitB)?.category) unitB = null;

  const rawValue = params.get(PARAM.value);
  const value = rawValue === null ? undefined : parse(rawValue).value;
  const source: BoxId = params.get(PARAM.source) === 'b' ? 'b' : 'a';

  if (!unitA && !unitB && value === undefined) return null;

  const text = value === undefined ? '' : String(value);
  return {
    a: { text: source === 'a' ? text : '', unit: unitA },
    b: { text: source === 'b' ? text : '', unit: unitB },
    source,
  };
}

function validUnit(id: string | null): string | null {
  return id && getUnit(id) ? id : null;
}
