/**
 * Data model for the conversion engine.
 * Pure types: no runtime code, no DOM, no framework (ADR 0003).
 */

/** Quantity categories known to the engine. Extend this union when adding a category file. */
export type CategoryId =
  | 'length'
  | 'mass'
  | 'volume'
  | 'temperature'
  | 'area'
  | 'speed'
  | 'time'
  | 'data'
  | 'fuel-economy'
  | 'energy'
  | 'pressure'
  | 'power'
  | 'force'
  | 'torque'
  | 'angle';

/**
 * Standard or specialty, the words the screen uses, so code, docs, and screen share one
 * vocabulary (Sean, 2026-10-16; basic and advanced until then). Specialty units are listed after
 * every standard one, and rank after them among equal matches; the web's Specialty switch shows or
 * hides them (ADR 0016, ADR 0018).
 */
export type Tier = 'standard' | 'specialty';

/**
 * Which measurement system a unit belongs to.
 * - `imperial`: shared by US customary and British imperial (inch, foot, pound ...).
 * - `us`: a US-only variant (US gallon, short ton).
 * - `uk`: a British-only variant (imperial gallon, long ton, stone).
 */
export type UnitSystem = 'si' | 'metric' | 'imperial' | 'us' | 'uk' | 'other';

/**
 * A category's field, for grouping categories once there are many (docs/PLAN.md §2): the common
 * ones people convert every day, then the fields. Not a tier.
 */
export type CategoryGroup =
  | 'common'
  | 'mechanics'
  | 'fluids'
  | 'heat'
  | 'electromagnetism'
  | 'light'
  | 'radiation'
  | 'digital';

export interface Category {
  id: CategoryId;
  /** Display name, in the words people use ("Weight", not "Mass"). */
  name: string;
  /** Words people type that mean this category ("distance", "how far"). */
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
  /** Citation for the factor or formula (ADR 0020). Example: "NIST SP 811 (2008) Appendix B.8". */
  source: string;
  /** Short definition shown to users when the unit has a variant or convention worth stating. */
  note?: string;
  /**
   * A pace, time per distance (Sean, 2026-10-16): its value is in minutes, written in minutes and
   * seconds (5:30, formatClock), and it is listed apart from the units it converts with, after
   * them (order.ts), in a Pace section of its own on the web.
   */
  pace?: true;
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

/**
 * base = factor ÷ value: a unit of the inverse quantity, fuel per distance against distance per
 * fuel (L/100 km against km/L), or pace against speed. The same division goes both ways.
 */
export interface ReciprocalUnit extends UnitMeta {
  kind: 'reciprocal';
  factor: number;
}

/** Anything else: a pair of functions, for a relation no factor can say. */
export interface FunctionalUnit extends UnitMeta {
  kind: 'functional';
  toBase(value: number): number;
  fromBase(value: number): number;
}

export type Unit = LinearUnit | AffineUnit | ReciprocalUnit | FunctionalUnit;
