import { describe, expect, it } from 'vitest';
// The record the charts are written from (docs/research/shoe-sizes-2/brands.py), read whole.
import recordFile from '../../../docs/research/shoe-sizes-2/brands.json';
import {
  brandChart,
  brandScale,
  brandsAtFoot,
  convert,
  getShoeBrand,
  getUnit,
  matchShoeBrands,
  readBrand,
  search,
  shoeBrands,
  splitShoeBrand,
  unitsIn,
} from '../src/index';
import type { BrandChartRow, ShoeBrand, Unit } from '../src/index';

interface RecordRow {
  [key: string]: number | string | boolean | Record<string, string> | undefined;
}
interface RecordChart {
  brand: string;
  line: 'men' | 'women' | 'unisex';
  product?: boolean;
  length: { basis: string };
  rows: RecordRow[];
}

function unit(id: string): Unit {
  const found = getUnit(id);
  if (!found) throw new Error(`no unit ${id}`);
  return found;
}

function brand(id: string): ShoeBrand {
  const found = getShoeBrand(id);
  if (!found) throw new Error(`no brand ${id}`);
  return found;
}

/** The record's brand name as the generator ids it. */
function idOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** A record cell as core holds it: a range's two ends, adidas's JP in millimetres as centimetres. */
function cellOf(row: RecordRow, key: string): number | readonly [number, number] | undefined {
  const value = row[key];
  if (typeof value !== 'number') return undefined;
  const low = row[`${key}_low`];
  const high = row[`${key}_high`];
  if (typeof low === 'number' && typeof high === 'number') return [low, high];
  return key === 'jp' && value > 100 ? value / 10 : value;
}

const RECORD_KEYS: readonly [string, keyof BrandChartRow][] = [
  ['us_men', 'usMen'],
  ['us_women', 'usWomen'],
  ['uk', 'uk'],
  ['uk_women', 'ukWomen'],
  ['eu', 'eu'],
  ['jp', 'jp'],
];

describe('the brands’ charts (ADR 0028): core holds the record cell for cell', () => {
  const record = recordFile as unknown as { charts: RecordChart[] };
  const charts = record.charts.filter((chart) => chart.product);

  it('carries every product chart of the record, and no other', () => {
    expect(charts).toHaveLength(33);
    const expected = new Set(charts.map((chart) => `${idOf(chart.brand)}:${chart.line}`));
    const held = new Set(
      shoeBrands.flatMap((each) => each.charts.map((chart) => `${each.id}:${chart.line}`)),
    );
    expect(held).toEqual(expected);
  });

  it('every cell is the brand’s own, as printed, and the foot only where the length is the foot’s', () => {
    for (const chart of charts) {
      const held = brand(idOf(chart.brand)).charts.find((each) => each.line === chart.line);
      expect(held, `${chart.brand} ${chart.line}`).toBeDefined();
      if (!held) continue;
      const rows = chart.rows.filter(
        (row) =>
          RECORD_KEYS.some(([key]) => cellOf(row, key) !== undefined) ||
          (chart.length.basis === 'foot' && typeof row['foot_mm'] === 'number'),
      );
      expect(held.rows, `${chart.brand} ${chart.line} rows`).toHaveLength(rows.length);
      rows.forEach((row, at) => {
        const own = held.rows[at]!;
        for (const [key, field] of RECORD_KEYS) {
          const cell = cellOf(row, key);
          const label = `${chart.brand} ${chart.line} row ${at} ${key}`;
          if (cell === undefined) expect(own[field], label).toBeUndefined();
          else if (typeof cell === 'number') expect(own[field], label).toBeCloseTo(cell, 4);
          else expect(own[field], label).toEqual(cell);
        }
        const foot = row['foot_mm'];
        if (chart.length.basis === 'foot' && typeof foot === 'number') {
          expect(own.foot, `${chart.brand} ${chart.line} row ${at} foot`).toBeCloseTo(foot, 2);
        } else expect(own.foot).toBeUndefined();
      });
      expect(held.basis).toBe(chart.length.basis);
    }
  });

  it('names twenty brands, each with charts of distinct lines, ids URL-safe, keys unique', () => {
    expect(shoeBrands).toHaveLength(20);
    const seen = new Map<string, string>();
    for (const each of shoeBrands) {
      expect(each.id).toMatch(/^[a-z0-9-]+$/);
      expect(each.charts.length).toBeGreaterThan(0);
      const lines = each.charts.map((chart) => chart.line);
      expect(new Set(lines).size).toBe(lines.length);
      if (lines.includes('unisex')) expect(lines).toEqual(['unisex']);
      // The name is a key itself, so no alias repeats it; a shorthand key may be the name (On).
      const own = each.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const key of [each.name, ...each.aliases, ...(each.shorthand ?? [])]) {
        const compact = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (compact === own && key !== each.name) {
          expect(each.shorthand, `"${key}" of ${each.id} repeats its name`).toContain(key);
          continue;
        }
        expect(seen.get(compact), `"${key}" of ${each.id}`).toBeUndefined();
        seen.set(compact, each.id);
      }
      for (const chart of each.charts) {
        expect(chart.source.length).toBeGreaterThan(0);
        expect(chart.read).toBe('2026-10-20');
      }
    }
  });

  it('answers a line with the women’s chart where the brand prints one, else its one chart', () => {
    expect(brandChart(brand('nike'), true).line).toBe('women');
    expect(brandChart(brand('nike'), false).line).toBe('men');
    expect(brandChart(brand('adidas'), true).line).toBe('unisex');
    expect(brandChart(brand('crocs'), false).line).toBe('unisex');
  });
});

