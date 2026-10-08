import type { Separators } from './locale';
import { compactKey } from './normalize';
import { orderUnits } from './order';
import { parse, type ParsedInput } from './parse';
import type { UnitPreference } from './region';
import type { Category, CategoryId, Tier, Unit, UnitSystem } from './types';
import { categories, units } from './units';

/**
 * Match classes from docs/UX-SPEC.md §4, strongest first. 0 means "listed without a query".
 * 1 exact symbol (case-sensitive) · 2 exact symbol/name/plural/alias (case-insensitive)
 * 3 prefix of name or alias · 4 prefix of symbol · 5 substring of name or alias · 6 one-typo fuzzy
 * Categories use only 2 (exact name or alias) and 3 (prefix of the name): a category row appears
 * when the query is visibly the start of the category word, or an everyday word for it, never
 * from the middle of an alias.
 */
export type MatchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MatchField = 'symbol' | 'name' | 'plural' | 'alias';

export interface UnitMatch {
  kind: 'unit';
  unit: Unit;
  matchClass: MatchClass;
  /** The key that matched, as written in the registry. */
  matchedKey: string;
  field: MatchField;
}

export interface CategoryMatch {
  kind: 'category';
  category: Category;
  matchClass: MatchClass;
  matchedKey: string;
}

export type SearchResult = UnitMatch | CategoryMatch;

export interface SearchOptions {
  /** Restrict unit results to one category (the other box has a unit). */
  category?: CategoryId | null;
  /** 'basic' hides advanced units unless nothing basic matches. Default 'basic'. */
  tier?: Tier | 'all';
  /**
   * Preferred unit family: it orders a category's units listed with nothing typed (order.ts) and
   * breaks ties between typed matches (docs/UX-SPEC.md §3, §4).
   */
  system?: UnitPreference;
  /**
   * A category to rank first among equal matches, without hiding the others: the table layout's
   * current category, when a query searches every category (docs/UX-SPEC.md §4).
   */
  prefer?: CategoryId | null;
  /** Maximum results. Default 20. */
  limit?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  /**
   * True when basic mode showed advanced units because nothing basic matched. Nothing reads it
   * yet; the planned "Advanced units" label will (docs/UX-SPEC.md §14, modes).
   */
  escalated: boolean;
}

interface Query {
  raw: string;
  compact: string;
}

interface UnitKey {
  unit: Unit;
  index: number;
  field: MatchField;
  raw: string;
  compact: string;
}

interface CategoryKey {
  category: Category;
  index: number;
  field: 'name' | 'alias';
  raw: string;
  compact: string;
}

interface Ranked {
  result: SearchResult;
  /** Registry position, the final tiebreak (display order = most common first). */
  index: number;
}

const DEFAULT_LIMIT = 20;
const FUZZY_MIN_LENGTH = 3;

const unitKeys: readonly UnitKey[] = units.flatMap((unit, index) => {
  const keys: Array<{ field: MatchField; raw: string }> = [
    { field: 'symbol', raw: unit.symbol },
    { field: 'name', raw: unit.name },
    { field: 'plural', raw: unit.plural },
    ...unit.aliases.map((raw) => ({ field: 'alias' as const, raw })),
  ];
  return keys.map((k) => ({ unit, index, field: k.field, raw: k.raw, compact: compactKey(k.raw) }));
});

const categoryKeys: readonly CategoryKey[] = categories.flatMap((category, index) => {
  const keys: Array<{ field: 'name' | 'alias'; raw: string }> = [
    { field: 'name', raw: category.name },
    ...category.aliases.map((raw) => ({ field: 'alias' as const, raw })),
  ];
  return keys.map((k) => ({
    category,
    index,
    field: k.field,
    raw: k.raw,
    compact: compactKey(k.raw),
  }));
});

function toQuery(text: string): Query {
  return { raw: text.replace(/\s+/g, ' ').trim(), compact: compactKey(text) };
}

function classifyUnit(q: Query, key: UnitKey): MatchClass | null {
  if (key.field === 'symbol' && key.raw === q.raw) return 1;
  if (key.compact === q.compact) return 2;
  if (key.compact.startsWith(q.compact)) return key.field === 'symbol' ? 4 : 3;
  if (key.field !== 'symbol' && key.compact.includes(q.compact)) return 5;
  return null;
}

function classifyCategory(q: Query, key: CategoryKey): MatchClass | null {
  if (key.compact === q.compact) return 2;
  if (key.field === 'name' && key.compact.startsWith(q.compact)) return 3;
  return null;
}

