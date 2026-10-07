import { describe, expect, it } from 'vitest';
import { initialState, reduce } from '../src/features/converter/state';
import { paramsToState, stateToParams } from '../src/features/converter/url';

describe('stateToParams', () => {
  it('writes units, the typed value, and which side holds it', () => {
    const s = [
      { type: 'input', box: 'a', text: '5 ml', at: 0 } as const,
      { type: 'lock', box: 'a', unit: 'milliliter' } as const,
      { type: 'lock', box: 'b', unit: 'us-cup' } as const,
    ].reduce(reduce, initialState);
    expect(stateToParams(s).toString()).toBe('a=milliliter&b=us-cup&v=5&s=a');
  });

  it('omits what is not set', () => {
    expect(stateToParams(initialState).toString()).toBe('');
    const onlyB = reduce(initialState, { type: 'lock', box: 'b', unit: 'kelvin' });
    expect(stateToParams(onlyB).toString()).toBe('b=kelvin');
  });

  it('writes the value canonically, not as typed', () => {
    const s = reduce(initialState, { type: 'input', box: 'b', text: '1,000.5 km', at: 0 });
    expect(stateToParams(s).toString()).toBe('v=1000.5&s=b');
  });
});

describe('paramsToState', () => {
  it('round-trips', () => {
    const s = [
      { type: 'input', box: 'b', text: '2', at: 0 } as const,
      { type: 'lock', box: 'b', unit: 'foot' } as const,
      { type: 'lock', box: 'a', unit: 'meter' } as const,
    ].reduce(reduce, initialState);
    const back = paramsToState(stateToParams(s));
    expect(back).toEqual({
      a: { text: '', unit: 'meter' },
      b: { text: '2', unit: 'foot' },
      source: 'b',
    });
  });

  it('drops unknown units and a second unit from another category', () => {
    expect(paramsToState(new URLSearchParams('a=cubit&b=meter'))).toEqual({
      a: { text: '', unit: null },
      b: { text: '', unit: 'meter' },
      source: 'a',
    });
    expect(paramsToState(new URLSearchParams('a=meter&b=kelvin&v=3&s=a'))).toEqual({
      a: { text: '3', unit: 'meter' },
      b: { text: '', unit: null },
      source: 'a',
    });
  });

  it('returns null when nothing useful is present', () => {
    expect(paramsToState(new URLSearchParams(''))).toBeNull();
    expect(paramsToState(new URLSearchParams('x=1&a=nope'))).toBeNull();
  });

  it('ignores a bad value but keeps the units', () => {
    expect(paramsToState(new URLSearchParams('a=meter&v=abc'))).toEqual({
      a: { text: '', unit: 'meter' },
      b: { text: '', unit: null },
      source: 'a',
    });
  });
});
