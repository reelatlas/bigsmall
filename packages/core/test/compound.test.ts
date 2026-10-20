import { describe, expect, it } from 'vitest';
import {
  convert,
  formatPair,
  getUnit,
  pairCanonical,
  pairParts,
  pairsOpenedBy,
  parse,
  readCompound,
  units,
} from '../src/index';
import type { FractionSize, Unit } from '../src/index';

// Compound quantities (ADR 0026; docs/UX-SPEC.md §2, §7): the box reads a value in two or three
// units of one kind as one quantity, and the table writes a pair the same way, the total rounded
// and then split. The forms are the demand map's compound worker's must-read and must-not lists
// (docs/research/demand-map-1/compound/findings.md §7), each as typed.

const EN = { decimal: '.', group: ',' };
const DE = { decimal: ',', group: '.' };
const MINUS = String.fromCharCode(0x2212);

const unit = (id: string): Unit => {
  const found = getUnit(id);
  if (!found) throw new Error(`no unit ${id}`);
  return found;
};

/** A compound's parts as [value, unit id], and the pair it names. */
function read(text: string, separators = EN) {
  const found = readCompound(text, separators);
  return found && { unit: found.unit, parts: found.parts.map((part) => [part.value, part.unit]) };
}

describe('readCompound: heights', () => {
  const height = {
    unit: 'foot-inch',
    parts: [
      [5, 'foot'],
      [11, 'inch'],
    ],
  };

  it('reads feet and inches written with marks, words, or the inch left off', () => {
    for (const text of [
      `5'11"`,
      '5′ 11″',
      '5’11”',
      `5'11`,
      `5' 11''`,
      '5 ft 11 in',
      '5ft11in',
      '5ft11',
      '5 ft 11',
      '5 feet 11 inches',
      '5 feet and 11 inches',
      '5 ft, 11 in',
      '5 FT 11 IN',
    ]) {
      expect(read(text), text).toEqual(height);
      expect(readCompound(text, EN)?.value, text).toBeCloseTo(5 + 11 / 12, 12);
      expect(readCompound(text, EN)?.end, text).toBe(text.length);
    }
  });

  it('reads a zero remainder, and the inch naming the pair after a bare number', () => {
    expect(read(`6'0`)).toEqual({
      unit: 'foot-inch',
      parts: [
        [6, 'foot'],
        [0, 'inch'],
      ],
    });
    expect(read('5 11 in')).toEqual(height);
    expect(read(`5 11"`)).toEqual(height);
  });

  it('reads a decimal, a fraction, a mixed number, a vulgar fraction, or "and a half" in a part', () => {
    expect(read(`5' 10 3/8"`)).toEqual({
      unit: 'foot-inch',
      parts: [
        [5, 'foot'],
        [10.375, 'inch'],
      ],
    });
    expect(read(`5'-10 3/8"`)).toEqual({
      unit: 'foot-inch',
      parts: [
        [5, 'foot'],
        [10.375, 'inch'],
      ],
    });
    expect(read('5 ft 11 1/2 in')).toEqual({
      unit: 'foot-inch',
      parts: [
        [5, 'foot'],
        [11.5, 'inch'],
      ],
    });
    expect(read('5 ft 11.5 in')).toEqual({
      unit: 'foot-inch',
      parts: [
        [5, 'foot'],
        [11.5, 'inch'],
      ],
    });
    expect(read('5 ft 11,5 in', DE)).toEqual({
      unit: 'foot-inch',
      parts: [
        [5, 'foot'],
        [11.5, 'inch'],
      ],
    });
    expect(read(`5' 10½"`)).toEqual({
      unit: 'foot-inch',
      parts: [
        [5, 'foot'],
        [10.5, 'inch'],
      ],
    });
    expect(read('2 ft 6 and a half in')).toEqual({
      unit: 'foot-inch',
      parts: [
        [2, 'foot'],
        [6.5, 'inch'],
      ],
    });
    expect(read('5.5 ft 3 in')).toEqual({
      unit: 'foot-inch',
      parts: [
        [5.5, 'foot'],
        [3, 'inch'],
      ],
    });
  });

  it('sums an overflowing part and writes the normalised value', () => {
    const over = readCompound(`5' 14"`, EN)!;
    expect(over.value).toBeCloseTo(6 + 2 / 12, 12);
    expect(over.canonical).toBe('6 ft 2 in');
  });

  it('applies a leading sign to the whole', () => {
    const below = readCompound(`-5'11"`, EN)!;
    expect(below.value).toBeCloseTo(-(5 + 11 / 12), 12);
    expect(below.canonical).toBe('-5 ft 11 in');
    expect(readCompound(`${MINUS}5 ft 11 in`, EN)?.canonical).toBe('-5 ft 11 in');
    expect(readCompound('+5 ft 11 in', EN)?.canonical).toBe('5 ft 11 in');
  });

  it('ends before a word it cannot read, which stays for the query, and reads a word on its way', () => {
    // "in" after a number is the inch; after a unit it is the connective, left for the query.
    const connective = parse('5 ft 11 in in cm');
    expect(connective.compound?.unit).toBe('foot-inch');
    expect(connective).toMatchObject({ valueText: '5 ft 11 in', query: 'in cm' });
    expect(parse('5 ft 11 in to cm')).toMatchObject({ valueText: '5 ft 11 in', query: 'to cm' });
    // A final unit with no number of its own is the query's.
    expect(parse(`5'11 cm`)).toMatchObject({ valueText: `5'11`, query: 'cm' });
    expect(parse(`5'11 cm`).compound?.unit).toBe('foot-inch');
    // The last word still being typed reads as the part it starts.
    expect(read('5 ft 11 i')).toEqual(height);
    expect(read('5 ft 11 inc')).toEqual(height);
    expect(parse('5 ft 11 x')).toMatchObject({ valueText: '5 ft 11', query: 'x' });
  });
});

