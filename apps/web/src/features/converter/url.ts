import { getUnit, parse, type Separators } from '@bigsmall/core';
import type { ConverterState, Restorable } from './state';

/**
 * The conversion in the URL, so links and bookmarks reproduce it (docs/UX-SPEC.md §11):
 *   ?a=milliliter&v=5
 * a: the box's unit id · v: the typed number in canonical form. Links from the two-box converter
 * (ADR 0013) may also carry b, the second box's unit, and s, which box held v; they open on the
 * box that held the number.
 */

const PARAM = { unit: 'a', value: 'v', secondUnit: 'b', source: 's' } as const;

/**
 * The state as URL parameters. The typed text is read with the user's separators, so "1.000" in
 * German is written as v=1000, not v=1. The value is written canonically (a period decimal, no
 * grouping), so reading it back needs no locale.
 */
export function stateToParams(state: ConverterState, separators: Separators): URLSearchParams {
  const params = new URLSearchParams();
  if (state.unit) params.set(PARAM.unit, state.unit);
  const value = parse(state.text, separators).value;
  if (value !== undefined) params.set(PARAM.value, String(value));
  return params;
}

/**
 * The URL of this conversion, which Copy URL puts on the clipboard: the page's own address
 * with the state's parameters, built from the state itself rather than from the address bar, so
 * it is current even inside the URL's write delay.
 */
export function urlFor(
  state: ConverterState,
  separators: Separators,
  page: Pick<Location, 'origin' | 'pathname'>,
): string {
  const query = stateToParams(state, separators).toString();
  return `${page.origin}${page.pathname}${query ? `?${query}` : ''}`;
}

/** Reads a URL back into state. An unknown unit is dropped. */
export function paramsToState(params: URLSearchParams): Restorable | null {
  // A two-box link whose number was in the second box opens on that box's unit.
  const fromSecond = params.get(PARAM.source) === 'b';
  const unit = validUnit(params.get(fromSecond ? PARAM.secondUnit : PARAM.unit));
  const rawValue = params.get(PARAM.value);
  const value = rawValue === null ? undefined : parse(rawValue).value;
  if (!unit && value === undefined) return null;
  return { text: value === undefined ? '' : String(value), unit };
}

function validUnit(id: string | null): string | null {
  return id && getUnit(id) ? id : null;
}
