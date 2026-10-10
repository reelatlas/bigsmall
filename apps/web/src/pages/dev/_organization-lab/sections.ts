import {
  unitsIn,
  type CategoryId,
  type Unit,
  type UnitPreference,
  type UnitSystem,
} from '@bigsmall/core';

/**
 * The table's sections for the settings lab (docs/research/organization-lab.md): by system, under
 * fixed names, the same five everywhere (Sean, 2026-10-10), so a switch means the same thing in
 * every category. `everyday` is a category with no regional system's everyday units (time, data,
 * angle), which a system switch never hides.
 */
export type FixedKey = 'metric' | 'us' | 'uk' | 'other' | 'everyday' | 'specialist';

export const FIXED_LABEL: Record<FixedKey, string> = {
  metric: 'Metric',
  us: 'US (customary)',
  uk: 'UK (imperial)',
  other: 'Other',
  everyday: 'Everyday',
  specialist: 'Specialist',
};

/**
 * The system switches, in their order: one setting for every category. Other has none while it
 * holds two units, the knot and the atmosphere, which always show (Sean, 2026-10-10).
 */
export const SHOW_KEYS: readonly FixedKey[] = ['metric', 'us', 'uk', 'specialist'];

const REGIONAL: ReadonlySet<UnitSystem> = new Set(['us', 'imperial', 'uk']);

/** A category whose units belong to US customary, imperial, or UK measure, so a region names them. */
export function categoryIsRegional(category: CategoryId): boolean {
  return unitsIn(category).some((unit) => REGIONAL.has(unit.system));
}

/** The visitor's own section. */
export function ownKey(preference: UnitPreference): FixedKey {
  if (preference === 'us') return 'us';
  if (preference === 'imperial') return 'uk';
  return 'metric';
}

/**
 * The section a unit belongs to, for this visitor. The shared inch, foot, and pound sit with
 * US (customary), or with UK (imperial) for a UK visitor; every specialist unit is Specialist.
 */
export function fixedKeyOf(unit: Unit, preference: UnitPreference): FixedKey {
  if (unit.tier !== 'basic') return 'specialist';
  if (!categoryIsRegional(unit.category)) return 'everyday';
  if (unit.system === 'si' || unit.system === 'metric') return 'metric';
  if (unit.system === 'us') return 'us';
  if (unit.system === 'uk') return 'uk';
  if (unit.system === 'imperial') return preference === 'imperial' ? 'uk' : 'us';
  return 'other';
}

export interface Section<T extends { unit: Unit }> {
  key: FixedKey;
  label: string;
  rows: T[];
}

/**
 * Rows in their sections, every section headed, even a section of one: the visitor's own first,
 * then the other systems in the listed order, then Other, then Specialist. Rows keep the listed
 * order within their section.
 */
export function sectionsOf<T extends { unit: Unit }>(
  rows: readonly T[],
  preference: UnitPreference,
): Section<T>[] {
  const own = ownKey(preference);
  const rank = (key: FixedKey) =>
    key === own || key === 'everyday' ? 0 : key === 'specialist' ? 3 : key === 'other' ? 2 : 1;
  const sections = new Map<FixedKey, Section<T>>();
  for (const row of rows) {
    const key = fixedKeyOf(row.unit, preference);
    const section = sections.get(key) ?? { key, label: FIXED_LABEL[key], rows: [] };
    section.rows.push(row);
    sections.set(key, section);
  }
  return [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, section]) => section);
}