describe('readCompound: weights, times, and angles', () => {
  it('reads stone and pounds, and pounds and ounces, the last unit left off', () => {
    const stone = {
      unit: 'stone-pound',
      parts: [
        [11, 'stone'],
        [4, 'pound'],
      ],
    };
    for (const text of ['11 st 4 lb', '11st4', '11 stone 4', '11 st 4']) {
      expect(read(text), text).toEqual(stone);
    }
    expect(readCompound('11 st 4', EN)?.value).toBeCloseTo(11 + 4 / 14, 12);
    const baby = {
      unit: 'pound-ounce',
      parts: [
        [6, 'pound'],
        [3, 'ounce'],
      ],
    };
    for (const text of ['6 lb 3 oz', '6lb3oz', '6 lbs 3', '6 pounds 3 ounces']) {
      expect(read(text), text).toEqual(baby);
    }
    expect(readCompound('6 lb 3 oz', EN)?.value).toBe(6.1875);
  });

  it('reads hours, minutes, and seconds, "m" a minute after an hour', () => {
    const half = {
      unit: 'hour-minute-second',
      parts: [
        [1, 'hour'],
        [30, 'minute'],
      ],
    };
    for (const text of ['1 h 30 min', '1h30', '1 h 30 m', '1 hr 30 mins', '1 hour 30 minutes']) {
      expect(read(text), text).toEqual(half);
      expect(readCompound(text, EN)?.value, text).toBe(1.5);
    }
    expect(read('1 h 30 min 15 s')).toEqual({
      unit: 'hour-minute-second',
      parts: [
        [1, 'hour'],
        [30, 'minute'],
        [15, 'second'],
      ],
    });
    // A compound may start at a later part.
    expect(read('30 min 15 s')).toEqual({
      unit: 'hour-minute-second',
      parts: [
        [30, 'minute'],
        [15, 'second'],
      ],
    });
    expect(readCompound('30 min 15 s', EN)?.canonical).toBe('0 h 30 min 15 s');
  });

  it('reads degrees, minutes, and seconds of arc, by their marks or by d, m, and s', () => {
    const angle = {
      unit: 'degree-arcminute-arcsecond',
      parts: [
        [45, 'degree'],
        [30, 'arcminute'],
        [15, 'arcsecond'],
      ],
    };
    for (const text of ['45° 30′ 15″', `45° 30' 15"`, '45d 30m 15s', '45 deg 30 min 15 sec']) {
      expect(read(text), text).toEqual(angle);
    }
    expect(readCompound('45° 30′ 15″', EN)?.value).toBeCloseTo(45 + 30 / 60 + 15 / 3600, 12);
    expect(read('45° 30')).toEqual({
      unit: 'degree-arcminute-arcsecond',
      parts: [
        [45, 'degree'],
        [30, 'arcminute'],
      ],
    });
  });
});

