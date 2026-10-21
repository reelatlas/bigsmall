import { fromBase, toBase } from './convert';
import { roundToStep } from './rounded';
import { compactKey } from './normalize';
import type { MatchClass } from './search';
import type { Unit } from './types';
import { getUnit } from './units';
import { shoeBrands, type ShoeBrand } from './units/shoe-brands';
import {
  brandChartsOf,
  hasBrandCharts,
  setBrandCharts,
  BRAND_CHARTS_SCHEMA,
  type BrandChart,
  type BrandChartRow,
  type BrandChartsFile,
  type BrandLine,
  type LengthBasis,
} from './units/shoe-brand-charts';

/**
 * The brands' shoe-size charts (ADR 0028; docs/research/shoe-sizes-2.md): a brand joins the box
 * beside the unit, as Cooking's ingredient does, and its own chart answers the scale rows, while
 * every brand's row reads its chart at the same foot. Pure, as the rest of core: the lookups here,
 * the words and the rows in the web app.
 */

export { shoeBrands, setBrandCharts, hasBrandCharts, brandChartsOf, BRAND_CHARTS_SCHEMA };
export type { ShoeBrand, BrandChart, BrandChartRow, BrandChartsFile, BrandLine, LengthBasis };

const byId: ReadonlyMap<string, ShoeBrand> = new Map(shoeBrands.map((each) => [each.id, each]));

interface Keyed {
  brand: ShoeBrand;
  shorthand: boolean;
}

/** Every key a brand answers to, compact, and whether it is a shorthand key. */
const byKey: ReadonlyMap<string, Keyed> = new Map(
  shoeBrands.flatMap((each): [string, Keyed][] => [
    ...[each.name, ...each.aliases].map((key): [string, Keyed] => [
      compactKey(key),
      { brand: each, shorthand: false },
    ]),
    ...(each.shorthand ?? []).map((key): [string, Keyed] => [
      compactKey(key),
      { brand: each, shorthand: true },
    ]),
  ]),
);

export function getShoeBrand(id: string): ShoeBrand | undefined {
  return byId.get(id);
}

/** The scales a brand's chart can print, by the unit's id. */
export type BrandScale = 'us-men' | 'us-women' | 'uk' | 'eu' | 'japan';

export const BRAND_SCALES: readonly BrandScale[] = ['us-men', 'us-women', 'uk', 'eu', 'japan'];

/** The dash between a range's two ends as a row writes it ("9–9.5"), which a split finds. */
export const RANGE_DASH = '–';

/** The scale a bare size at a brand means ("nike 10"), as a bare "us" is men's (ADR 0027). */
export const BRAND_DEFAULT_SCALE: BrandScale = 'us-men';

/**
 * The units that hold a foot's length, which a brand's chart answers where its length is the
 * foot's.
 */
const LENGTH_UNITS: ReadonlySet<string> = new Set(['mondopoint', 'foot-cm']);

export function isBrandScale(id: string): id is BrandScale {
  return (BRAND_SCALES as readonly string[]).includes(id);
}

const FIELD: Record<BrandScale, 'usMen' | 'usWomen' | 'uk' | 'eu' | 'jp'> = {
  'us-men': 'usMen',
  'us-women': 'usWomen',
  uk: 'uk',
  eu: 'eu',
  japan: 'jp',
};

/** A brand matching a typed query, ranked as units and ingredients are (search.ts, cooking.ts). */
export interface BrandMatch {
  kind: 'brand';
  brand: ShoeBrand;
  /** 2 an exact name or alias, 3 the start of one, 5 inside one. */
  matchClass: MatchClass;
}

/**
 * Brands for a typed query, strongest first, then in the data's order: an exact name or alias,
 * then the start of one, then, from three letters on, one that holds it. A shorthand key ("nb",
 * "on") matches exactly and only where the category is named (`named`), as a unit's does.
 */
export function matchShoeBrands(query: string, named = false, limit = 8): BrandMatch[] {
  const target = compactKey(query);
  if (!target) return [];
  const found: BrandMatch[] = [];
  for (const brand of shoeBrands) {
    let best: BrandMatch | null = null;
    // A key that is a shorthand key, the name itself for On, matches exactly, and only when named.
    const short = new Set((brand.shorthand ?? []).map(compactKey));
    for (const key of [brand.name, ...brand.aliases, ...(brand.shorthand ?? [])]) {
      const compact = compactKey(key);
      const shorthand = short.has(compact);
      if (shorthand && !named) continue;
      const matchClass: MatchClass | null =
        compact === target
          ? 2
          : shorthand
            ? null
            : compact.startsWith(target)
              ? 3
              : target.length >= 3 && compact.includes(target)
                ? 5
                : null;
      if (matchClass !== null && (!best || matchClass < best.matchClass)) {
        best = { kind: 'brand', brand, matchClass };
      }
    }
    if (best) found.push(best);
  }
  return found
    .map((match, index) => ({ match, index }))
    .sort((a, b) => a.match.matchClass - b.match.matchClass || a.index - b.index)
    .slice(0, limit)
    .map(({ match }) => match);
}