describe('a brand read at the box (ADR 0028)', () => {
  it('a Nike US men’s 10 is its row: UK 9, EU 44, W 11.5, a 27.1 cm foot, JP 28 the box’s label', () => {
    const reading = readBrand(brand('nike'), unit('us-men'), 10);
    expect(reading.row?.foot).toBe(271);
    expect(reading.foot).toBe(271);
    expect(reading.beyond).toBeNull();
    expect(brandScale(reading, unit('uk'))).toMatchObject({ source: 'brand', value: 9 });
    expect(brandScale(reading, unit('eu'))).toMatchObject({ source: 'brand', value: 44 });
    expect(brandScale(reading, unit('us-women'))).toMatchObject({ source: 'brand', value: 11.5 });
    expect(brandScale(reading, unit('japan'))).toMatchObject({ source: 'brand', value: 28 });
    expect(brandScale(reading, unit('mondopoint'))).toMatchObject({ source: 'brand', value: 271 });
    expect(brandScale(reading, unit('foot-cm')).value).toBeCloseTo(27.1, 9);
  });

  it('a Nike women’s 8 reads the women’s page, another last: UK 5.5, EU 39, a 24.5 cm foot', () => {
    const reading = readBrand(brand('nike'), unit('us-women'), 8);
    expect(reading.chart.line).toBe('women');
    expect(reading.foot).toBe(245);
    expect(brandScale(reading, unit('uk')).value).toBe(5.5);
    expect(brandScale(reading, unit('eu')).value).toBe(39);
    expect(brandScale(reading, unit('us-men')).value).toBe(6.5);
  });

  it('reads the women’s chart on a scale that does not say the line when asked: a Nike EU 39 is the women’s 8', () => {
    expect(readBrand(brand('nike'), unit('eu'), 39, true)).toMatchObject({
      chart: { line: 'women' },
      foot: 245,
    });
    expect(readBrand(brand('nike'), unit('eu'), 39).chart.line).toBe('men');
  });

  it('a scale the chart lacks is ISO’s from the brand’s foot; none where the brand gives no foot', () => {
    const reebok = readBrand(brand('reebok'), unit('us-men'), 10);
    expect(reebok.foot).toBeCloseTo(271.78, 2);
    const eu = brandScale(reebok, unit('eu'));
    expect(eu.source).toBe('iso');
    expect(eu.value).toBeCloseTo(271.78 / 6.67 + 2, 2);
    expect(brandScale(reebok, unit('uk')).source).toBe('iso');
    const puma = readBrand(brand('puma'), unit('us-men'), 10);
    expect(puma.foot).toBeNull();
    expect(brandScale(puma, unit('eu'))).toMatchObject({ source: 'brand', value: 43 });
    expect(brandScale(puma, unit('mondopoint')).source).toBe('none');
    expect(brandScale(puma, unit('us-women')).source).toBe('none');
  });

  it('a length typed reads the nearest row where the length is the foot’s, ≈, and nothing where it is not', () => {
    const nike = readBrand(brand('nike'), unit('foot-cm'), 27);
    expect(nike.length).toBe(true);
    expect(nike.foot).toBe(270);
    expect(nike.row?.foot).toBe(271);
    expect(brandScale(nike, unit('us-men'))).toMatchObject({
      source: 'brand',
      value: 10,
      approx: true,
    });
    expect(brandScale(nike, unit('mondopoint'))).toMatchObject({ source: 'length', value: 270 });
    const puma = readBrand(brand('puma'), unit('foot-cm'), 27);
    expect(puma.row).toBeNull();
    expect(puma.foot).toBe(270);
    expect(brandScale(puma, unit('us-men')).source).toBe('none');
  });

  it('a size off the chart says the chart’s span; a children’s size answers nothing', () => {
    expect(readBrand(brand('nike'), unit('us-men'), 25).beyond).toEqual([3.5, 22]);
    const kids = readBrand(brand('nike'), unit('us-children'), 8);
    expect(kids.row).toBeNull();
    expect(kids.beyond).toBeNull();
    expect(kids.foot).toBeNull();
  });

  it('a range is read as printed: a Birkenstock EU 42 is US men’s 9 to 9.5', () => {
    const reading = readBrand(brand('birkenstock'), unit('eu'), 42);
    expect(brandScale(reading, unit('us-men'))).toMatchObject({ value: 9, range: [9, 9.5] });
    expect(readBrand(brand('birkenstock'), unit('us-men'), 9.5).row).toBe(reading.row);
  });
});