describe('readCompound: what is no compound', () => {
  it('leaves a decimal, arithmetic, a bare pair of numbers, and a clock as they were', () => {
    for (const text of [
      '5.11 ft',
      '5-11',
      '511',
      '5 11',
      '5:75',
      '1:30 h',
      '2 × 3 ft',
      '5 ft + 3 in',
      '1/2 cup',
      '1,80 m',
      '1m80',
      `6'`,
      '71 in',
      '180 cm',
    ]) {
      expect(readCompound(text, EN), text).toBeNull();
      expect(parse(text).compound, text).toBeUndefined();
    }
    expect(parse('5.11 ft')).toMatchObject({ value: 5.11, query: 'ft' });
    expect(parse('5-11').value).toBe(-6);
    expect(parse('1:30 h')).toMatchObject({ value: 1.5, query: 'h' });
  });

  it('reads no parts out of order, and no two systems as one', () => {
    expect(readCompound('11 in 5 ft', EN)).toBeNull();
    expect(readCompound('1 m 33 ft', EN)).toBeNull();
    // Two systems: the pair is read as far as it goes, the other unit left for the query.
    expect(parse('5 ft 11 cm')).toMatchObject({ valueText: '5 ft 11', query: 'cm' });
  });

  it('reads "m" and "s" as minutes and seconds only after an hour, and d m s only in an angle', () => {
    expect(readCompound('5 m 30', EN)).toBeNull();
    expect(readCompound('5 s 30', EN)).toBeNull();
    expect(parse('5 d')).toMatchObject({ value: 5, query: 'd' });
    expect(read('2 d 3 h')).toBeNull();
  });

  it('reads a degree sign before a letter as a scale, never an angle', () => {
    expect(readCompound('45 °C 30', EN)).toBeNull();
    expect(parse('45°C').compound).toBeUndefined();
  });
});

describe('parse with a compound', () => {
  it('gives the value in the pair’s first part, the text as typed, and the canonical compound', () => {
    expect(parse(`5'11`).value).toBeCloseTo(5 + 11 / 12, 12);
    expect(parse(`5'11`)).toMatchObject({
      raw: `5'11`,
      valueText: `5'11`,
      canonical: '5 ft 11 in',
      compound: {
        unit: 'foot-inch',
        parts: [
          { value: 5, unit: 'foot' },
          { value: 11, unit: 'inch' },
        ],
      },
    });
    expect(parse(`5'11`).query).toBeUndefined();
    expect(parse(`5'11`).expression).toBeUndefined();
  });

  it('drops the words people type around a quantity, beside a number only', () => {
    expect(parse('how tall is 180 cm')).toMatchObject({ value: 180, query: 'cm' });
    expect(parse(`5'11 tall`)).toMatchObject({ valueText: `5'11`, canonical: '5 ft 11 in' });
    expect(parse('5 ft 11 in tall?')).toMatchObject({ valueText: '5 ft 11 in' });
    expect(parse('convert 5 ml')).toMatchObject({ value: 5, query: 'ml' });
    expect(parse('what is 2 + 3 ft')).toMatchObject({ value: 5, query: 'ft' });
    // A word on its own, or one that starts a unit, is still a query.
    expect(parse('how tall is')).toMatchObject({ query: 'how tall is' });
    expect(parse('convert')).toMatchObject({ query: 'convert' });
    expect(parse('5 long ton')).toMatchObject({ value: 5, query: 'long ton' });
  });

  it('reads the canonical compound back as the same value, in any locale', () => {
    for (const text of [
      '5 ft 11.5 in',
      '-5 ft 11 in',
      '45° 30′ 15″',
      '1 h 30 min 0 s',
      '0 h 30 min 15 s',
    ]) {
      const first = parse(text);
      expect(first.canonical, text).toBe(text);
      expect(parse(text.replace('.', ','), DE).value, text).toBe(first.value);
    }
  });
});

