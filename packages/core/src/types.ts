/**
 * Data model for the conversion engine.
 * Pure types: no runtime code, no DOM, no framework (ADR 0003).
 */

/** Quantity categories known to the engine. Extend this union when adding a category file. */
export type CategoryId =
  | 'length'
  | 'mass'
  | 'volume'
  | 'cooking'
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
 * - `si`: the SI units and their prefixed forms (meter, kilogram, cubic meter, joule, pascal,
 *   kilowatt; the degree Celsius too).
 * - `metric`: the metric units that are not SI: those the SI Brochure accepts for use with it
 *   (liter, minute, hour, day, degree of arc, hectare, tonne) and the rest of the metric world
 *   (bar, calorie, kilogram-force, metric horsepower). Nothing yet tells `si` from `metric`:
 *   both list and section as metric (order.ts; the web's settings.ts).
 * - `imperial`: shared by US customary and British imperial (inch, foot, pound ...).
 * - `us`: a US-only variant (US gallon, short ton).
 * - `uk`: a British-only variant (imperial gallon, long ton, stone).
 * - `other`: of no one system (knot, nautical mile, troy ounce, bit and byte, electronvolt).
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
  /**
   * A lens over other categories' units, with none of its own (Cooking, over Weight and Volume;
   * ADR 0021): its base unit is one of theirs, and an ingredient converts across them.
   */
  over?: readonly CategoryId[];
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
  /**
   * A short definition for a unit with a variant or convention worth stating; nothing shows it
   * yet (docs/UX-SPEC.md §14, "Unit notes").
   */
  note?: string;
  /**
   * A pace, time per distance (Sean, 2026-10-16): its value is in minutes, written in minutes and
   * seconds (5:30, formatClock), and it is listed apart from the units it converts with, after
   * them (order.ts), in a Pace section of its own on the web.
   */
  pace?: true;
  /**
   * A unit of one ingredient alone, as people count it (a stick of butter, a large egg; ADR 0021):
   * listed only with that ingredient, and taking it brings the ingredient.
   */
  ingredient?: string;
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

/**
 * What kind of ingredient it is (ADR 0021): the heading it is listed under where ingredients are
 * chosen, in the order of INGREDIENT_KINDS.
 */
export type IngredientKind =
  'flour' | 'sugar' | 'fat' | 'dairy' | 'liquid' | 'baking' | 'grain' | 'mix-in';

/**
 * A source's figure for one US cup of an ingredient (docs/research/cooking-2.md): a weighing that
 * counts toward the ingredient's figure or, for a liquid, a reference for its density.
 */
export interface CupSource {
  /** Who weighed it, or the reference ("USDA's measured cups (1969)", "King Arthur Baking"). */
  by: string;
  /** Grams in one cup filled the ingredient's way; [low, high] where the source gives a range. */
  grams: number | readonly [number, number];
  /** What else the source says that its figure rests on ("510 cups", "4 g a teaspoon"). */
  detail?: string;
  /**
   * The standard deviation the source reports across its own measurements, where it reports one
   * (USDA's measured cups): the yardstick a figure is checked against (docs/RESEARCH.md §2.7).
   */
  sd?: number;
}

/**
 * An ingredient, which joins volume and weight through its density (ADR 0021): how much one US
 * customary cup of it weighs, filled the way US recipes mean it.
 */
export interface Ingredient {
  /** Stable identifier used in URLs. Lowercase, ASCII, kebab-case. */
  id: string;
  /** As a recipe names it, lowercase ("all-purpose flour"). */
  name: string;
  /** Its kind, the heading it is listed under (INGREDIENT_KINDS). */
  kind: IngredientKind;
  /** Other names people type ("flour", "plain flour", "icing sugar"). */
  aliases: readonly string[];
  /**
   * Grams in one US customary cup (236.5882365 mL), filled as US recipes mean (`method`), by
   * docs/research/cooking-2.md's rule: the median of `sources`, rounded to the gram (a half to
   * the even gram); with fewer than three, USDA's measured cups' figure where they weighed it. A
   * liquid's is its density times the cup, within its references. Measured, never exact.
   */
  gramsPerCup: number;
  /**
   * How the cup is filled for that weight ("spooned and leveled", "packed", "poured to the
   * line").
   */
  method: string;
  /** The lowest and highest of `sources`, in grams. */
  range: readonly [number, number];
  /** A liquid's weight comes from its density times the cup, not from cups weighed by hand. */
  byDensity?: true;
  /**
   * The weighings that count toward the figure, each source once (ADR 0020, ADR 0021); for a
   * liquid, its density's references. Those set aside, and why, are in cooking-2.md.
   */
  sources: readonly CupSource[];
  /** Where another way of filling the cup, or a caveat, matters ("Sifted first, 95 g"). */
  note?: string;
  /** The unit a bare count of it means, by id: "2 eggs" is two large eggs. */
  counted?: string;
}
