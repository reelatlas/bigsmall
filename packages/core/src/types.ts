/**
 * Data model for the conversion engine.
 * Pure types: no runtime code, no DOM, no framework (ADR 0003).
 */

/** Quantity categories known to the engine. Extend this union when adding a category file. */
export type CategoryId =
  'length' | 'mass' | 'volume' | 'temperature' | 'area' | 'speed' | 'time' | 'data';

/** Basic units appear by default; advanced units appear on request or when searched directly. */
export type Tier = 'basic' | 'advanced';

/**
 * Which measurement system a unit belongs to.
 * - `imperial`: shared by US customary and British imperial (inch, foot, pound ...).
 * - `us`: a US-only variant (US gallon, short ton).
 * - `uk`: a British-only variant (imperial gallon, long ton, stone).
 */
export type UnitSystem = 'si' | 'metric' | 'imperial' | 'us' | 'uk' | 'other';

export type CategoryGroup =
  | 'everyday'
  | 'mechanics'
  | 'fluids'
  | 'heat'
  | 'electromagnetism'
  | 'light'
  | 'radiation'
  | 'digital';

export interface Category {
  id: CategoryId;
  /** Display name, in everyday language ("Weight", not "Mass"). */
  name: string;
  /** Everyday words people type that mean this category ("distance", "how far"). */
  aliases: readonly string[];
  /** Unit every other unit in the category converts through. Must be linear with factor 1. */
  baseUnit: string;
  tier: Tier;
  group: CategoryGroup;
}

interface UnitMeta {
  /** Stable identifier used in URLs and storage. Lowercase, singular, ASCII, kebab-case. */
  id: string;
  category: CategoryId;
  name: string;
  plural: string;
  symbol: string;
  /** Extra spellings people type: regional spellings, abbreviations, common typos. */
  aliases: readonly string[];
  system: UnitSystem;
  tier: Tier;
  /** True when the relationship to the base unit is exact by definition rather than measured. */
  exact: boolean;
  /** Citation for the factor or formula (ADR 0004). Example: "NIST SP 811 (2008) Appendix B.8". */
  source: string;
  /** Short definition shown to users when the unit has a variant or convention worth stating. */
  note?: string;
}

/** base = value × factor. Nearly every unit. */
export interface LinearUnit extends UnitMeta {
  kind: 'linear';
  factor: number;
}

/** base = (value + offset) × factor. Temperature scales with a zero point. */
export interface AffineUnit extends UnitMeta {
  kind: 'affine';
  factor: number;
  offset: number;
}

/** Anything else, such as reciprocal units (fuel economy, pace). */
export interface FunctionalUnit extends UnitMeta {
  kind: 'functional';
  toBase(value: number): number;
  fromBase(value: number): number;
}

export type Unit = LinearUnit | AffineUnit | FunctionalUnit;
