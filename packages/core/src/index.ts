/**
 * @bigsmall/core — public API.
 * Pure TypeScript, zero runtime dependencies, no DOM (ADR 0003).
 */
export type * from './types';
export { convert, convertChange, toBase, fromBase, ConversionError } from './convert';
export type { ConversionErrorCode } from './convert';
export { categories, units, getUnit, getCategory, unitsIn, clockUnits } from './units';
export { regionDefaults } from './region';
export type { RegionDefaults, UnitPreference } from './region';
export { DEFAULT_SEPARATORS, localeSeparators } from './locale';
export type { Separators } from './locale';
export { parse } from './parse';
export { NBSP } from './number';
export type { ParsedInput } from './parse';
export {
  formatPair,
  pairCanonical,
  pairFormula,
  pairParts,
  pairsOpenedBy,
  readCompound,
} from './compound';
export type { Compound, CompoundPart, CompoundRead, PairFormat } from './compound';
export { normalizeKey, compactKey, compactKeyWithDegree } from './normalize';
export { search, resolveExact, suggest, leadingTarget } from './search';
export type {
  MatchClass,
  MatchField,
  UnitMatch,
  CategoryMatch,
  SearchResult,
  SearchOptions,
  SearchResponse,
  Suggestion,
} from './search';
export { unitListGroup } from './order';
export type { ListGroup } from './order';
export { matchSpan } from './highlight';
export type { TextSpan } from './highlight';
export { formatClock, formatNumber, MINUS } from './format';
export {
  INGREDIENT_KINDS,
  ingredients,
  getIngredient,
  matchIngredients,
  splitIngredient,
  cookingUnits,
  countedUnit,
  convertWith,
  crossesDensity,
  cupBasis,
  cupFigure,
  MEASURED_CUPS,
} from './cooking';
export type { CupBasis, IngredientMatch } from './cooking';
export {
  shoeBrands,
  getShoeBrand,
  matchShoeBrands,
  splitShoeBrand,
  brandChart,
  otherBrandChart,
  brandCell,
  brandRowAt,
  brandRowNear,
  brandSpan,
  readBrand,
  brandsAtFoot,
  chartAtFoot,
  isBrandScale,
  BRAND_SCALES,
  BRAND_DEFAULT_SCALE,
  setBrandCharts,
  hasBrandCharts,
  brandChartsOf,
  BRAND_CHARTS_SCHEMA,
} from './shoe-brands';
export type {
  ShoeBrand,
  BrandChart,
  BrandChartRow,
  BrandChartsFile,
  BrandLine,
  LengthBasis,
  BrandScale,
  BrandMatch,
  BrandCell,
  BrandReading,
  BrandRowReading,
} from './shoe-brands';
export type { FormatOptions } from './format';
export {
  formatFraction,
  formatPlaces,
  formatSignificant,
  fractionsOf,
  FRACTION_SIZES,
  roundToFraction,
  roundToStep,
} from './rounded';
export type { Fraction, FractionSize, Rounded, Rounding, Stepped } from './rounded';
