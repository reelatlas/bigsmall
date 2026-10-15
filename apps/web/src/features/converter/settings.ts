import {
  getUnit,
  unitsIn,
  type CategoryId,
  type FractionSize,
  type Rounding,
  type Unit,
  type UnitPreference,
  type UnitSystem,
} from '@bigsmall/core';

/**
 * Settings: what shows and how it looks (docs/UX-SPEC.md §3, §7; ADR 0017). Pure, no React, no
 * DOM: everything here is unit-tested in node.
 *
 * What shows has two layers. The system switches set every category. A unit chosen on its own in
 * a table is an exception, shown or hidden against its switch, until its system's switch changes,
 * which is final for that system, or a preset, which sets exactly its set; Show units hidden one
 * by one, or the table, also clears it (Sean, 2026-10-15: with Specialty unchecked, no specialist
 * unit shows). The unit in the box always shows, whatever the settings say (the caller's to
 * apply).
 */

// ---------------------------------------------------------------------------
// Sections: the table's units by system, under fixed names, the same everywhere, so a switch
// means the same thing in every category.

/** A section of the table: `standard` holds a category with no regional system (time, data, angle). */
export type SectionKey = 'metric' | 'us' | 'uk' | 'other' | 'standard' | 'specialist';

/**
 * Only headings take the parentheses; units keep their names and symbols. Specialty, for the units
 * of a field, pairs with Standard (Sean, 2026-10-14).
 */
export const SECTION_LABEL: Record<SectionKey, string> = {
  metric: 'Metric',
  us: 'US (customary)',
  uk: 'UK (imperial)',
  other: 'Other',
  standard: 'Standard',
  specialist: 'Specialty',
};

/**
 * The system switches, in their order. Other has none while it holds two units, the knot and the
 * atmosphere, which always show, and so does Standard.
 */
export const SYSTEM_KEYS: readonly SectionKey[] = ['metric', 'us', 'uk', 'specialist'];

const REGIONAL: ReadonlySet<UnitSystem> = new Set(['us', 'imperial', 'uk']);
const regional = new Map<CategoryId, boolean>();

/** A category whose units belong to US customary, imperial, or UK measure, so a region names them. */
function categoryIsRegional(category: CategoryId): boolean {
  let answer = regional.get(category);
  if (answer === undefined) {
    answer = unitsIn(category).some((unit) => REGIONAL.has(unit.system));
    regional.set(category, answer);
  }
  return answer;
}

/** The visitor's own section. */
export function ownSection(preference: UnitPreference): SectionKey {
  if (preference === 'us') return 'us';
  if (preference === 'imperial') return 'uk';
  return 'metric';
}

/**
 * The section a unit belongs to, for this visitor. The shared inch, foot, and pound sit with
 * US (customary), or with UK (imperial) for a UK visitor; every specialist unit is Specialty.
 */
export function sectionOf(unit: Unit, preference: UnitPreference): SectionKey {
  if (unit.tier !== 'basic') return 'specialist';
  if (!categoryIsRegional(unit.category)) return 'standard';
  if (unit.system === 'si' || unit.system === 'metric') return 'metric';
  if (unit.system === 'us') return 'us';
  if (unit.system === 'uk') return 'uk';
  if (unit.system === 'imperial') return preference === 'imperial' ? 'uk' : 'us';
  return 'other';
}

export interface Section<T> {
  key: SectionKey;
  label: string;
  rows: T[];
}

/**
 * Rows in their sections, every section headed, even a section of one: the visitor's own first,
 * then the other systems in the listed order, then Other, then Specialty. Rows keep the listed
 * order within their section.
 */
export function sectionsOf<T extends { unit: Unit }>(
  rows: readonly T[],
  preference: UnitPreference,
): Section<T>[] {
  const own = ownSection(preference);
  const rank = (key: SectionKey) =>
    key === own || key === 'standard' ? 0 : key === 'specialist' ? 3 : key === 'other' ? 2 : 1;
  const sections = new Map<SectionKey, Section<T>>();
  for (const row of rows) {
    const key = sectionOf(row.unit, preference);
    const section = sections.get(key) ?? { key, label: SECTION_LABEL[key], rows: [] };
    section.rows.push(row);
    sections.set(key, section);
  }
  return [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, section]) => section);
}

// ---------------------------------------------------------------------------
// What shows.

export interface ViewRule {
  /** The system switches: one setting for every category. */
  shown: ReadonlySet<SectionKey>;
  /** Exceptions: units shown or hidden on their own, against their system's switch. */
  overrides: ReadonlyMap<string, boolean>;
}

/** A fresh visit's: every system but Specialty, the Standard preset. */
export const FRESH_RULE: ViewRule = {
  shown: new Set(SYSTEM_KEYS.filter((key) => key !== 'specialist')),
  overrides: new Map(),
};

export type ShowPreset = 'all' | 'standard' | 'region';

export const SHOW_PRESETS: ReadonlyArray<{ id: ShowPreset; name: string }> = [
  { id: 'all', name: 'All' },
  { id: 'standard', name: 'Standard' },
  { id: 'region', name: 'Your region' },
];

export function presetKeys(
  preset: ShowPreset,
  preference: UnitPreference,
): ReadonlySet<SectionKey> {
  if (preset === 'all') return new Set(SYSTEM_KEYS);
  if (preset === 'standard') return new Set(SYSTEM_KEYS.filter((key) => key !== 'specialist'));
  return new Set([ownSection(preference)]);
}

