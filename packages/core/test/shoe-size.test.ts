import { describe, expect, it } from 'vitest';
import {
  convert,
  getUnit,
  leadingTarget,
  matchSpan,
  parse,
  resolveExact,
  roundToStep,
  search,
  suggest,
  unitsIn,
} from '../src/index';
import type { SearchResponse, Unit } from '../src/index';
import { CHILDREN_TABLE } from '../src/units/shoe-size-tables';
import { EUR_GRADING, MONDO_GRADING, UK_GRADING } from './iso-19407-table2';

function unit(id: string): Unit {
  const found = getUnit(id);
  if (!found) throw new Error(`no unit ${id}`);
  return found;
}

/** A converted value as the scale marks it: to the unit's step, to the nearest. */
function marked(value: number, id: string): number {
  const step = unit(id).step;
  if (step === undefined) throw new Error(`${id} has no step`);
  return roundToStep(value, step)!.value;
}

function ids(response: SearchResponse): string[] {
  return response.results.map((r) => (r.kind === 'unit' ? r.unit.id : `#${r.category.id}`));
}

/** Table 3's rows of a scale up to where it restarts at 1, and the rows after. */
function split(column: 'uk' | 'us') {
  const before: { foot: number; size: number }[] = [];
  const after: { foot: number; size: number }[] = [];
  for (const row of CHILDREN_TABLE) {
    const size = row[column];
    if (size === null) continue;
    const restarted =
      after.length > 0 || (before.length > 0 && size < before[before.length - 1]!.size);
    (restarted ? after : before).push({ foot: row.foot, size });
  }
  return { before, after };
}

