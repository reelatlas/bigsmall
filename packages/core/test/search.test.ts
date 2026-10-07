import { describe, expect, it } from 'vitest';
import { resolveExact, search, suggest } from '../src/index';
import type { SearchResponse } from '../src/index';

/** Unit ids and #category ids in result order. */
function ids(response: SearchResponse): string[] {
  return response.results.map((r) => (r.kind === 'unit' ? r.unit.id : `#${r.category.id}`));
}

describe('search: idle lists', () => {
  it('empty query lists the basic categories in display order', () => {
    expect(ids(search(''))).toEqual([
      '#length',
      '#mass',
      '#volume',
      '#temperature',
      '#area',
      '#speed',
      '#time',
      '#data',
    ]);
  });

  it('empty query with a locked category lists its units in display order', () => {
    expect(ids(search('', { category: 'temperature' }))).toEqual([
      'celsius',
      'fahrenheit',
      'kelvin',
    ]);
    expect(ids(search('   ', { category: 'temperature' }))).toEqual([
      'celsius',
      'fahrenheit',
      'kelvin',
    ]);
  });
});

describe('search: match classes', () => {
  it('exact case-sensitive symbol is class 1', () => {
    const r = search('mL');
    expect(r.results[0]).toMatchObject({ kind: 'unit', matchClass: 1, field: 'symbol' });
    expect(ids(r)[0]).toBe('milliliter');
  });

  it('case-insensitive symbol is class 2', () => {
    const r = search('ml');
    expect(r.results[0]).toMatchObject({ kind: 'unit', matchClass: 2 });
    expect(ids(r)[0]).toBe('milliliter');
  });

  it('names, plurals, and aliases match exactly', () => {
    expect(ids(search('metre'))[0]).toBe('meter');
    expect(ids(search('meters'))[0]).toBe('meter');
    expect(ids(search('kilos'))[0]).toBe('kilogram');
    expect(ids(search('centigrade'))[0]).toBe('celsius');
  });

  it('prefix matches rank after exact matches and keep registry order', () => {
    const r = ids(search('kil'));
    expect(r[0]).toBe('kilometer');
    expect(r).toContain('kilogram');
    expect(r).toContain('kilobyte');
    expect(r.indexOf('kilometer')).toBeLessThan(r.indexOf('kilogram'));
    expect(r.indexOf('kilogram')).toBeLessThan(r.indexOf('kilobyte'));
  });

  it('an alias that is also a prefix of other names still wins as an exact match', () => {
    const r = search('kilo');
    expect(ids(r)[0]).toBe('kilogram');
    expect(r.results[0]).toMatchObject({ matchClass: 2, field: 'alias' });
    expect(ids(r)).toContain('kilometer');
  });

  it('exact beats prefix even when the prefix candidate comes first in the registry', () => {
    expect(ids(search('k'))[0]).toBe('kelvin');
  });

  it('substring matches rank last among real matches', () => {
    const r = search('second');
    expect(ids(r)[0]).toBe('second');
    expect(ids(r)).toContain('meter-per-second');
    expect(
      r.results.find((x) => x.kind === 'unit' && x.unit.id === 'meter-per-second')?.matchClass,
    ).toBe(5);
  });

  it('fuzzy matches one typo only when nothing else matches', () => {
    const r = search('milimeter');
    expect(r.results[0]).toMatchObject({ matchClass: 6 });
    expect(ids(r)[0]).toBe('millimeter');
    expect(ids(search('kilometr'))).toContain('kilometer');
  });

  it('reports nothing for nonsense', () => {
    const r = search('xyzzy');
    expect(r.results).toEqual([]);
    expect(r.escalated).toBe(false);
  });
});

describe('search: tolerance', () => {
  it('ignores spacing, case, and abbreviation periods', () => {
    for (const q of ['fl oz', 'floz', 'FL OZ', 'fl. oz.', ' fl   oz ']) {
      expect(ids(search(q))[0], q).toBe('us-fluid-ounce');
    }
  });

  it('ignores degree signs and accepts misspellings listed as aliases', () => {
    for (const q of ['°F', 'deg f', 'Fahrenheit', 'farenheit', '℉']) {
      expect(ids(search(q))[0], q).toBe('fahrenheit');
    }
    for (const q of ['°C', 'celsius', 'celcius', 'centigrade', 'c']) {
      expect(ids(search(q))[0], q).toBe('celsius');
    }
  });

  it('treats superscripts and ASCII digits alike', () => {
    for (const q of ['m²', 'm2', 'sq m', 'sqm', 'square metre']) {
      expect(ids(search(q))[0], q).toBe('square-meter');
    }
  });
});

