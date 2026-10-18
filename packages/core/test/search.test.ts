import { describe, expect, it } from 'vitest';
import { getUnit, resolveExact, search, suggest, unitListGroup } from '../src/index';
import type { SearchResponse } from '../src/index';

/** Unit ids and #category ids in result order. */
function ids(response: SearchResponse): string[] {
  return response.results.map((r) => (r.kind === 'unit' ? r.unit.id : `#${r.category.id}`));
}

describe('search: idle lists', () => {
  it('empty query lists the categories in display order', () => {
    expect(ids(search(''))).toEqual([
      '#length',
      '#mass',
      '#volume',
      '#cooking',
      '#temperature',
      '#area',
      '#speed',
      '#time',
      '#data',
      '#fuel-economy',
      '#energy',
      '#pressure',
      '#power',
      '#angle',
    ]);
  });

  it('lists a category’s units with the visitor’s own system first, each system smallest first', () => {
    expect(ids(search('', { category: 'length', system: 'us' }))).toEqual([
      'inch',
      'foot',
      'yard',
      'mile',
      'nanometer',
      'micrometer',
      'millimeter',
      'centimeter',
      'meter',
      'kilometer',
      'nautical-mile',
      'light-year',
    ]);
    expect(ids(search('', { category: 'length', system: 'metric' }))).toEqual([
      'nanometer',
      'micrometer',
      'millimeter',
      'centimeter',
      'meter',
      'kilometer',
      'inch',
      'foot',
      'yard',
      'mile',
      'nautical-mile',
      'light-year',
    ]);
    expect(ids(search('', { category: 'volume', system: 'us' }))).toEqual([
      'us-teaspoon',
      'us-tablespoon',
      'us-fluid-ounce',
      'us-cup',
      'us-pint',
      'us-quart',
      'us-gallon',
      'cubic-foot',
      'cubic-yard',
      'milliliter',
      'liter',
      'cubic-meter',
      // The UK's own measures are standard too, of neither main system for a US visitor.
      'imperial-fluid-ounce',
      'imperial-pint',
      'imperial-gallon',
    ]);
    // The hectare is metric, so it sits among the metric units by size.
    expect(ids(search('', { category: 'area', system: 'metric' }))).toEqual([
      'square-centimeter',
      'square-meter',
      'hectare',
      'square-kilometer',
      'square-inch',
      'square-foot',
      'square-yard',
      'acre',
      'square-mile',
    ]);
  });

  it('puts units of neither system last, and regional variants with their own visitors', () => {
    expect(ids(search('', { category: 'speed', system: 'metric' }))).toEqual([
      'kilometer-per-hour',
      'meter-per-second',
      'foot-per-second',
      'mile-per-hour',
      'knot',
      // Paces after the speeds, apart, the visitor's own first.
      'minute-per-kilometer',
      'minute-per-mile',
    ]);
    expect(ids(search('', { category: 'speed', system: 'us' })).slice(-2)).toEqual([
      'minute-per-mile',
      'minute-per-kilometer',
    ]);
    // The stone is British and the short ton American: each with its own visitors' units, and
    // after metric for the other's.
    expect(ids(search('', { category: 'mass', system: 'imperial' }))).toEqual([
      'ounce',
      'pound',
      'stone',
      'microgram',
      'milligram',
      'carat',
      'gram',
      'kilogram',
      'tonne',
      'troy-ounce',
      'short-ton',
    ]);
    expect(ids(search('', { category: 'mass', system: 'us' }))).toEqual([
      'ounce',
      'pound',
      'short-ton',
      'microgram',
      'milligram',
      'carat',
      'gram',
      'kilogram',
      'tonne',
      'troy-ounce',
      'stone',
    ]);
  });

  it('keeps temperature in the catalog’s order, the visitor’s own scale first; metric with no preference', () => {
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
    expect(ids(search('', { category: 'temperature', system: 'us' }))).toEqual([
      'fahrenheit',
      'celsius',
      'kelvin',
    ]);
    expect(ids(search('', { category: 'temperature', system: 'imperial' }))).toEqual([
      'celsius',
      'fahrenheit',
      'kelvin',
    ]);
    expect(ids(search('', { category: 'length' }))[0]).toBe('nanometer');
  });

  it('lists the specialty units after every standard one, smallest to largest', () => {
    expect(ids(search('', { category: 'length', system: 'us', tier: 'all' }))).toEqual([
      'inch',
      'foot',
      'yard',
      'mile',
      'nanometer',
      'micrometer',
      'millimeter',
      'centimeter',
      'meter',
      'kilometer',
      'nautical-mile',
      'light-year',
      'mil',
      'fathom',
      'furlong',
      'astronomical-unit',
      'parsec',
    ]);
    // A UK visitor's own measures first; the US ones are standard units of neither main system.
    expect(ids(search('', { category: 'volume', system: 'imperial', tier: 'all' }))).toEqual([
      'imperial-fluid-ounce',
      'imperial-pint',
      'imperial-gallon',
      'cubic-foot',
      'cubic-yard',
      'milliliter',
      'liter',
      'cubic-meter',
      'us-teaspoon',
      'us-tablespoon',
      'us-fluid-ounce',
      'us-cup',
      'us-pint',
      'us-quart',
      'us-gallon',
      'cubic-inch',
      'oil-barrel',
    ]);
  });

  it('names the group each unit is listed in, for the visitor', () => {
    const group = (id: string, system: 'us' | 'imperial' | 'metric') =>
      unitListGroup(getUnit(id)!, system);
    expect(group('inch', 'us')).toBe('own');
    expect(group('meter', 'us')).toBe('other');
    expect(group('imperial-pint', 'us')).toBe('neither');
    expect(group('imperial-pint', 'imperial')).toBe('own');
    expect(group('knot', 'metric')).toBe('neither');
    expect(group('nanometer', 'metric')).toBe('own');
    expect(group('micrometer', 'metric')).toBe('own');
    expect(group('mil', 'metric')).toBe('specialty');
  });

  it('orders the newer categories by the same rule', () => {
    expect(ids(search('', { category: 'pressure', system: 'us', tier: 'all' }))).toEqual([
      'inch-of-mercury',
      'pound-per-square-inch',
      'pascal',
      'hectopascal',
      'millimeter-of-mercury',
      'kilopascal',
      'bar',
      'atmosphere',
      'megapascal',
    ]);
    expect(ids(search('', { category: 'power', system: 'metric', tier: 'all' }))).toEqual([
      'watt',
      'metric-horsepower',
      'kilowatt',
      'megawatt',
      'btu-per-hour',
      'horsepower',
      'ton-of-refrigeration',
      'gigawatt',
    ]);
    // A reciprocal has no size to order by: the catalog's order, the visitor's own unit first.
    expect(ids(search('', { category: 'fuel-economy', system: 'us', tier: 'all' }))).toEqual([
      'mile-per-us-gallon',
      'liter-per-100-kilometers',
      'kilometer-per-liter',
      'mile-per-imperial-gallon',
      'us-gallon-per-100-miles',
    ]);
    expect(ids(search('', { category: 'fuel-economy', system: 'imperial' }))[0]).toBe(
      'mile-per-imperial-gallon',
    );
    expect(ids(search('', { category: 'fuel-economy', system: 'metric' }))[0]).toBe(
      'liter-per-100-kilometers',
    );
    // Force and torque: the visitor's own pound-based units first, then the metric ones.
    expect(ids(search('', { category: 'force', system: 'us', tier: 'all' }))).toEqual([
      'pound-force',
      'newton',
      'kilogram-force',
      'kilonewton',
      'dyne',
      'ounce-force',
      'kip',
    ]);
    expect(ids(search('', { category: 'torque', system: 'metric', tier: 'all' }))).toEqual([
      'newton-meter',
      'pound-inch',
      'pound-foot',
      'ounce-force-inch',
      'newton-centimeter',
      'kilogram-force-centimeter',
      'kilogram-force-meter',
    ]);
    // Angles have no customary system: degrees and radians, the gradian, then the specialty ones.
    expect(ids(search('', { category: 'angle', system: 'us', tier: 'all' }))).toEqual([
      'degree',
      'radian',
      'gradian',
      'arcsecond',
      'arcminute',
      'revolution',
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
    expect(ids(search('oz', { category: 'volume' }))).toEqual([
      'us-fluid-ounce',
      'imperial-fluid-ounce',
    ]);
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

  it('ranks a preferred category first among equal matches, hiding none', () => {
    // Units only: "p" also starts Pressure and Power, "f" Fuel economy, and categories lead their
    // class.
    const unitIds = (response: SearchResponse) => ids(response).filter((id) => !id.startsWith('#'));
    expect(unitIds(search('p', { system: 'us' })).slice(0, 2)).toEqual(['pound', 'us-pint']);
    expect(unitIds(search('p', { system: 'us', prefer: 'volume' })).slice(0, 3)).toEqual([
      'us-pint',
      'imperial-pint',
      'pound',
    ]);
    // A stronger match still comes first: °F is an exact symbol, fl oz only a prefix.
    expect(unitIds(search('f', { system: 'us', prefer: 'volume' })).slice(0, 4)).toEqual([
      'fahrenheit',
      'us-fluid-ounce',
      'imperial-fluid-ounce',
      'foot',
    ]);
    // Categories still lead their class.
    expect(ids(search('t', { prefer: 'volume' })).slice(0, 5)).toEqual([
      'tonne',
      '#temperature',
      '#time',
      '#torque',
      'us-teaspoon',
    ]);
  });
});

describe('search: case', () => {
  it('a key written as typed, its case included, leads one found by folding case', () => {
    // Symbols are case-sensitive: the nanometer and the newton meter, the knot and the kilonewton.
    expect(ids(search('nm', { tier: 'all' })).slice(0, 2)).toEqual(['nanometer', 'newton-meter']);
    expect(ids(search('Nm', { tier: 'all' })).slice(0, 2)).toEqual(['newton-meter', 'nanometer']);
    expect(ids(search('kn')).slice(0, 2)).toEqual(['knot', 'kilonewton']);
    expect(ids(search('kN')).slice(0, 2)).toEqual(['kilonewton', 'knot']);
    expect(resolveExact('nm')?.id).toBe('nanometer');
    expect(resolveExact('Nm')?.id).toBe('newton-meter');
    expect(resolveExact('kn')?.id).toBe('knot');
    expect(resolveExact('kN')?.id).toBe('kilonewton');
    // Neither as typed: both are offered, as before.
    expect(resolveExact('KN')).toBeNull();
  });

  it('the current category’s exact match leads, then the one written as typed', () => {
    // In Torque, "nm" is the newton meter; in Length, "Nm" the nanometer.
    expect(ids(search('nm', { prefer: 'torque' })).slice(0, 2)).toEqual([
      'newton-meter',
      'nanometer',
    ]);
    expect(ids(search('Nm', { prefer: 'length' })).slice(0, 2)).toEqual([
      'nanometer',
      'newton-meter',
    ]);
    expect(resolveExact('nm', { prefer: 'torque' })?.id).toBe('newton-meter');
    expect(resolveExact('Nm', { prefer: 'length' })?.id).toBe('nanometer');
    // With no category chosen, the spelling decides.
    expect(ids(search('nm')).slice(0, 2)).toEqual(['nanometer', 'newton-meter']);
    expect(resolveExact('nm')?.id).toBe('nanometer');
    // In Speed, "c" is the speed of light; anywhere else Celsius.
    expect(resolveExact('c', { prefer: 'speed' })?.id).toBe('speed-of-light');
  });

  it('keys both written as typed still put the standard unit first', () => {
    expect(ids(search('c', { tier: 'all' })).slice(0, 2)).toEqual(['celsius', 'speed-of-light']);
    expect(resolveExact('c')?.id).toBe('celsius');
    // A torque wrench's "ft-lb" is torque; Energy's foot-pound, a specialty unit, follows it.
    expect(ids(search('ft-lb', { tier: 'all' }))).toEqual(['pound-foot', 'foot-pound']);
    expect(resolveExact('ft-lb')?.id).toBe('pound-foot');
    expect(resolveExact('oz')).toBeNull();
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
    expect(resolveExact('mbar')?.id).toBe('hectopascal');
    expect(resolveExact('food calories')?.id).toBe('kilocalorie');
  });

  it('leaves "mpg" to the visitor’s gallon, offering both', () => {
    expect(resolveExact('mpg')).toBeNull();
    expect(ids(search('mpg', { system: 'us' })).slice(0, 2)).toEqual([
      'mile-per-us-gallon',
      'mile-per-imperial-gallon',
    ]);
    expect(ids(search('mpg', { system: 'imperial' })).slice(0, 2)).toEqual([
      'mile-per-imperial-gallon',
      'mile-per-us-gallon',
    ]);
  });

  it('leaves "ton" to the visitor’s own ton, offering every one', () => {
    expect(resolveExact('ton')).toBeNull();
    expect(ids(search('ton', { system: 'us', tier: 'all' }))[0]).toBe('short-ton');
    // The long ton is a specialty unit; the UK weighs in tonnes.
    expect(ids(search('ton', { system: 'imperial', tier: 'all' }))[0]).toBe('tonne');
    expect(ids(search('ton', { system: 'imperial', tier: 'all' }))).toContain('long-ton');
    expect(ids(search('ton', { system: 'metric', tier: 'all' }))[0]).toBe('tonne');
  });

  it('puts a standard unit before a specialty one among exact matches', () => {
    expect(resolveExact('c')?.id).toBe('celsius');
    expect(ids(search('c', { tier: 'all' })).slice(0, 2)).toEqual(['celsius', 'speed-of-light']);
    expect(resolveExact('speed of light')?.id).toBe('speed-of-light');
  });

  it('offers every scale whose symbol starts with a typed degree sign, the degree first', () => {
    expect(ids(search('°', { tier: 'all' }))).toEqual([
      'degree',
      'celsius',
      'fahrenheit',
      'rankine',
    ]);
    expect(ids(search('F', { tier: 'all' }))[0]).toBe('fahrenheit');
  });

  it('reads a degree sign on its own as the angle, and before a letter as the scale', () => {
    expect(resolveExact('°')?.id).toBe('degree');
    expect(resolveExact('º')?.id).toBe('degree');
    expect(resolveExact('°C')?.id).toBe('celsius');
    expect(resolveExact('degrees')?.id).toBe('degree');
    expect(suggest('45°').exact?.id).toBe('degree');
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

describe('search: the catalog’s alias decisions', () => {
  // docs/UNITS-CATALOG.md records each alias decision (§0, "Alias decisions so far"; §4; §5's
  // watchlist); each row pins one by the first result for its query, over every tier, as the
  // converter asks (ADR 0018). Each cites the catalog's section and, as of v0.6, its line.
  const decisions: ReadonlyArray<[query: string, first: string, where: string]> = [
    ['/km', 'minute-per-kilometer', '§0 the paces, line 17'],
    ['per km', 'minute-per-kilometer', '§0 the paces, line 17'],
    ['km pace', 'minute-per-kilometer', '§0 the paces, line 17'],
    ['/mi', 'minute-per-mile', '§0 the paces, line 17'],
    ['/mile', 'minute-per-mile', '§0 the paces, line 17'],
    ['per mile', 'minute-per-mile', '§0 the paces, line 17'],
    ['mile pace', 'minute-per-mile', '§0 the paces, line 17'],
    ['pace', '#speed', '§0 the paces, line 17: pace names Speed, which lists them'],
    ['kph', 'kilometer-per-hour', '§0 colloquial aliases, line 18'],
    ['kmh', 'kilometer-per-hour', '§0 colloquial aliases, line 18'],
    ['ci', 'cubic-inch', '§0 the car words, line 20'],
    ['cid', 'cubic-inch', '§0 the car words, line 20'],
    ['displacement', '#volume', '§0 the car words, line 20'],
    ['boost', '#pressure', '§0 the car words, line 20'],
    ['lug nut torque', '#torque', '§0 the car words, line 20'],
    ['engine power', '#power', '§0 the car words, line 20'],
    ['gon', 'gradian', '§3 Angle, line 78: grad, the gon its alias'],
    ['KB', 'kilobyte', '§4 Data, line 127: case folded, no alias'],
  ];

  it.each(decisions)('%s names %s (%s)', (query, first) => {
    expect(ids(search(query, { tier: 'all' }))[0]).toBe(first);
  });

  it('offers grains before grams for "gr" (§0, line 24)', () => {
    expect(ids(search('gr', { tier: 'all' })).slice(0, 2)).toEqual(['grain', 'gram']);
  });

  it('offers Length before Time for "how long", which both claim, by registry order (§5, line 150)', () => {
    expect(ids(search('how long')).slice(0, 2)).toEqual(['#length', '#time']);
  });
});

describe('search: a word names the thing it is (Sean, 2026-10-18)', () => {
  // Four aliases put another thing ahead of the one the word names, and were dropped: Volume's
  // "cooking" listed Volume above the Cooking category, Data's "bytes" listed the category above
  // the byte, Torque's "foot-pound" spellings took Energy's own unit name, and Mass's "oz." took the
  // weight ounce outright while "oz" asks which (docs/UNITS-CATALOG.md §5).
  it('"cooking" is the Cooking category alone', () => {
    expect(ids(search('cooking'))).toEqual(['#cooking']);
  });

  it('"bytes" is the byte first, not the Data category', () => {
    expect(ids(search('bytes'))[0]).toBe('byte');
    expect(ids(search('bytes'))).not.toContain('#data');
  });

  it('"foot-pound" is Energy\'s foot-pound, and "ft-lb" still Torque\'s pound-foot first', () => {
    expect(resolveExact('foot-pound', { tier: 'all' })?.id).toBe('foot-pound');
    expect(ids(search('ft-lb', { tier: 'all' }))[0]).toBe('pound-foot');
  });

  it('"oz." asks which ounce, as "oz" does', () => {
    expect(resolveExact('oz.')).toBeNull();
    expect(resolveExact('oz')).toBeNull();
  });
});
