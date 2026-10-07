import { getUnit, parse, type Separators } from '@bigsmall/core';
import type { BoxId, ConverterState, Restorable } from './state';

/**
 * The conversion in the URL, so links and bookmarks reproduce it (docs/UX-SPEC.md §11):
 *   ?a=milliliter&b=us-cup&v=5&s=a
 * a, b: unit ids · v: the typed number in canonical form · s: which box holds v.
 */

const PARAM = { a: 'a', b: 'b', value: 'v', source: 's' } as const;

/**
 * The state as URL parameters. The typed text is read with the user's separators, so "1.000" in
 * German is written as v=1000, not v=1. The value is written canonically (a period decimal, no
 * grouping), so reading it back needs no locale.
 */
export function stateToParams(state: ConverterState, separators: Separators): URLSearchParams {
  const params = new URLSearchParams();
  if (state.a.unit) params.set(PARAM.a, state.a.unit);
  if (state.b.unit) params.set(PARAM.b, state.b.unit);
  const value = parse(state[state.source].text, separators).value;
  if (value !== undefined) {
    params.set(PARAM.value, String(value));
    params.set(PARAM.source, state.source);
  }
  return params;
}

/**
 * The address of this conversion, which copy link puts on the clipboard: the page's own address
 * with the state's parameters, built from the state itself rather than from the address bar, so
 * it is current even inside the URL's write delay.
 */
export function linkFor(
  state: ConverterState,
  separators: Separators,
  page: Pick<Location, 'origin' | 'pathname'>,
): string {
  const query = stateToParams(state, separators).toString();
  return `${page.origin}${page.pathname}${query ? `?${query}` : ''}`;
}

/** Reads a URL back into state. Unknown units are dropped; a second unit from another category is dropped too. */
export function paramsToState(params: URLSearchParams): Restorable | null {
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