/** The preset the switches alone match, or null for a custom set. */
export function presetOf(
  shown: ReadonlySet<SectionKey>,
  preference: UnitPreference,
): ShowPreset | null {
  const same = (keys: ReadonlySet<SectionKey>) =>
    keys.size === shown.size && [...keys].every((key) => shown.has(key));
  return SHOW_PRESETS.find((preset) => same(presetKeys(preset.id, preference)))?.id ?? null;
}

/** The preset lit in Units: the one the switches match, while no unit is chosen on its own. */
export function litPreset(rule: ViewRule, preference: UnitPreference): ShowPreset | null {
  return rule.overrides.size > 0 ? null : presetOf(rule.shown, preference);
}

/** The section of a unit chosen on its own, by its id; undefined for an id no longer known. */
function sectionOfId(id: string, preference: UnitPreference): SectionKey | undefined {
  const unit = getUnit(id);
  return unit ? sectionOf(unit, preference) : undefined;
}

/**
 * A system's checkbox in Units: all its units shown, none, or some (a dash) while units of it are
 * chosen on their own against its switch, in any category.
 */
export function systemState(
  rule: ViewRule,
  key: SectionKey,
  preference: UnitPreference,
): GroupState {
  const on = rule.shown.has(key);
  const against = [...rule.overrides].some(
    ([id, show]) => show !== on && sectionOfId(id, preference) === key,
  );
  if (against) return 'some';
  return on ? 'all' : 'none';
}

/** What the switches alone show: Other and Standard always. */
function bySystem(unit: Unit, shown: ReadonlySet<SectionKey>, preference: UnitPreference): boolean {
  const key = sectionOf(unit, preference);
  return key === 'standard' || key === 'other' || shown.has(key);
}

/** Whether a unit shows: its exception, if it has one, else its switch. */
export function shows(unit: Unit, rule: ViewRule, preference: UnitPreference): boolean {
  return rule.overrides.get(unit.id) ?? bySystem(unit, rule.shown, preference);
}

export type GroupState = 'all' | 'some' | 'none';

/** A section's checkbox: all of its units shown, some (a dash), or none. */
export function groupState<T>(items: readonly T[], isShown: (item: T) => boolean): GroupState {
  const count = items.filter(isShown).length;
  if (count === items.length) return 'all';
  return count === 0 ? 'none' : 'some';
}

/** Units chosen on their own: an exception where it differs from the switch, none where it agrees. */
export function withChoice(
  rule: ViewRule,
  units: readonly Unit[],
  show: boolean,
  preference: UnitPreference,
): ViewRule {
  const overrides = new Map(rule.overrides);
  for (const unit of units) {
    if (bySystem(unit, rule.shown, preference) === show) overrides.delete(unit.id);
    else overrides.set(unit.id, show);
  }
  return { ...rule, overrides };
}

/**
 * One system switched on or off, in every category, and final for it: its units chosen on their
 * own go back to the switch, so unchecking Specialty hides every specialist unit. Other systems'
 * exceptions stay.
 */
export function withSystem(
  rule: ViewRule,
  key: SectionKey,
  on: boolean,
  preference: UnitPreference,
): ViewRule {
  const shown = new Set(rule.shown);
  if (on) shown.add(key);
  else shown.delete(key);
  const overrides = new Map(
    [...rule.overrides].filter(([id]) => sectionOfId(id, preference) !== key),
  );
  return { shown, overrides };
}

/** A preset: exactly its systems, every unit chosen on its own back to its switch. */
export function presetRule(shown: ReadonlySet<SectionKey>): ViewRule {
  return { shown, overrides: new Map() };
}

/** The units hidden on their own, in every category. */
export function hiddenByHand(rule: ViewRule): number {
  return [...rule.overrides.values()].filter((show) => !show).length;
}

/** Show units you hid: every unit hidden on its own back to its switch; those shown on their own stay. */
export function withoutHidden(rule: ViewRule): ViewRule {
  return { ...rule, overrides: new Map([...rule.overrides].filter(([, show]) => show)) };
}

// ---------------------------------------------------------------------------
// How it looks.

export interface Display {
  names: 'symbol' | 'both';
  copy: boolean;
  /** Both writes the decimal, then its fraction, as Format lists them. */
  format: 'decimal' | 'fraction' | 'both';
  /** Decimal places, or null for no limit: the table's six significant digits. */
  places: 1 | 2 | 3 | null;
  /** The fraction sizes chosen, each on or off by itself. */
  fractions: ReadonlySet<FractionSize>;
  rounding: Rounding;
}

/** A fresh visit's: symbols, no copy buttons, two places, rounded to the nearest, eighths in waiting. */
export const FRESH_DISPLAY: Display = {
  names: 'symbol',
  copy: false,
  format: 'decimal',
  places: 2,
  fractions: new Set([2, 4, 8]),
  rounding: 'nearest',
};

function sameSizes(a: ReadonlySet<FractionSize>, b: ReadonlySet<FractionSize>): boolean {
  return a.size === b.size && [...a].every((size) => b.has(size));
}

/** Whether any display setting differs from a fresh visit's: what Reset settings would change. */
export function displayChanged(display: Display): boolean {
  const fresh = FRESH_DISPLAY;
  return (
    display.names !== fresh.names ||
    display.copy !== fresh.copy ||
    display.format !== fresh.format ||
    display.places !== fresh.places ||
    !sameSizes(display.fractions, fresh.fractions) ||
    display.rounding !== fresh.rounding
  );
}

/** Both layers and the display: everything Settings holds, kept apart from the conversion's history. */
export interface Settings {
  rule: ViewRule;
  display: Display;
}

export const FRESH_SETTINGS: Settings = { rule: FRESH_RULE, display: FRESH_DISPLAY };