describe('search: categories and scope', () => {
  it('category words return the category first', () => {
    expect(ids(search('fluids'))[0]).toBe('#volume');
    expect(ids(search('temp'))[0]).toBe('#temperature');
    expect(ids(search('how heavy'))[0]).toBe('#mass');
    expect(ids(search('storage'))[0]).toBe('#data');
  });

  it('a category row needs the start of its name or a whole alias, never part of an alias', () => {
    expect(ids(search('vol'))[0]).toBe('#volume');
    expect(ids(search('Temperature'))[0]).toBe('#temperature');
    expect(ids(search('flui'))).not.toContain('#volume');
    expect(ids(search('how'))).not.toContain('#length');
    expect(ids(search('eight'))).not.toContain('#mass');
    expect(ids(search('ata'))).not.toContain('#data');
  });

  it('does not guess a category from a typo; the no-match list offers them all', () => {
    expect(ids(search('lenght'))).toEqual([]);
    expect(ids(search('fluidz'))).not.toContain('#volume');
  });

  it('a locked category scopes results to its units and hides categories', () => {
    expect(ids(search('m', { category: 'time' }))).toEqual(['millisecond', 'minute', 'month']);
    expect(ids(search('oz', { category: 'volume' }))).toEqual(['us-fluid-ounce']);
    expect(ids(search('fluids', { category: 'length' }))).toEqual([]);
  });

  it('respects the limit', () => {
    expect(search('m', { limit: 3 }).results).toHaveLength(3);
  });

  it('breaks ties by the preferred unit family', () => {
    const us = ids(search('second', { system: 'us' }));
    const metric = ids(search('second', { system: 'metric' }));
    expect(us.indexOf('foot-per-second')).toBeLessThan(us.indexOf('meter-per-second'));
    expect(metric.indexOf('meter-per-second')).toBeLessThan(metric.indexOf('foot-per-second'));
  });
});

describe('resolveExact', () => {
  it('resolves a query that names exactly one unit', () => {
    expect(resolveExact('ml')?.id).toBe('milliliter');
    expect(resolveExact('Kilograms')?.id).toBe('kilogram');
    expect(resolveExact('B')?.id).toBe('byte');
    expect(resolveExact('c')?.id).toBe('celsius');
    expect(resolveExact('°F')?.id).toBe('fahrenheit');
  });

  it('refuses ambiguous symbols unless the category is locked', () => {
    expect(resolveExact('oz')).toBeNull();
    expect(resolveExact('oz', { category: 'volume' })?.id).toBe('us-fluid-ounce');
    expect(resolveExact('oz', { category: 'mass' })?.id).toBe('ounce');
  });

  it('refuses partial and unknown queries', () => {
    expect(resolveExact('kil')).toBeNull();
    expect(resolveExact('xyz')).toBeNull();
    expect(resolveExact('')).toBeNull();
  });

  it('resolves colloquial aliases', () => {
    expect(resolveExact('kilo')?.id).toBe('kilogram');
    expect(resolveExact('cc')?.id).toBe('milliliter');
  });
});

describe('suggest', () => {
  it('combines parse, search, and exact resolution', () => {
    const s = suggest('5 ml');
    expect(s.parsed.value).toBe(5);
    expect(s.exact?.id).toBe('milliliter');
    expect(ids(s.search)[0]).toBe('milliliter');
  });

  it('lists categories when only a number was typed', () => {
    const s = suggest('5');
    expect(s.exact).toBeNull();
    expect(s.search.results[0]?.kind).toBe('category');
  });

  it('scopes to the other box and honors separators', () => {
    const s = suggest('1,5 oz', { category: 'volume', separators: { decimal: ',', group: '.' } });
    expect(s.parsed.value).toBe(1.5);
    expect(s.exact?.id).toBe('us-fluid-ounce');
  });
});