/** True when `a` and `b` differ by at most one edit: substitution, insertion, deletion, or adjacent swap. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const restA = a.slice(i);
  const restB = b.slice(i);
  if (restA.length === restB.length) {
    if (restA.slice(1) === restB.slice(1)) return true;
    return (
      restA.length >= 2 &&
      restA[0] === restB[1] &&
      restA[1] === restB[0] &&
      restA.slice(2) === restB.slice(2)
    );
  }
  return restA.length > restB.length ? restA.slice(1) === restB : restB.slice(1) === restA;
}

function systemRank(system: UnitSystem, preference: UnitPreference | undefined): number {
  switch (preference) {
    case 'us':
      return system === 'us' || system === 'imperial' ? 0 : 1;
    case 'imperial':
      return system === 'uk' || system === 'imperial' ? 0 : 1;
    case 'metric':
      return system === 'si' || system === 'metric' ? 0 : 1;
    default:
      return 0;
  }
}

function categoryOf(result: SearchResult): CategoryId {
  return result.kind === 'unit' ? result.unit.category : result.category.id;
}

function compareRanked(a: Ranked, b: Ranked, options: SearchOptions): number {
  const ra = a.result;
  const rb = b.result;
  if (ra.matchClass !== rb.matchClass) return ra.matchClass - rb.matchClass;
  if (ra.kind !== rb.kind) return ra.kind === 'category' ? -1 : 1;
  if (options.prefer) {
    const preferred =
      (categoryOf(ra) === options.prefer ? 0 : 1) - (categoryOf(rb) === options.prefer ? 0 : 1);
    if (preferred !== 0) return preferred;
  }
  if (ra.kind === 'unit' && rb.kind === 'unit') {
    const preference = options.system;
    const sys = systemRank(ra.unit.system, preference) - systemRank(rb.unit.system, preference);
    if (sys !== 0) return sys;
    const tier = (ra.unit.tier === 'basic' ? 0 : 1) - (rb.unit.tier === 'basic' ? 0 : 1);
    if (tier !== 0) return tier;
  }
  return a.index - b.index;
}

function idleResults(options: SearchOptions): SearchResponse {
  const tierMode = options.tier ?? 'basic';
  const results: SearchResult[] = [];
  if (options.category) {
    const listed = units.filter(
      (unit) =>
        unit.category === options.category && (tierMode !== 'basic' || unit.tier === 'basic'),
    );
    for (const unit of orderUnits(listed, options.system)) {
      results.push({ kind: 'unit', unit, matchClass: 0, matchedKey: unit.name, field: 'name' });
    }
  } else {
    for (const category of categories) {
      if (tierMode === 'basic' && category.tier !== 'basic') continue;
      results.push({ kind: 'category', category, matchClass: 0, matchedKey: category.name });
    }
  }
  return { results: results.slice(0, options.limit ?? DEFAULT_LIMIT), escalated: false };
}

/**
 * Rank units and categories against a typed query. An empty query lists what the box could hold:
 * the categories, or the locked category's units.
 */
export function search(text: string, options: SearchOptions = {}): SearchResponse {
  const q = toQuery(text);
  if (!q.compact) return idleResults(options);

  const scopedUnitKeys = options.category
    ? unitKeys.filter((k) => k.unit.category === options.category)
    : unitKeys;
  const scopedCategoryKeys: readonly CategoryKey[] = options.category ? [] : categoryKeys;

  const bestUnit = new Map<string, Ranked>();
  const bestCategory = new Map<string, Ranked>();

  const offerUnit = (key: UnitKey, matchClass: MatchClass) => {
    const current = bestUnit.get(key.unit.id);
    if (current && current.result.matchClass <= matchClass) return;
    bestUnit.set(key.unit.id, {
      index: key.index,
      result: { kind: 'unit', unit: key.unit, matchClass, matchedKey: key.raw, field: key.field },
    });
  };
  const offerCategory = (key: CategoryKey, matchClass: MatchClass) => {
    const current = bestCategory.get(key.category.id);
    if (current && current.result.matchClass <= matchClass) return;
    bestCategory.set(key.category.id, {
      index: key.index,
      result: { kind: 'category', category: key.category, matchClass, matchedKey: key.raw },
    });
  };

  for (const key of scopedUnitKeys) {
    const matchClass = classifyUnit(q, key);
    if (matchClass !== null) offerUnit(key, matchClass);
  }
  for (const key of scopedCategoryKeys) {
    const matchClass = classifyCategory(q, key);
    if (matchClass !== null) offerCategory(key, matchClass);
  }

  // Fuzzy matching is for units only: a no-match list shows every category anyway.
  if (bestUnit.size === 0 && bestCategory.size === 0 && q.compact.length >= FUZZY_MIN_LENGTH) {
    for (const key of scopedUnitKeys) {
      if (withinOneEdit(q.compact, key.compact)) offerUnit(key, 6);
    }
  }

  let unitResults = [...bestUnit.values()];
  let escalated = false;
  if ((options.tier ?? 'basic') === 'basic') {
    const basic = unitResults.filter(
      (r) => r.result.kind === 'unit' && r.result.unit.tier === 'basic',
    );
    if (basic.length === 0 && unitResults.length > 0) escalated = true;
    else unitResults = basic;
  }

  const ranked = [...bestCategory.values(), ...unitResults].sort((a, b) =>
    compareRanked(a, b, options),
  );

  return {
    results: ranked.slice(0, options.limit ?? DEFAULT_LIMIT).map((r) => r.result),
    escalated,
  };
}

/**
 * The single unit a query names exactly, or null when it names none or more than one.
 * "ml" → milliliter. "oz" → null (weight ounce and fluid ounce both match) unless the category is locked.
 * Advanced units count: typing an exact name is explicit intent.
 */
export function resolveExact(text: string, options: SearchOptions = {}): Unit | null {
  const { results } = search(text, { ...options, tier: 'all', limit: 100 });
  const exact = results.filter((r): r is UnitMatch => r.kind === 'unit' && r.matchClass <= 2);
  return exact.length === 1 ? exact[0]!.unit : null;
}

export interface Suggestion {
  parsed: ParsedInput;
  search: SearchResponse;
  /** Set when the query names exactly one unit. */
  exact: Unit | null;
}

/** One call per keystroke: parse the box text, search on its query, and resolve an exact match. */
export function suggest(
  text: string,
  options: SearchOptions & { separators?: Separators } = {},
): Suggestion {
  const { separators, ...searchOptions } = options;
  const parsed = parse(text, separators);
  const query = parsed.query ?? '';
  return {
    parsed,
    search: search(query, searchOptions),
    exact: query ? resolveExact(query, searchOptions) : null,
  };
}
