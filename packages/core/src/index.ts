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
