/**
 * @bigsmall/core — public API.
 * Pure TypeScript, zero runtime dependencies, no DOM (ADR 0003).
 */
export type * from './types';
export { convert, convertChange, toBase, fromBase, ConversionError } from './convert';
export type { ConversionErrorCode } from './convert';
export { categories, units, getUnit, getCategory, unitsIn } from './units';
export { regionDefaults } from './region';
export type { RegionDefaults, UnitPreference } from './region';
export { DEFAULT_SEPARATORS, localeSeparators } from './locale';
export type { Separators } from './locale';
export { parse } from './parse';
export type { ParsedInput } from './parse';
export { normalizeKey, compactKey, compactKeyWithDegree } from './normalize';
export { search, resolveExact, suggest } from './search';
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
export { formatClock, formatNumber } from './format';
export {
  INGREDIENT_KINDS,
  ingredients,
  getIngredient,
  exactIngredient,
  matchIngredients,
  splitIngredient,
  cookingUnits,
  countedUnit,
  convertWith,
  crossesDensity,
} from './cooking';
export type { IngredientMatch } from './cooking';
export type { FormatOptions } from './format';
export { formatFraction, formatPlaces, fractionsOf, FRACTION_SIZES } from './rounded';
export type { Fraction, FractionSize, Rounded, Rounding } from './rounded';
