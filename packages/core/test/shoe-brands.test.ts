import { describe, expect, it } from 'vitest';
// The file core is given (ADR 0029), and the record it is written from
// (docs/research/shoe-sizes-2/brands.py), both read whole.
import chartsFile from '../data/shoe-brands.json';
import recordFile from '../../../docs/research/shoe-sizes-2/brands.json';
import {
  BRAND_CHARTS_SCHEMA,
  brandCell,
  brandChart,
  brandRowAt,
  brandChartsOf,
  brandsAtFoot,
  chartAtFoot,
  footOfRow,
  kidsChart,
  otherBrandCharts,
  twinScale,
  convert,
  getShoeBrand,
  getUnit,
  matchShoeBrands,
  otherBrandChart,
  ownScale,
  readBrand,
  setBrandCharts,
  shoeBrands,
  splitShoeBrand,
  unitsIn,
} from '../src/index';
import type { BrandChartRow, BrandChartsFile, BrandScale, ShoeBrand, Unit } from '../src/index';

setBrandCharts(chartsFile as unknown as BrandChartsFile);

interface RecordRow {
  [key: string]: number | string | boolean | Record<string, string> | undefined;
}
interface RecordChart {
  brand: string;
  line: 'men' | 'women' | 'unisex' | 'kids';
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

/**
 * A record cell as core holds it: a range's two ends, adidas's JP in millimetres as centimetres.
 */
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
  // A kids' chart's children's rows (ADR 0031); an adults' page's kids column (Nike's youth labels
  // beside its men's sizes) stays in the record and never reaches the product.
  ['us_kids', 'usKids'],
  ['uk_kids', 'ukKids'],
  ['eu_kids', 'euKids'],
];
const KIDS_KEYS: ReadonlySet<string> = new Set(['us_kids', 'uk_kids', 'eu_kids']);

/** The record keys a chart's cells are held to: the children's ones on a kids' chart alone. */
function keysOf(chart: RecordChart): readonly [string, keyof BrandChartRow][] {
  return RECORD_KEYS.filter(([key]) => chart.line === 'kids' || !KIDS_KEYS.has(key));
}