describe('every brand at one foot (ADR 0028)', () => {
  const at = (foot: number, scale: 'us-men' | 'us-women' | 'uk' | 'eu' | 'japan', women = false) =>
    new Map(brandsAtFoot(foot, scale, women).map((row) => [row.brand.id, row]));

  it('a Nike 10’s foot is adidas 10, New Balance ≈ 9, Asics ≈ 9, Converse ≈ 8.5, by their charts', () => {
    const rows = at(271, 'us-men');
    expect(rows.get('adidas')).toMatchObject({ value: 10, approx: false, foot: 271 });
    expect(rows.get('new-balance')).toMatchObject({ value: 9, approx: true, foot: 270 });
    expect(rows.get('asics')).toMatchObject({ value: 9, foot: 270 });
    expect(rows.get('vans')).toMatchObject({ value: 9 });
    expect(rows.get('converse')).toMatchObject({ value: 8.5, foot: 270 });
    expect(rows.get('reebok')).toMatchObject({ value: 10 });
    expect(rows.get('birkenstock')).toMatchObject({ value: 9, range: [9, 9.5] });
    expect(rows.get('nike')).toMatchObject({ value: 10, approx: false });
  });

  it('a 27 cm foot is Asics 9 exactly and Nike ≈ 10', () => {
    const rows = at(270, 'us-men');
    expect(rows.get('asics')).toMatchObject({ value: 9, approx: false });
    expect(rows.get('nike')).toMatchObject({ value: 10, approx: true });
  });

  it('a tie between two rows goes to the longer foot, as brands advise sizing up', () => {
    // Dr. Martens prints whole centimetres: 28.5 cm sits between its 28 (US 10) and 29 (US 11).
    expect(at(285, 'us-men').get('dr-martens')).toMatchObject({ value: 11, foot: 290 });
  });

  it('says why a brand has no size: no foot length, no such scale, or a foot off its chart', () => {
    const rows = at(271, 'us-men');
    for (const id of ['puma', 'on', 'skechers', 'brooks']) {
      expect(rows.get(id), id).toMatchObject({ value: null, why: 'no-length' });
    }
    expect(at(271, 'eu').get('reebok')).toMatchObject({ value: null, why: 'no-scale' });
    expect(at(150, 'us-men').get('nike')).toMatchObject({ value: null, why: 'off-chart' });
    expect(at(150, 'us-men').get('adidas')).toMatchObject({ value: null, why: 'off-chart' });
  });

  it('a women’s size reads the women’s charts and the unisex charts’ women’s column', () => {
    const rows = at(245, 'us-women', true);
    expect(rows.get('nike')?.chart.line).toBe('women');
    expect(rows.get('nike')).toMatchObject({ value: 8, foot: 245 });
    expect(rows.get('crocs')?.chart.line).toBe('unisex');
    expect(rows.get('crocs')?.value).toBeGreaterThan(0);
  });
});

