import { DEFAULT_SEPARATORS, getIngredient, getUnit, parse, type Separators } from '@bigsmall/core';
import type { ConverterState, Restorable } from './state';

/**
 * The conversion in the URL, so links and bookmarks reproduce it (docs/UX-SPEC.md §11):
 *   ?a=milliliter&v=5
 * a: the box's unit id · v: the number as typed, in canonical form, so digits a double would round
 * come back whole (or arithmetic's value; a compound in its pair's words, "5 ft 11 in", ADR 0026) ·
 * i: Cooking's ingredient, by id (ADR 0021). Links from the two-box converter
 * (ADR 0013) may also carry b, the second box's unit, and s, which box held v; they open on the
 * box that held the number.
 */

const PARAM = { unit: 'a', value: 'v', ingredient: 'i', secondUnit: 'b', source: 's' } as const;

/**
 * The state as URL parameters. The typed text is read with the user's separators, so "1.000" in
 * German is written as v=1000, not v=1. The number is written as typed, canonically (a period
 * decimal, no grouping), so reading it back needs no locale and loses no digits; arithmetic is
 * written as its value.
 */
export function stateToParams(state: ConverterState, separators: Separators): URLSearchParams {
  const params = new URLSearchParams();
  if (state.unit) params.set(PARAM.unit, state.unit);
  const parsed = parse(state.text, separators);
  if (parsed.value !== undefined) params.set(PARAM.value, parsed.canonical ?? String(parsed.value));
  if (state.ingredient) params.set(PARAM.ingredient, state.ingredient);
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

/**
 * Reads a URL back into state, the number in the visitor's own decimal mark, so their box reads it
 * as meant ("1234.567" opens as "1234,567" in German). An unknown unit is dropped.
 */
export function paramsToState(
  params: URLSearchParams,
  separators: Separators = DEFAULT_SEPARATORS,
): Restorable | null {
  // A two-box link whose number was in the second box opens on that box's unit.
  const fromSecond = params.get(PARAM.source) === 'b';
  const unit = validUnit(params.get(fromSecond ? PARAM.secondUnit : PARAM.unit));
  const rawValue = params.get(PARAM.value);
  const parsed = rawValue === null ? undefined : parse(rawValue);
  const number =
    parsed?.value === undefined ? undefined : (parsed.canonical ?? String(parsed.value));
  const named = params.get(PARAM.ingredient);
  const ingredient = named && getIngredient(named) ? named : null;
  if (!unit && number === undefined && !ingredient) return null;
  return {
    // A compound's parts each may carry a decimal ("5 ft 11.5 in"), so every mark is the visitor's.
    text: number === undefined ? '' : number.replaceAll('.', separators.decimal),
    unit,
    ingredient,
  };
}

function validUnit(id: string | null): string | null {
  return id && getUnit(id) ? id : null;
}