describe('the brands’ charts (ADR 0028): core holds the record cell for cell', () => {
  const record = recordFile as unknown as { charts: RecordChart[] };
  const charts = record.charts.filter((chart) => chart.product);

  it('is given the file, named by its schema and the date read', () => {
    expect(chartsFile.schema).toBe(BRAND_CHARTS_SCHEMA);
    expect(chartsFile.read).toBe('2026-10-21');
    expect(Object.keys(chartsFile.charts)).toHaveLength(20);
  });

  it('carries every product chart of the record, and no other', () => {
    // 34 adults' charts and a kids' chart at every brand but Brooks (ADR 0031).
    expect(charts).toHaveLength(53);
    const expected = new Set(charts.map((chart) => `${idOf(chart.brand)}:${chart.line}`));
    const held = new Set(
      shoeBrands.flatMap((each) =>
        brandChartsOf(each.id).map((chart) => `${each.id}:${chart.line}`),
      ),
    );
    expect(held).toEqual(expected);
  });

  it('every cell is the brand’s own, as printed, and the foot only where the length is the foot’s', () => {
    for (const chart of charts) {
      const held = brandChartsOf(idOf(chart.brand)).find((each) => each.line === chart.line);
      expect(held, `${chart.brand} ${chart.line}`).toBeDefined();
      if (!held) continue;
      const keys = keysOf(chart);
      const rows = chart.rows.filter(
        (row) =>
          keys.some(([key]) => cellOf(row, key) !== undefined) ||
          (chart.length.basis === 'foot' && typeof row['foot_mm'] === 'number'),
      );
      expect(held.rows, `${chart.brand} ${chart.line} rows`).toHaveLength(rows.length);
      rows.forEach((row, at) => {
        const own = held.rows[at]!;
        for (const [key, field] of keys) {
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
      expect(brandChartsOf(each.id).length).toBeGreaterThan(0);
      const lines = brandChartsOf(each.id).map((chart) => chart.line);
      expect(new Set(lines).size).toBe(lines.length);
      const adults = lines.filter((line) => line !== 'kids');
      if (adults.includes('unisex')) expect(adults).toEqual(['unisex']);
      // A kids' chart at every brand but Brooks, after the adults' (ADR 0031).
      expect(lines.includes('kids'), each.id).toBe(each.id !== 'brooks');
      if (lines.includes('kids')) expect(lines.at(-1)).toBe('kids');
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
      for (const chart of brandChartsOf(each.id)) {
        expect(chart.source.length).toBeGreaterThan(0);
        expect(chart.read).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('answers a line with the women’s chart where the brand prints one, else its one chart', () => {
    expect(brandChart(brand('nike'), true).line).toBe('women');
    expect(brandChart(brand('nike'), false).line).toBe('men');
    expect(brandChart(brand('adidas'), true).line).toBe('unisex');
    expect(brandChart(brand('crocs'), false).line).toBe('unisex');
  });

  it('names the chart for the other line where a brand prints its lines apart, none for one chart for everyone', () => {
    const asics = brand('asics');
    expect(otherBrandChart(asics, brandChart(asics, false))?.line).toBe('women');
    expect(otherBrandChart(asics, brandChart(asics, true))?.line).toBe('men');
    expect(otherBrandChart(brand('adidas'), brandChart(brand('adidas'), false))).toBeNull();
  });

  it('reads one chart at a foot on a scale, the nearest row, ≈ where its foot is not the foot: Asics’ men’s 6.5 at a women’s 8’s 24 cm by its rule, HOKA’s 7.5 at 25.1 cm for a 25.2 cm foot, and nothing more than half a step below its first row', () => {
    // Asics's CM column is its label, the foot a centimetre less (ADR 0030): its women's 8, CM
    // 25, is a 24 cm foot, the men's 6.5.
    const asics = brand('asics');
    expect(chartAtFoot(asics, brandChart(asics, false), 240, 'us-men', false)).toMatchObject({
      value: 6.5,
      foot: 240,
      approx: false,
      why: null,
    });
    const hoka = brand('hoka');
    expect(chartAtFoot(hoka, brandChart(hoka, false), 252, 'us-men', false)).toMatchObject({
      value: 7.5,
      foot: 251,
      approx: true,
    });
    // A 22.4 cm foot is more than half a step below the men's first row, 23 cm: off the chart,
    // as a shoe fits a foot half a step either way (ADR 0027).
    expect(chartAtFoot(hoka, brandChart(hoka, false), 224, 'us-men', false)).toMatchObject({
      value: null,
      why: 'off-chart',
    });
    // Puma prints no length: ISO's label for the foot read through its own row (tier 4), with ≈.
    const puma = brand('puma');
    expect(chartAtFoot(puma, brandChart(puma, false), 250, 'us-men', false)).toMatchObject({
      tier: 4,
      foot: null,
      approx: true,
      why: null,
    });
  });
});

describe('a brand read at the box (ADR 0028)', () => {
  it('a Nike US men’s 10 is its row: UK 9, EU 44, W 11.5, a 27.1 cm foot, JP 28 the box’s label', () => {
    const reading = readBrand(brand('nike'), unit('us-men'), 10);
    expect(reading.row?.foot).toBe(271);
    expect(reading.foot).toBe(271);
    expect(reading.beyond).toBeNull();
    const row = reading.row!;
    expect(brandCell(row, 'uk', false)).toMatchObject({ value: 9 });
    expect(brandCell(row, 'eu', false)).toMatchObject({ value: 44 });
    expect(brandCell(row, 'us-women', false)).toMatchObject({ value: 11.5 });
    expect(brandCell(row, 'japan', false)).toMatchObject({ value: 28 });
    expect(convert(reading.foot!, 'mondopoint', 'foot-cm')).toBeCloseTo(27.1, 9);
  });

  it('a Nike women’s 8 reads the women’s page, another last: UK 5.5, EU 39, a 24.5 cm foot', () => {
    const reading = readBrand(brand('nike'), unit('us-women'), 8);
    expect(reading.chart.line).toBe('women');
    expect(reading.foot).toBe(245);
    const row = reading.row!;
    expect(brandCell(row, 'uk', true)?.value).toBe(5.5);
    expect(brandCell(row, 'eu', true)?.value).toBe(39);
    expect(brandCell(row, 'us-men', true)?.value).toBe(6.5);
  });

  it('reads the women’s chart on a scale that does not say the line when asked: a Nike EU 39 is the women’s 8', () => {
    expect(readBrand(brand('nike'), unit('eu'), 39, true)).toMatchObject({
      chart: { line: 'women' },
      foot: 245,
    });
    expect(readBrand(brand('nike'), unit('eu'), 39).chart.line).toBe('men');
  });

  it('a chart’s cells on the scales it prints, Reebok’s UK and EU its Australian guide’s joined on the US size (ADR 0030); a brand with no foot length has cells and no foot', () => {
    const reebok = readBrand(brand('reebok'), unit('us-men'), 10);
    expect(reebok.foot).toBeCloseTo(271.78, 2);
    expect(brandCell(reebok.row!, 'eu', false)).toMatchObject({ value: 43 });
    expect(brandCell(reebok.row!, 'uk', false)).toMatchObject({ value: 9 });
    const puma = readBrand(brand('puma'), unit('us-men'), 10);
    expect(puma.foot).toBeNull();
    expect(brandCell(puma.row!, 'eu', false)).toMatchObject({ value: 43 });
    expect(brandCell(puma.row!, 'us-women', false)).toBeNull();
  });

  it('a length typed reads the nearest row where the length is the foot’s, ≈, and nothing where it is not', () => {
    const nike = readBrand(brand('nike'), unit('foot-cm'), 27);
    expect(nike.length).toBe(true);
    expect(nike.foot).toBe(270);
    expect(nike.row?.foot).toBe(271);
    expect(brandCell(nike.row!, 'us-men', false)).toMatchObject({ value: 10 });
    expect(Math.abs(nike.row!.foot! - nike.foot!)).toBeGreaterThan(0.5);
    const puma = readBrand(brand('puma'), unit('foot-cm'), 27);
    expect(puma.row).toBeNull();
    expect(puma.foot).toBe(270);
  });

  it('a size off the chart says the chart’s span; a children’s size answers nothing where the brand prints no kids’ chart', () => {
    expect(readBrand(brand('nike'), unit('us-men'), 25).beyond).toEqual([3.5, 22]);
    const brooks = readBrand(brand('brooks'), unit('us-children'), 8);
    expect(brooks.row).toBeNull();
    expect(brooks.beyond).toBeNull();
    expect(brooks.foot).toBeNull();
    expect(brooks.chart.line).toBe('men');
  });

  it('the kids’ chart answers a children’s size, a youth size the adults’ chart lacks, a size on a children’s scale’s twin, and a length off the adults’ chart (ADR 0031)', () => {
    const nike = brand('nike');
    // An 8C on Nike's Babies & Toddlers band: a 15 cm foot, tier 1, the kids' chart answering.
    const eightC = readBrand(nike, unit('us-children'), 8);
    expect(eightC.chart.line).toBe('kids');
    expect(eightC).toMatchObject({ foot: 150, tier: 1, beyond: null });
    expect(brandCell(eightC.row!, 'uk-children', false)).toMatchObject({ value: 7.5 });
    expect(brandCell(eightC.row!, 'eu-children', false)).toMatchObject({ value: 25 });
    expect(brandCell(eightC.row!, 'us-men', false)).toBeNull();
    // Past the children's scale: the kids' chart's span on it.
    expect(readBrand(nike, unit('us-children'), 20).beyond).toEqual([1, 13.5]);
    // A men's 3 is off Nike's men's chart (3.5 up) and its 3Y: a 21.8 cm foot, on the youth row.
    const threeY = readBrand(nike, unit('us-men'), 3);
    expect(threeY.chart.line).toBe('kids');
    expect(threeY).toMatchObject({ foot: 218, tier: 1 });
    expect(brandCell(threeY.row!, 'us-women', false)).toMatchObject({ value: 4.5 });
    // A men's 4 is on the men's chart, which answers first.
    expect(readBrand(nike, unit('us-men'), 4).chart.line).toBe('men');
    // An EU 28 is off the men's chart and on the kids' as the children's EU 28, its 11C.
    const eu28 = readBrand(nike, unit('eu'), 28);
    expect(eu28.chart.line).toBe('kids');
    expect(brandCell(eu28.row!, 'us-children', false)).toMatchObject({ value: 11 });
    // Nike's Little Kids band's inches are its foot (ADR 0030's grid test): 11C is 6.94 in.
    expect(eu28.foot).toBeCloseTo(176.21, 2);
    // A 15 cm foot typed: off the men's chart, the kids' row nearest it.
    const length = readBrand(nike, unit('foot-cm'), 15);
    expect(length.chart.line).toBe('kids');
    expect(length).toMatchObject({ length: true, foot: 150, tier: 1 });
    expect(brandCell(length.row!, 'us-children', false)).toMatchObject({ value: 8 });
    expect(readBrand(brand('brooks'), unit('foot-cm'), 15).row).toBeNull();
    // Asics's kids' CM column is its label, read less a centimetre by its rule (tier 2).
    const asics = readBrand(brand('asics'), unit('us-children'), 10);
    expect(asics.chart.line).toBe('kids');
    expect(asics).toMatchObject({ foot: 160, tier: 2 });
    // The twin scales, and the kids' chart's own order.
    expect(twinScale('us-men')).toBe('us-children');
    expect(twinScale('eu-children')).toBe('eu');
    expect(twinScale('us-women')).toBeNull();
    expect(ownScale(kidsChart(nike)!, false)).toBe('us-children');
    expect(otherBrandCharts(nike, brandChart(nike, false)).map((chart) => chart.line)).toEqual([
      'women',
      'kids',
    ]);
    expect(otherBrandCharts(nike, kidsChart(nike)!).map((chart) => chart.line)).toEqual([
      'men',
      'women',
    ]);
    expect(kidsChart(brand('brooks'))).toBeNull();
  });

  it('a range is read as printed: a Birkenstock EU 42 is US men’s 9 to 9.5', () => {
    const reading = readBrand(brand('birkenstock'), unit('eu'), 42);
    expect(brandCell(reading.row!, 'us-men', false)).toMatchObject({ value: 9, range: [9, 9.5] });
    expect(readBrand(brand('birkenstock'), unit('us-men'), 9.5).row).toBe(reading.row);
  });
});

describe('every brand at one foot (ADR 0028)', () => {
  const at = (foot: number, scale: BrandScale, women = false) =>
    new Map(brandsAtFoot(foot, scale, women).map((row) => [row.brand.id, row]));

  it('a Nike 10’s foot is adidas 10 and Converse ≈ 8.5 by their charts, New Balance and Vans 10 by ISO’s label, Asics 10 by its rule (ADR 0030)', () => {
    const rows = at(271, 'us-men');
    expect(rows.get('adidas')).toMatchObject({ value: 10, approx: false, foot: 271 });
    expect(rows.get('new-balance')).toMatchObject({ value: 10, approx: true, foot: null, tier: 4 });
    expect(rows.get('asics')).toMatchObject({ value: 10, foot: 270, tier: 2 });
    expect(rows.get('vans')).toMatchObject({ value: 10, tier: 4 });
    expect(rows.get('converse')).toMatchObject({ value: 8.5, foot: 270 });
    expect(rows.get('reebok')).toMatchObject({ value: 10 });
    expect(rows.get('birkenstock')).toMatchObject({ value: 9, range: [9, 9.5] });
    expect(rows.get('nike')).toMatchObject({ value: 10, approx: false });
  });

  it('a 27 cm foot is Asics 10 exactly, by its rule (CM 28 less a centimetre), and Nike ≈ 10', () => {
    const rows = at(270, 'us-men');
    expect(rows.get('asics')).toMatchObject({ value: 10, approx: false, tier: 2 });
    expect(rows.get('nike')).toMatchObject({ value: 10, approx: true });
  });

  it('a tie between two rows goes to the longer foot, as brands advise sizing up', () => {
    // Dr. Martens prints whole centimetres: 28.5 cm sits between its 28 (US 10) and 29 (US 11).
    expect(at(285, 'us-men').get('dr-martens')).toMatchObject({ value: 11, foot: 290 });
  });

  it('fills a gap by the tiers (docs/RESEARCH.md §9; ADR 0030): On by its own rule, Skechers, Puma, New Balance, Under Armour, and Vans by ISO’s label through their own rows, Brooks and Reebok by their other pages’ columns, and a foot off a chart a dash', () => {
    const rows = at(271, 'us-men');
    expect(rows.get('on')).toMatchObject({
      value: 10,
      tier: 2,
      foot: 270,
      approx: true,
      scale: 'us-men',
    });
    for (const id of ['skechers', 'puma', 'new-balance', 'under-armour', 'vans']) {
      expect(rows.get(id), id).toMatchObject({
        value: 10,
        tier: 4,
        foot: null,
        approx: true,
        scale: 'us-men',
      });
    }
    // Brooks' UK page gives the foot: 271 mm is its 10.5 (27.09 cm), tier 1, no ≈.
    expect(rows.get('brooks')).toMatchObject({ value: 10.5, tier: 1, foot: 270.9, approx: false });
    // Reebok's AU page gives UK and EU: a 271 mm foot is its 10 (10.7 in), EU 43 there.
    expect(at(271, 'eu').get('reebok')).toMatchObject({
      value: 43,
      scale: 'eu',
      tier: 1,
      why: null,
    });
    expect(at(271, 'eu').get('brooks')).toMatchObject({ value: 44.5, tier: 1, scale: 'eu' });
    // A child's foot is off every adults' chart; the kids' charts answer on the children's US,
    // the twin of the scale asked (ADR 0031), Brooks printing none.
    expect(at(150, 'us-men').get('nike')).toMatchObject({
      value: 8,
      scale: 'us-children',
      tier: 1,
      approx: false,
    });
    expect(at(150, 'us-men').get('nike')!.chart.line).toBe('kids');
    expect(at(150, 'us-men').get('adidas')).toMatchObject({
      value: 8.5,
      scale: 'us-children',
      approx: true,
    });
    expect(at(150, 'us-men').get('brooks')).toMatchObject({ value: null, why: 'off-chart' });
    // A kids' chart with no foot length: ISO's children's label through its own row (tier 4).
    expect(at(150, 'us-children').get('puma')).toMatchObject({
      value: 8,
      scale: 'us-children',
      tier: 4,
      approx: true,
    });
    expect(at(150, 'us-children').get('new-balance')).toMatchObject({ value: 8, tier: 4 });
    // A youth's foot is on the adults' charts where they reach it, which answer first (Nike's
    // men's chart starts at 3.5); where they do not (HOKA's at 7), the kids' chart's youth row.
    expect(at(220, 'us-men').get('nike')!.chart.line).toBe('men');
    expect(at(220, 'us-men').get('hoka')).toMatchObject({ value: 3.5, scale: 'us-men', tier: 1 });
    expect(at(220, 'us-men').get('hoka')!.chart.line).toBe('kids');
    const reebok = brand('reebok');
    expect(ownScale(brandChart(reebok, false), false)).toBe('us-men');
    expect(ownScale(brandChart(reebok, true), true)).toBe('us-women');
    const on = brand('on');
    const row = brandRowAt(brandChart(on, false), 'us-men', 10, false)!;
    expect(footOfRow(on, brandChart(on, false), row)).toBe(270);
  });

  it('reads a size at a brand by the tiers: On’s 10 is a 27 cm foot by its own rule, Brooks’ 10 a 26.67 cm foot by its UK page, Skechers’ 10 ISO’s label, and a length at Puma finds no row', () => {
    const on = readBrand(brand('on'), unit('us-men'), 10);
    expect(on).toMatchObject({ foot: 270, tier: 2 });
    expect(readBrand(brand('on'), unit('foot-cm'), 27).row).toBe(on.row);
    expect(readBrand(brand('brooks'), unit('us-men'), 10)).toMatchObject({ foot: 266.7, tier: 1 });
    expect(readBrand(brand('skechers'), unit('us-men'), 10)).toMatchObject({ foot: null, tier: 4 });
    expect(readBrand(brand('puma'), unit('foot-cm'), 27)).toMatchObject({ row: null, tier: null });
    expect(readBrand(brand('nike'), unit('us-men'), 10).tier).toBe(1);
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

  it('matches brands by name as units are matched: exactly, from the start, then inside, and never by a typo', () => {
    // No fuzzy match for brands (docs/UX-SPEC.md §4): a typo matches nothing, at either end.
    expect(matchShoeBrands('nkie')).toEqual([]);
    expect(splitShoeBrand('nkie 10')).toBeNull();
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
  });
});
