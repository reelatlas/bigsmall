/**
 * The brands' shoe-size charts as data core is given, not data it carries (ADR 0029): the file
 * `packages/core/data/shoe-brands.json`, written from the research record by
 * `docs/research/shoe-sizes-2/write_brands.py`, is fetched by the web app once Shoe size opens
 * and handed to `setBrandCharts`; the tests and the site's build hand it over directly. Core stays
 * pure and synchronous: the lookups (`../shoe-brands.ts`) read the charts from here once given,
 * and throw, as a programming error, if asked before.
 */

/** The line a chart is printed for: a men's or a women's page, or one chart for everyone. */
export type BrandLine = 'men' | 'women' | 'unisex';

/**
 * What the chart's length column is, by the brand's own words (docs/research/shoe-sizes-2.md §7
 * to §9): the foot's, measured heel to toe; the product's (Puma's measurements); a size label
 * (On's Japan column); or none printed.
 */
export type LengthBasis = 'foot' | 'product' | 'label' | 'none';

/**
 * One row of a brand's chart, every cell as the brand prints it: a size on each scale the chart
 * has (a range where the brand prints one, its two ends), the British women's where the brand
 * prints men's and women's UK apart (Crocs), the Japan or CM column as a label in centimetres,
 * and the foot's length in mm where the brand says its length is the foot's.
 */
export interface BrandChartRow {
  usMen?: number | readonly [number, number];
  usWomen?: number | readonly [number, number];
  uk?: number;
  ukWomen?: number;
  eu?: number | readonly [number, number];
  jp?: number;
  foot?: number;
}

/** A brand's chart as published: its line, its length's basis, its name on the page, its page, and its rows. */
export interface BrandChart {
  line: BrandLine;
  basis: LengthBasis;
  title: string;
  source: string;
  /** The date the page was read, ISO 8601. */
  read: string;
  rows: readonly BrandChartRow[];
}

/** The name of the file's shape, which a fetch is checked by before the file is trusted. */
export const BRAND_CHARTS_SCHEMA = 'bigsmall shoe-brand charts v1';

/**
 * The charts' file as published (`packages/core/data/shoe-brands.json`): its schema's name, what
 * wrote it, the date the charts were read, and the charts by brand id (docs/research/shoe-sizes-2.md
 * §5, decision 1: 33 charts, 20 brands, one or two per brand).
 */
export interface BrandChartsFile {
  schema: string;
  written?: string;
  /** The date the charts were read, ISO 8601. */
  read: string;
  charts: Readonly<Record<string, readonly BrandChart[]>>;
}

let given: BrandChartsFile['charts'] | null = null;

/** Gives core the brands' charts; a later file replaces the earlier. */
export function setBrandCharts(file: BrandChartsFile): void {
  given = file.charts;
}

/** Whether the charts have been given. */
export function hasBrandCharts(): boolean {
  return given !== null;
}

/**
 * A brand's charts, by its id, none for a brand the file lacks; asked before the charts are given,
 * it throws: the web app waits for its fetch (`useBrandCharts`), the tests and the build hand the
 * file over first.
 */
export function brandChartsOf(id: string): readonly BrandChart[] {
  if (given === null) {
    throw new Error('The brands’ charts have not been given to core (setBrandCharts; ADR 0029).');
  }
  return given[id] ?? [];
}