/**
 * A brand named exactly by a query's first words or its last, and the rest of the query: "nike
 * 10" and "10 nike" are Nike and "10", "eu 43 new balance" is New Balance and "eu 43". The
 * longest name that fits wins; a shorthand key counts only where the category is named
 * (`named`). Null when neither end names a brand.
 */
export function splitShoeBrand(
  query: string,
  named = false,
): { rest: string; brand: ShoeBrand } | null {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const found = (text: string) => {
    const hit = byKey.get(compactKey(text));
    return hit && (named || !hit.shorthand) ? hit.brand : null;
  };
  // The start, the longest run first, then the end, the longest run first.
  for (let end = words.length; end > 0; end -= 1) {
    const brand = found(words.slice(0, end).join(' '));
    if (brand) return { rest: words.slice(end).join(' '), brand };
  }
  for (let start = 0; start < words.length; start += 1) {
    const brand = found(words.slice(start).join(' '));
    if (brand) return { rest: words.slice(0, start).join(' '), brand };
  }
  return null;
}

/**
 * The chart a brand answers with: the women's where it prints one and the size is women's, else
 * the men's, else its one chart for everyone; from the charts core was given (ADR 0029), so asked
 * before, it throws.
 */
export function brandChart(brand: ShoeBrand, women: boolean): BrandChart {
  const line: BrandLine = women ? 'women' : 'men';
  const charts = brandChartsOf(brand.id);
  const chart =
    charts.find((each) => each.line === line) ??
    charts.find((each) => each.line === 'unisex') ??
    charts[0];
  if (!chart) throw new Error(`${brand.name} has no chart`);
  return chart;
}

/**
 * The brand's chart for the other line, where it prints its lines apart: the women's beside the
 * men's and the men's beside the women's; null for a brand with one chart for everyone, or with
 * no chart for the other line.
 */
export function otherBrandChart(brand: ShoeBrand, chart: BrandChart): BrandChart | null {
  const line: BrandLine | null =
    chart.line === 'men' ? 'women' : chart.line === 'women' ? 'men' : null;
  if (line === null) return null;
  return brandChartsOf(brand.id).find((each) => each.line === line) ?? null;
}

/** A row's size on a scale: the size, with the two ends where the brand prints a range. */
export interface BrandCell {
  /** The size; a range's lower end. */
  value: number;
  range?: readonly [number, number] | undefined;
}

/**
 * A chart's cell on a scale, as the brand prints it; the British women's where the chart prints
 * men's and women's UK apart (Crocs) and the size is women's. Null where the row prints none.
 */
export function brandCell(row: BrandChartRow, scale: BrandScale, women: boolean): BrandCell | null {
  const cell =
    scale === 'uk' && women && row.ukWomen !== undefined ? row.ukWomen : row[FIELD[scale]];
  if (cell === undefined) return null;
  return typeof cell === 'number' ? { value: cell } : { value: cell[0], range: cell };
}

/** The row whose cell on the scale is the size, a range holding it where the brand prints one. */
export function brandRowAt(
  chart: BrandChart,
  scale: BrandScale,
  size: number,
  women: boolean,
): BrandChartRow | null {
  for (const row of chart.rows) {
    const cell = brandCell(row, scale, women);
    if (!cell) continue;
    if (cell.range) {
      if (size >= cell.range[0] - 1e-9 && size <= cell.range[1] + 1e-9) return row;
    } else if (Math.abs(cell.value - size) < 1e-9) return row;
  }
  return null;
}

/** The lowest and highest size a chart prints on a scale, or null where it prints none. */
export function brandSpan(
  chart: BrandChart,
  scale: BrandScale,
  women: boolean,
): readonly [number, number] | null {
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const row of chart.rows) {
    const cell = brandCell(row, scale, women);
    if (!cell) continue;
    low = Math.min(low, cell.value);
    high = Math.max(high, cell.range ? cell.range[1] : cell.value);
  }
  return low <= high ? [low, high] : null;
}

