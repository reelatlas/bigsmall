/**
 * @bigsmall/core — public API.
 * Pure TypeScript, zero runtime dependencies, no DOM (ADR 0003).
 */
export type * from './types';
export { convert, toBase, fromBase, ConversionError } from './convert';
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
export { matchSpan } from './highlight';
export type { TextSpan } from './highlight';
export { formatNumber } from './format';
export type { FormatOptions } from './format';