describe('shoe sizes (ADR 0027): ISO/TS 19407:2015 as the engine holds it', () => {
  it('reproduces Table 2 from the formulas with the printed steps, but for three cells at a rounding boundary', () => {
    const gradings = [
      { from: 'mondopoint', rows: MONDO_GRADING, others: ['eu', 'uk'] },
      { from: 'eu', rows: EUR_GRADING, others: ['mondopoint', 'uk'] },
      { from: 'uk', rows: UK_GRADING, others: ['mondopoint', 'eu'] },
    ] as const;
    let checked = 0;
    const misses: string[] = [];
    for (const { from, rows, others } of gradings) {
      for (const [size, first, second, usMen, usWomen] of rows) {
        const printed: Record<string, number> = {
          [others[0]]: first,
          [others[1]]: second,
          'us-men': usMen,
          'us-women': usWomen,
        };
        for (const [to, expected] of Object.entries(printed)) {
          checked += 1;
          const got = marked(convert(size, from, to), to);
          if (Math.abs(got - expected) > 1e-9)
            misses.push(`${from} ${size} → ${to}: ${got}, printed ${expected}`);
        }
      }
    }
    expect(checked).toBe(324);
    // Each within 0.015 of a size of a boundary (docs/research/shoe-sizes-1.md): ISO's own rounding
    // at the edge, not a fault in the formulas.
    expect(misses).toEqual([
      'uk 2 → eu: 33.5, printed 34',
      'uk 8 → mondopoint: 265, printed 260',
      'uk 15 → eu: 50.5, printed 50',
    ]);
  });

  it('puts US men’s one size and US women’s two above UK everywhere, exactly', () => {
    for (let uk = 2; uk <= 15; uk += 0.5) {
      expect(convert(uk, 'uk', 'us-men')).toBeCloseTo(uk + 1, 9);
      expect(convert(uk, 'uk', 'us-women')).toBeCloseTo(uk + 2, 9);
      expect(convert(uk + 1, 'us-men', 'us-women')).toBeCloseTo(uk + 2, 9);
    }
  });

  it('reads the children’s table row for row, in both directions', () => {
    for (const row of CHILDREN_TABLE) {
      expect(
        marked(convert(row.foot, 'mondopoint', 'eu-children'), 'eu-children'),
        `${row.foot} mm`,
      ).toBe(row.eu);
      expect(convert(row.eu, 'eu-children', 'mondopoint'), `EUR ${row.eu}`).toBeCloseTo(
        row.foot,
        9,
      );
    }
    for (const [column, id] of [
      ['uk', 'uk-children'],
      ['us', 'us-children'],
    ] as const) {
      const { before, after } = split(column);
      expect(before.length, column).toBeGreaterThan(15);
      for (const { foot, size } of before) {
        expect(marked(convert(foot, 'mondopoint', id), id), `${foot} mm ${id}`).toBe(size);
        expect(convert(size, id, 'mondopoint'), `${id} ${size}`).toBeCloseTo(foot, 9);
      }
      // After the restart the table's sizes are the adult scale's: the US youth sizes within a
      // third of a size of US men's at the table's rows, the UK junior sizes within 0.53 of UK
      // (the rows stand for European sizes' feet, and the children's table allows a growing foot
      // more room than the adult rule; docs/research/shoe-sizes-1.md).
      const adult = column === 'us' ? 'us-men' : 'uk';
      const slack = column === 'us' ? 0.3 : 0.55;
      expect(after.length, column).toBeGreaterThan(5);
      for (const { foot, size } of after) {
        expect(
          Math.abs(convert(foot, 'mondopoint', adult) - size),
          `${foot} mm ${adult}`,
        ).toBeLessThan(slack);
      }
    }
  });

  it('covers the table’s feet half a row past each end, and carries the line on outside them', () => {
    expect(unit('us-children').range).toEqual([118.5, 194]);
    expect(unit('uk-children').range).toEqual([118.5, 196.5]);
    expect(unit('eu-children').range).toEqual([118.5, 238]);
    expect(unit('us-men').range).toBeUndefined();
    const outside = convert(250, 'mondopoint', 'us-children');
    expect(Number.isFinite(outside)).toBe(true);
    expect(outside).toBeGreaterThan(13.5);
    expect(
      convert(convert(100, 'mondopoint', 'eu-children'), 'eu-children', 'mondopoint'),
    ).toBeCloseTo(100, 9);
  });

  it('marks every scale in half sizes and Mondopoint in 5 mm, written before its number', () => {
    for (const each of unitsIn('shoe-size')) {
      expect(each.step, each.id).toBe(each.id === 'mondopoint' ? 5 : 0.5);
      expect(each.prefix, each.id).toBe(true);
      expect(each.exact, each.id).toBe(each.id === 'mondopoint' || each.id === 'japan');
      expect(each.conventional, each.id).toBe(each.exact ? undefined : true);
    }
    expect(roundToStep(9.89, 0.5)).toEqual({ value: 10, approx: true });
    expect(roundToStep(271.04, 5)).toEqual({ value: 270, approx: true });
    expect(roundToStep(10.25, 0.5)).toEqual({ value: 10.5, approx: true });
    expect(roundToStep(-10.25, 0.5)).toEqual({ value: -10.5, approx: true });
    expect(roundToStep(10.000000000001, 0.5)).toEqual({ value: 10, approx: false });
    expect(roundToStep(10.5, 0.5)).toEqual({ value: 10.5, approx: false });
    expect(roundToStep(9.6, 0.5, 'down')).toEqual({ value: 9.5, approx: true });
    expect(roundToStep(9.6, 0.5, 'up')).toEqual({ value: 10, approx: true });
    expect(roundToStep(Number.NaN, 0.5)).toBeNull();
    expect(roundToStep(1, 0)).toBeNull();
  });

  it('lists the visitor’s own scales first, the children’s after their adults, Mondopoint and Japan last', () => {
    expect(ids(search('', { category: 'shoe-size', system: 'us' }))).toEqual([
      'us-men',
      'us-women',
      'us-children',
      'uk',
      'uk-children',
      'eu',
      'eu-children',
      'mondopoint',
      'japan',
    ]);
    expect(ids(search('', { category: 'shoe-size', system: 'imperial' }))[0]).toBe('uk');
    expect(ids(search('', { category: 'shoe-size', system: 'metric' }))[0]).toBe('eu');
  });

  it('reads a scale before its number, a bare "us" as men’s, and "size" as the category', () => {
    expect(parse('us 11')).toMatchObject({
      value: 11,
      valueText: '11',
      query: 'us',
      canonical: '11',
    });
    expect(parse('us11')).toMatchObject({ value: 11, query: 'us' });
    expect(parse('US M 11.5')).toMatchObject({ value: 11.5, query: 'US M' });
    expect(parse('eu 45 to us')).toMatchObject({ value: 45, query: 'eu to us' });
    expect(parse("women's 8 in men's")).toMatchObject({ value: 8, query: "women's in men's" });
    expect(parse('size 11')).toMatchObject({ value: 11, query: 'size' });
    expect(parse('kids 30')).toMatchObject({ value: 30, query: 'kids' });
    expect(parse('jp 27.5')).toMatchObject({ value: 27.5, query: 'jp' });
    expect(parse('us')).toEqual({ raw: 'us', query: 'us' });
    // "m" is men's key too, so "m 11" reads as a scale before its number; a word that is no key stays a query.
    expect(parse('m 11')).toMatchObject({ value: 11, query: 'm' });
    expect(parse('x 11')).toEqual({ raw: 'x 11', query: 'x 11' });
    expect(parse('11 us')).toMatchObject({ value: 11, query: 'us' });
    expect(suggest('us 11').exact?.id).toBe('us-men');
    expect(suggest('us w 8').exact?.id).toBe('us-women');
    expect(ids(search('us'))[0]).toBe('us-men');
    expect(ids(search('us', { prefer: 'shoe-size' })).slice(0, 3)).toEqual([
      'us-men',
      'us-women',
      'us-children',
    ]);
    expect(ids(search('size'))[0]).toBe('#shoe-size');
    expect(ids(search('kids', { system: 'imperial' })).slice(0, 2)).toEqual([
      '#shoe-size',
      'uk-children',
    ]);
    expect(ids(search('cm'))[0]).toBe('centimeter');
    expect(ids(search('cm', { prefer: 'shoe-size' }))[0]).toBe('japan');
    expect(ids(search('mm', { category: 'shoe-size' }))).toEqual(['mondopoint']);
    expect(ids(search('gb'))[0]).toBe('gigabyte');
    // A possessive is typed with or without its apostrophe, and the letters are marked either way;
    // a lone foot mark stays the foot's own key.
    expect(ids(search("men's"))[0]).toBe('us-men');
    expect(ids(search('mens'))[0]).toBe('us-men');
    expect(ids(search('womens', { prefer: 'shoe-size' }))[0]).toBe('us-women');
    expect(matchSpan('US men’s', 'mens')).toEqual({ start: 3, end: 8 });
    expect(matchSpan('US men’s', "men's")).toEqual({ start: 3, end: 8 });
    expect(ids(search("'"))[0]).toBe('foot');
  });

  it('matches a query by its head when the whole matches nothing and it ends in "to" or "in" and a target', () => {
    const km = search('km to miles');
    expect(ids(km)[0]).toBe('kilometer');
    expect(km.target).toBe('miles');
    const us = search('us in eu');
    expect(ids(us)[0]).toBe('us-men');
    expect(us.target).toBe('eu');
    expect(search('km to').target).toBe('');
    expect(ids(search('km to'))[0]).toBe('kilometer');
    expect(resolveExact('us to eu')?.id).toBe('us-men');
    expect(suggest('5 km to miles').exact?.id).toBe('kilometer');
    // The pair's "ft in" matches whole, as do a name's letters on their way.
    const pair = search('ft in');
    expect(ids(pair)[0]).toBe('foot-inch');
    expect(pair.target).toBeUndefined();
    expect(search('feet in').target).toBeUndefined();
    expect(search('ft in to cm').target).toBe('cm');
    expect(ids(search('ft in to cm'))[0]).toBe('foot-inch');
    expect(search('xyz to abc').results).toEqual([]);
    expect(search('xyz to abc').target).toBeUndefined();
  });

  it('ranks the target’s category first, reads a target with no connective, and a connective alone', () => {
    // "11m to eu": the meter leads a bare "m", US men once the target names a shoe scale.
    expect(ids(search('m'))[0]).toBe('meter');
    expect(ids(search('m', { prefer: 'shoe-size' }))[0]).toBe('us-men');
    expect(ids(search('m to eu')).slice(0, 2)).toEqual(['us-men', 'meter']);
    expect(search('m to eu').target).toBe('eu');
    expect(ids(search('m to e'))[0]).toBe('us-men');
    expect(ids(search('oz to ml'))[0]).toBe('us-fluid-ounce');
    expect(ids(search('oz to g'))[0]).toBe('ounce');
    expect(ids(search('c to f'))[0]).toBe('celsius');
    // The target's category never lifts a weaker match: "m to s" is still the meter.
    expect(ids(search('m to s'))[0]).toBe('meter');
    expect(suggest('11m to eu').search.results[0]).toMatchObject({ unit: { id: 'us-men' } });
    // No connective: the last words as the target, where they name a unit of a category the head
    // matches in; a word that names none leaves the query unsplit.
    const bare = search('us eu');
    expect(ids(bare)[0]).toBe('us-men');
    expect(bare.target).toBe('eu');
    // A whole that matches, by prefix even, is never split: 'us e' starts the microsecond's µsec.
    expect(ids(search('us e'))[0]).toBe('microsecond');
    expect(search('us e').target).toBeUndefined();
    expect(ids(search('m eu'))[0]).toBe('us-men');
    expect(ids(search('fluid ounce ml'))[0]).toBe('us-fluid-ounce');
    expect(search('fluid ounce ml').target).toBe('ml');
    expect(search('us xyz').results).toEqual([]);
    expect(search('us xyz').target).toBeUndefined();
    expect(parse('11 us eu')).toMatchObject({ value: 11, query: 'us eu' });
    // A connective alone: a target with the whole's matches, usually none; "in" alone is the inch.
    expect(search('to cm')).toMatchObject({ results: [], target: 'cm' });
    expect(ids(search('in'))[0]).toBe('inch');
    expect(search('in').target).toBeUndefined();
    expect(search('in cm').target).toBe('cm');
    expect(leadingTarget('to eu')).toBe('eu');
    expect(leadingTarget('to')).toBe('');
    expect(leadingTarget('in cm')).toBe('cm');
    expect(leadingTarget('eu')).toBeNull();
    expect(leadingTarget('us to eu')).toBeNull();
  });
});