/**
 * How a brand's figure was found where its chart alone could not give it (docs/RESEARCH.md §9):
 * 1 its own foot length as printed, 2 its own stated rule applied (On's Japan label less a
 * centimetre), 4 ISO's label on its own scale read through its own row (a brand printing no
 * length). Tier 3, a pattern in the record, and tier 5, third-party measurements, are not read
 * yet.
 */
export type BrandTier = 1 | 2 | 4;

/**
 * The foot a row stands for: the brand's own, as printed (tier 1), or by the brand's own rule
 * from its Japan label (tier 2); none where the brand gives neither.
 */
export function footOfRow(
  brand: ShoeBrand,
  chart: BrandChart,
  row: BrandChartRow,
): number | undefined {
  if (chart.basis === 'foot') return row.foot;
  if (chart.basis === 'label' && brand.labelMinusCm !== undefined && row.jp !== undefined) {
    return (row.jp - brand.labelMinusCm) * 10;
  }
  return undefined;
}

/** The feet a chart gives, as printed or by the brand's rule, in its rows' order, with each row. */
function feetOf(brand: ShoeBrand, chart: BrandChart): { foot: number; row: BrandChartRow }[] {
  return chart.rows.flatMap((row) => {
    const foot = footOfRow(brand, chart, row);
    return foot === undefined ? [] : [{ foot, row }];
  });
}

/**
 * The scale a chart's own sizes are read on first: its US column for the line, else the first
 * scale it prints; what a brand's row shows where the chart lacks the scale in focus, and the
 * scale ISO's label is taken on for a brand that gives no foot length (tier 4).
 */
export function ownScale(chart: BrandChart, women: boolean): BrandScale | null {
  const order: readonly BrandScale[] = women
    ? ['us-women', 'uk', 'eu', 'us-men', 'japan']
    : ['us-men', 'uk', 'eu', 'us-women', 'japan'];
  return order.find((scale) => brandSpan(chart, scale, women) !== null) ?? null;
}

/** ISO's size on a scale for a foot, to the scale's step (ADR 0027); null where the scale has none. */
function isoLabel(foot: number, scale: BrandScale): number | null {
  const unit = getUnit(scale);
  if (!unit || unit.step === undefined || !(unit.step > 0)) return null;
  return roundToStep(fromBase(unit, foot), unit.step, 'nearest')?.value ?? null;
}

/**
 * The row nearest a foot, among the rows printing the scale (every row with a foot for a null
 * scale), where the chart gives feet, as printed or by the brand's own rule (docs/RESEARCH.md
 * §9): a tie goes to the longer foot, as brands advise sizing up between sizes. Null where the
 * chart gives no feet, or the foot lies past its ends by more than half a row's step, as a shoe
 * fits a foot half a step either way (ADR 0027).
 */
export function brandRowNear(
  brand: ShoeBrand,
  chart: BrandChart,
  foot: number,
  scale: BrandScale | null,
  women: boolean,
): BrandChartRow | null {
  const feet = feetOf(brand, chart).filter(
    ({ row }) => scale === null || brandCell(row, scale, women) !== null,
  );
  if (feet.length === 0) return null;
  const first = feet[0]!;
  const last = feet[feet.length - 1]!;
  const stepLow = feet.length > 1 ? (feet[1]!.foot - first.foot) / 2 : 2.5;
  const stepHigh = feet.length > 1 ? (last.foot - feet[feet.length - 2]!.foot) / 2 : 2.5;
  if (foot < first.foot - stepLow || foot > last.foot + stepHigh) return null;
  let best = first;
  for (const each of feet) {
    const d = Math.abs(each.foot - foot);
    const bestD = Math.abs(best.foot - foot);
    if (d < bestD - 1e-9 || (Math.abs(d - bestD) < 1e-9 && each.foot > best.foot)) best = each;
  }
  return best.row;
}

/** What a brand's chart says of the size in the box (ADR 0028). */
export interface BrandReading {
  brand: ShoeBrand;
  chart: BrandChart;
  /**
   * Women's: the box's size is on the US women's scale, so the women's chart answers where there is
   * one.
   */
  women: boolean;
  /**
   * The row the box's size names on its scale; for a length typed, the row nearest it where the
   * chart's length is the foot's. Null where the size is off the chart, the scale is none the
   * chart prints, or a length meets a chart with no feet.
   */
  row: BrandChartRow | null;
  /**
   * The foot in mm the box stands for: the row's, where the chart's length is the foot's; the
   * length typed; else null, the brand giving no foot to read the other brands from.
   */
  foot: number | null;
  /** The box holds a length, Mondopoint or centimetres, rather than a size. */
  length: boolean;
  /** The size is off the chart on its scale: the chart's span there; null otherwise. */
  beyond: readonly [number, number] | null;
  /** How the foot was found (docs/RESEARCH.md §9), or null with no row to read. */
  tier: BrandTier | null;
}

