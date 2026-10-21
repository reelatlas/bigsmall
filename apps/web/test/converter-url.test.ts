import { describe, expect, it } from 'vitest';
import { initialState, reduce, type ConverterState } from '../src/features/converter/state';
import { urlFor, paramsToState, stateToParams } from '../src/features/converter/url';

const EN = { decimal: '.', group: ',' };
const DE = { decimal: ',', group: '.' };

/** The box holding `text`, with `unit` in it. */
function holding(text: string, unit: string | null = null): ConverterState {
  return reduce(initialState, { type: 'hydrate', state: { text, unit } });
}

describe('stateToParams', () => {
  it('writes the unit and the typed value', () => {
    expect(stateToParams(holding('5', 'milliliter'), EN).toString()).toBe('a=milliliter&v=5');
  });

  it('omits what is not set', () => {
    expect(stateToParams(initialState, EN).toString()).toBe('');
    expect(stateToParams(holding('', 'kelvin'), EN).toString()).toBe('a=kelvin');
    expect(stateToParams(holding('250'), EN).toString()).toBe('v=250');
  });

  it('writes the number canonically: a period decimal, no grouping', () => {
    expect(stateToParams(holding('1,000.5 km'), EN).toString()).toBe('v=1000.5');
  });

  it('reads the typed number with the user’s separators', () => {
    expect(stateToParams(holding('1.000'), DE).toString()).toBe('v=1000');
    // In English "1.000" is one, written as typed, its zeros kept.
    expect(stateToParams(holding('1.000'), EN).toString()).toBe('v=1.000');
    expect(stateToParams(holding('2,5'), DE).toString()).toBe('v=2.5');
  });
});

describe('paramsToState', () => {
  it('round-trips', () => {
    expect(paramsToState(stateToParams(holding('2', 'foot'), EN))).toEqual({
      text: '2',
      unit: 'foot',
      ingredient: null,
      brand: null,
    });
  });

  it('keeps every digit typed, which a double would round', () => {
    const params = stateToParams(holding('123456789012345678', 'meter'), EN);
    expect(params.toString()).toBe('a=meter&v=123456789012345678');
    expect(paramsToState(params)).toEqual({
      text: '123456789012345678',
      unit: 'meter',
      ingredient: null,
      brand: null,
    });
  });

  it('writes arithmetic as its value', () => {
    expect(stateToParams(holding('5 + 3', 'meter'), EN).toString()).toBe('a=meter&v=8');
  });

  it("reads the number back in the visitor's own decimal mark", () => {
    const params = stateToParams(holding('1.234,567', 'meter'), DE);
    expect(params.toString()).toBe('a=meter&v=1234.567');
    expect(paramsToState(params, DE)).toEqual({
      text: '1234,567',
      unit: 'meter',
      ingredient: null,
      brand: null,
    });
    expect(paramsToState(params, EN)).toEqual({
      text: '1234.567',
      unit: 'meter',
      ingredient: null,
      brand: null,
    });
  });

  it('opens a two-box link on the box that held the number', () => {
    expect(paramsToState(new URLSearchParams('a=mile&b=kilometer&v=1&s=a'))).toEqual({
      text: '1',
      unit: 'mile',
      ingredient: null,
      brand: null,
    });
    expect(paramsToState(new URLSearchParams('a=meter&b=foot&v=2&s=b'))).toEqual({
      text: '2',
      unit: 'foot',
      ingredient: null,
      brand: null,
    });
    // The second box held the number with no unit of its own.
    expect(paramsToState(new URLSearchParams('a=meter&v=2&s=b'))).toEqual({
      text: '2',
      unit: null,
      ingredient: null,
      brand: null,
    });
  });

  it('drops an unknown unit', () => {
    expect(paramsToState(new URLSearchParams('a=cubit&v=3'))).toEqual({
      text: '3',
      unit: null,
      ingredient: null,
      brand: null,
    });
  });

  it('returns null when nothing useful is present', () => {
    expect(paramsToState(new URLSearchParams(''))).toBeNull();
    expect(paramsToState(new URLSearchParams('x=1&a=nope'))).toBeNull();
  });

  it('keeps the ingredient, Cooking’s, and drops an unknown one (ADR 0021)', () => {
    const cooking = { ...holding('2', 'us-cup'), ingredient: 'all-purpose-flour' };
    const params = stateToParams(cooking, EN);
    expect(params.toString()).toBe('a=us-cup&v=2&i=all-purpose-flour');
    expect(paramsToState(params)).toEqual({
      text: '2',
      unit: 'us-cup',
      ingredient: 'all-purpose-flour',
      brand: null,
    });
    expect(paramsToState(new URLSearchParams('i=butter'))).toEqual({
      text: '',
      unit: null,
      ingredient: 'butter',
      brand: null,
    });
    expect(paramsToState(new URLSearchParams('a=us-cup&i=moon-dust'))?.ingredient).toBeNull();
  });

  it('carries a compound in its pair’s words, and reads it back in the visitor’s decimal mark (ADR 0026)', () => {
    const height = stateToParams(holding("5'11", 'foot-inch'), EN);
    expect(height.toString()).toBe('a=foot-inch&v=5+ft+11+in');
    expect(paramsToState(height)).toEqual({
      text: '5 ft 11 in',
      unit: 'foot-inch',
      ingredient: null,
      brand: null,
    });
    const half = stateToParams(holding('5 ft 11,5 in', 'foot-inch'), DE);
    expect(half.toString()).toBe('a=foot-inch&v=5+ft+11.5+in');
    expect(paramsToState(half, DE)?.text).toBe('5 ft 11,5 in');
    expect(paramsToState(half, EN)?.text).toBe('5 ft 11.5 in');
    // An angle's marks travel too.
    const angle = stateToParams(holding('45° 30′ 15″', 'degree-arcminute-arcsecond'), EN);
    expect(paramsToState(angle)?.text).toBe('45° 30′ 15″');
  });

  it('ignores a bad value but keeps the unit', () => {
    expect(paramsToState(new URLSearchParams('a=meter&v=abc'))).toEqual({
      text: '',
      unit: 'meter',
      ingredient: null,
      brand: null,
    });
  });
});

describe('urlFor', () => {
  const page = { origin: 'https://bigsmall.example', pathname: '/' };

  it('is the page address with the conversion, read from the state', () => {
    expect(urlFor(holding('5', 'milliliter'), EN, page)).toBe(
      'https://bigsmall.example/?a=milliliter&v=5',
    );
  });

  it('is the bare page address when nothing is entered', () => {
    expect(urlFor(initialState, EN, page)).toBe('https://bigsmall.example/');
  });
});

describe('the brand in the URL (ADR 0028)', () => {
  it('carries the brand beside its scale, and drops an unknown one', () => {
    const nike = { ...holding('10', 'us-men'), brand: 'nike' };
    expect(stateToParams(nike, EN).toString()).toBe('a=us-men&v=10&brand=nike');
    expect(paramsToState(stateToParams(nike, EN))).toEqual({
      text: '10',
      unit: 'us-men',
      ingredient: null,
      brand: 'nike',
    });
    expect(paramsToState(new URLSearchParams('a=us-men&v=10&brand=nope'))?.brand).toBeNull();
    // A brand alone opens Shoe size with its pill, the scale to come.
    expect(paramsToState(new URLSearchParams('brand=nike'))).toEqual({
      text: '',
      unit: null,
      ingredient: null,
      brand: 'nike',
    });
  });
});