describe('pairs in the catalog', () => {
  it('names its parts, each a unit of its category', () => {
    for (const pair of units.filter((each) => each.pair)) {
      const parts = pairParts(pair);
      expect(parts.length, pair.id).toBe(pair.pair?.length);
      for (const part of parts) expect(part.category, pair.id).toBe(pair.category);
    }
    expect(pairParts(unit('meter'))).toEqual([]);
  });

  it('converts as its first part does: a plain number in feet and inches is feet', () => {
    expect(convert(6, 'foot-inch', 'inch')).toBeCloseTo(72, 12);
    expect(convert(5 + 11 / 12, 'foot-inch', 'centimeter')).toBeCloseTo(180.34, 12);
    expect(convert(180, 'centimeter', 'foot-inch')).toBeCloseTo(5.905511811, 9);
    expect(convert(1.5, 'hour-minute-second', 'minute')).toBeCloseTo(90, 12);
  });
});

describe('formatPair', () => {
  const ft = unit('foot-inch');
  const sizes = (...each: FractionSize[]) => new Set(each);
  const en = { locale: 'en-US' } as const;

  it('writes every part, the last to the places chosen, the total rounded before it is split, in the pair’s marks', () => {
    expect(formatPair(71 / 12, ft, { ...en, rounding: 'nearest', places: 2 })).toEqual({
      text: '5′ 11.00″',
      approx: false,
    });
    // 71.996 in is 6 ft 0.00 in at two places, never 5 ft 12.00 in.
    expect(formatPair(71.996 / 12, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '6′ 0.00″',
    );
    expect(formatPair(71.996 / 12, ft, { ...en, rounding: 'nearest', places: 0 })?.text).toBe(
      '6′ 0″',
    );
    expect(formatPair(70.866141732 / 12, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '5′ 10.87″',
    );
    expect(formatPair(0, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe('0′ 0.00″');
  });

  it('writes the last part as a fraction in the sizes chosen, ≈ where it rounds', () => {
    expect(
      formatPair(70.866141732 / 12, ft, { ...en, rounding: 'nearest', sizes: sizes(2, 4, 8, 16) }),
    ).toEqual({ text: '5′ 10 7/8″', approx: true });
    expect(
      formatPair(71.5 / 12, ft, { ...en, rounding: 'nearest', sizes: sizes(2, 4, 8) }),
    ).toEqual({ text: '5′ 11 1/2″', approx: false });
    expect(formatPair(71 / 12, ft, { ...en, rounding: 'nearest', sizes: sizes(8) })?.text).toBe(
      '5′ 11″',
    );
    expect(formatPair(0.99 / 12, ft, { ...en, rounding: 'nearest', sizes: sizes(2) })?.text).toBe(
      '0′ 1″',
    );
    expect(formatPair(1, ft, { ...en, rounding: 'nearest', sizes: new Set() })).toBeNull();
  });

  it('writes significant digits of the whole with neither, trailing zeros trimmed', () => {
    expect(
      formatPair(70.866141732 / 12, ft, { ...en, rounding: 'nearest', significant: 6 })?.text,
    ).toBe('5′ 10.8661″');
    expect(
      formatPair(70.866141732 / 12, ft, { ...en, rounding: 'nearest', significant: 10 })?.text,
    ).toBe('5′ 10.86614173″');
    expect(formatPair(71 / 12, ft, { ...en, rounding: 'nearest', significant: 6 })?.text).toBe(
      '5′ 11″',
    );
    expect(
      formatPair(1.5, unit('hour-minute-second'), { ...en, rounding: 'nearest', significant: 6 })
        ?.text,
    ).toBe('1:30:00');
  });

  it('rounds up toward larger values and down toward smaller, below zero too, the sign before the pair', () => {
    expect(formatPair(71.996 / 12, ft, { ...en, rounding: 'down', places: 2 })?.text).toBe(
      '5′ 11.99″',
    );
    expect(formatPair(71.996 / 12, ft, { ...en, rounding: 'up', places: 2 })?.text).toBe(
      '6′ 0.00″',
    );
    expect(formatPair(-71.996 / 12, ft, { ...en, rounding: 'up', places: 2 })?.text).toBe(
      '-5′ 11.99″',
    );
    expect(formatPair(-71.996 / 12, ft, { ...en, rounding: 'down', places: 2 })?.text).toBe(
      '-6′ 0.00″',
    );
    expect(formatPair(-71 / 12, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '-5′ 11.00″',
    );
  });

  it('says a value under the step as below it, in the last part, never 0 ft 0.00 in', () => {
    expect(formatPair(0.0001 / 12, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '< 0.01″',
    );
    expect(formatPair(-0.0001 / 12, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '> -0.01″',
    );
    expect(formatPair(0.0001 / 12, ft, { ...en, rounding: 'nearest', sizes: sizes(8) })?.text).toBe(
      '< 1/8″',
    );
  });

  it('groups a large first part, attaches the marks of an angle, and takes the locale’s marks', () => {
    expect(formatPair(5280, ft, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '5,280′ 0.00″',
    );
    expect(
      formatPair(45 + 30 / 60 + 15 / 3600, unit('degree-arcminute-arcsecond'), {
        ...en,
        rounding: 'nearest',
        places: 2,
      })?.text,
    ).toBe('45° 30′ 15.00″');
    expect(
      formatPair(158 / 14, unit('stone-pound'), { ...en, rounding: 'nearest', places: 2 })?.text,
    ).toBe('11 st 4.00 lb');
    expect(
      formatPair(70.866141732 / 12, ft, { locale: 'de-DE', rounding: 'nearest', places: 2 })?.text,
    ).toBe('5′ 10,87″');
  });

  it('writes a clock to the second whatever is chosen, and the parts’ words for speech', () => {
    const hms = unit('hour-minute-second');
    expect(formatPair(1.5, hms, { ...en, rounding: 'nearest', places: 3 })?.text).toBe('1:30:00');
    expect(formatPair(1.5, hms, { ...en, rounding: 'nearest', sizes: sizes(8) })?.text).toBe(
      '1:30:00',
    );
    expect(
      formatPair(1 + 5 / 60 + 30.4 / 3600, hms, { ...en, rounding: 'nearest', places: 2 })?.text,
    ).toBe('1:05:30');
    expect(formatPair(-1.5, hms, { ...en, rounding: 'nearest', places: 2 })?.text).toBe('-1:30:00');
    expect(formatPair(0.1 / 3600, hms, { ...en, rounding: 'nearest', places: 2 })?.text).toBe(
      '< 0:00:01',
    );
    expect(formatPair(1.5, hms, { ...en, rounding: 'nearest', places: 2, words: true })?.text).toBe(
      '1 h 30 min 0.00 s',
    );
    expect(
      formatPair(71 / 12, ft, { ...en, rounding: 'nearest', places: 2, words: true })?.text,
    ).toBe('5 ft 11.00 in');
  });

  it('is null for no pair, a value past what places mean, or no finite value', () => {
    expect(formatPair(5, unit('foot'), { ...en, rounding: 'nearest', places: 2 })).toBeNull();
    expect(formatPair(1e16, ft, { ...en, rounding: 'nearest', places: 2 })).toBeNull();
    expect(formatPair(Number.NaN, ft, { ...en, rounding: 'nearest', places: 2 })).toBeNull();
  });
});

describe('pairCanonical', () => {
  it('writes the pair with a period and a hyphen, no grouping, ten significant digits', () => {
    expect(pairCanonical(5 + 11 / 12, unit('foot-inch'))).toBe('5 ft 11 in');
    expect(pairCanonical(-(5 + 11.5 / 12), unit('foot-inch'))).toBe('-5 ft 11.5 in');
    expect(pairCanonical(5280 + 0.5 / 12, unit('foot-inch'))).toBe('5280 ft 0.5 in');
    expect(pairCanonical(70.866141732 / 12, unit('foot-inch'))).toBe('5 ft 10.86614173 in');
    expect(pairCanonical(1.5, unit('hour-minute-second'))).toBe('1 h 30 min 0 s');
  });
});

describe('pairsOpenedBy', () => {
  it('names the pair a lone mark opens: feet and inches after a foot mark, none after an inch mark', () => {
    for (const mark of ["'", '′', '’']) {
      expect(
        pairsOpenedBy(mark).map((unit) => unit.id),
        mark,
      ).toEqual(['foot-inch']);
    }
    for (const mark of ['"', '″', 'x', '', '5']) expect(pairsOpenedBy(mark), mark).toEqual([]);
  });
});