/**
 * The brand's chart read at the box's unit and value; `women` reads the women's chart on a scale
 * that does not say the line (EU, UK, JP, a length), where the web app keeps the line from a US
 * women's size (ADR 0028, 2026-10-20).
 */
export function readBrand(
  brand: ShoeBrand,
  unit: Unit,
  value: number,
  women = unit.id === 'us-women',
): BrandReading {
  const chart = brandChart(brand, women);
  const base = {
    brand,
    chart,
    women,
    row: null,
    foot: null,
    length: false,
    beyond: null,
    tier: null,
  };
  const tierOf = (row: BrandChartRow): BrandTier =>
    footOfRow(brand, chart, row) === undefined ? 4 : chart.basis === 'foot' ? 1 : 2;
  if (LENGTH_UNITS.has(unit.id)) {
    const foot = toBase(unit, value);
    const row = brandRowNear(brand, chart, foot, null, women);
    return { ...base, length: true, foot, row, tier: row ? tierOf(row) : null };
  }
  if (!isBrandScale(unit.id)) return base;
  const row = brandRowAt(chart, unit.id, value, women);
  if (!row) return { ...base, beyond: brandSpan(chart, unit.id, women) };
  return { ...base, row, foot: footOfRow(brand, chart, row) ?? null, tier: tierOf(row) };
}

/**
 * A brand's row in the brands' section: its size for the foot in the box, by its own chart
 * (ADR 0028).
 */
export interface BrandRowReading {
  brand: ShoeBrand;
  chart: BrandChart;
  /** The size on the scale, as printed; a range's lower end. */
  value: number | null;
  range?: readonly [number, number] | undefined;
  /** The foot the chart gives for that size. */
  foot: number | null;
  /** The chart's nearest foot is not the foot read from, or the figure is ISO's label (tier 4). */
  approx: boolean;
  /** The scale the size is on: the one asked for, or the chart's own where it lacks that one. */
  scale: BrandScale | null;
  /** How the figure was found (docs/RESEARCH.md §9); null with none. */
  tier: BrandTier | null;
  /** Why there is no size: the chart prints no scale at all, or the foot is off its chart. */
  why: 'no-scale' | 'off-chart' | null;
}

/**
 * A chart's size for a foot on a scale, by the tiers (docs/RESEARCH.md §9): at the row nearest
 * the foot where the brand gives feet, as printed or by its own rule, ≈ where that row's foot is
 * not the foot; else ISO's label for the foot on the chart's own scale, read through the brand's
 * own row, ≈ always. On the chart's own scale where it lacks the one asked for. Or why it has
 * none: the chart prints no scale at all, or the foot is off it.
 */
export function chartAtFoot(
  brand: ShoeBrand,
  chart: BrandChart,
  foot: number,
  scale: BrandScale,
  women: boolean,
): BrandRowReading {
  const base = { brand, chart, value: null, foot: null, approx: false, scale: null, tier: null };
  const own = ownScale(chart, women);
  if (own === null) return { ...base, why: 'no-scale' };
  const read: BrandScale = brandSpan(chart, scale, women) === null ? own : scale;
  if (feetOf(brand, chart).length > 0) {
    const row = brandRowNear(brand, chart, foot, read, women);
    const rowFoot = row ? footOfRow(brand, chart, row) : undefined;
    if (!row || rowFoot === undefined) return { ...base, why: 'off-chart' };
    const cell = brandCell(row, read, women);
    if (!cell) return { ...base, why: 'no-scale' };
    return {
      brand,
      chart,
      value: cell.value,
      range: cell.range,
      foot: rowFoot,
      approx: Math.abs(rowFoot - foot) > 0.5,
      scale: read,
      tier: chart.basis === 'foot' ? 1 : 2,
      why: null,
    };
  }
  const label = isoLabel(foot, own);
  const row = label === null ? null : brandRowAt(chart, own, label, women);
  if (!row) return { ...base, why: 'off-chart' };
  const cell = brandCell(row, read, women);
  if (!cell) return { ...base, why: 'no-scale' };
  return {
    brand,
    chart,
    value: cell.value,
    range: cell.range,
    foot: null,
    approx: true,
    scale: read,
    tier: 4,
    why: null,
  };
}

/** Every brand's size on a scale for a foot, each by its own chart at the nearest row. */
export function brandsAtFoot(foot: number, scale: BrandScale, women: boolean): BrandRowReading[] {
  return shoeBrands.map((brand) =>
    chartAtFoot(brand, brandChart(brand, women), foot, scale, women),
  );
}