describe('a brand typed with the size (ADR 0028)', () => {
  it('reads a brand from either end of a query, the longest name first', () => {
    expect(splitShoeBrand('nike 10')).toMatchObject({ rest: '10', brand: { id: 'nike' } });
    expect(splitShoeBrand('10 nike')).toMatchObject({ rest: '10', brand: { id: 'nike' } });
    expect(splitShoeBrand('eu 43 new balance')).toMatchObject({
      rest: 'eu 43',
      brand: { id: 'new-balance' },
    });
    expect(splitShoeBrand('nike women 8')).toMatchObject({
      rest: 'women 8',
      brand: { id: 'nike' },
    });
    expect(splitShoeBrand('Dr. Martens 10')).toMatchObject({
      rest: '10',
      brand: { id: 'dr-martens' },
    });
    expect(splitShoeBrand('chuck taylors')).toMatchObject({ rest: '', brand: { id: 'converse' } });
    expect(splitShoeBrand('xyz 10')).toBeNull();
    expect(splitShoeBrand('')).toBeNull();
  });

  it('a shorthand key counts only where the category is named: "on", "nb", "ua", "docs"', () => {
    expect(splitShoeBrand('on 10')).toBeNull();
    expect(splitShoeBrand('on 10', true)).toMatchObject({ rest: '10', brand: { id: 'on' } });
    expect(splitShoeBrand('nb 9', true)?.brand.id).toBe('new-balance');
    expect(splitShoeBrand('docs 10', true)?.brand.id).toBe('dr-martens');
    expect(splitShoeBrand('ua 10')).toBeNull();
    expect(matchShoeBrands('on')).toEqual([]);
    expect(matchShoeBrands('on', true)[0]?.brand.id).toBe('on');
  });

  it('matches brands by name as units are matched: exactly, from the start, then inside', () => {
    expect(matchShoeBrands('nik')[0]).toMatchObject({ brand: { id: 'nike' }, matchClass: 3 });
    expect(matchShoeBrands('nike')[0]).toMatchObject({ matchClass: 2 });
    expect(matchShoeBrands('new')[0]?.brand.id).toBe('new-balance');
    expect(matchShoeBrands('balance')[0]).toMatchObject({
      brand: { id: 'new-balance' },
      matchClass: 5,
    });
    expect(matchShoeBrands('ba')).toEqual([]);
    expect(matchShoeBrands('')).toEqual([]);
  });
});

describe('the foot’s own row and Japan’s label (ADR 0028)', () => {
  it('"cm" is the foot’s length in Shoe size, a tenth of Mondopoint; Japan’s symbol is JP', () => {
    expect(unitsIn('shoe-size').map((each) => each.id)).toContain('foot-cm');
    expect(unitsIn('shoe-size')).toHaveLength(10);
    expect(convert(27, 'foot-cm', 'mondopoint')).toBe(270);
    expect(convert(271, 'mondopoint', 'foot-cm')).toBeCloseTo(27.1, 9);
    expect(unit('japan').symbol).toBe('JP');
    expect(unit('foot-cm').symbol).toBe('cm');
    expect(search('cm', { prefer: 'shoe-size' }).results[0]).toMatchObject({
      unit: { id: 'foot-cm' },
    });
    expect(search('cm').results[0]).toMatchObject({ unit: { id: 'centimeter' } });
  });
});
