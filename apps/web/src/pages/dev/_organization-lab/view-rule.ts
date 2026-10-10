import { getUnit, type Unit, type UnitPreference } from '@bigsmall/core';
import { fixedKeyOf, ownKey, SHOW_KEYS, type FixedKey } from './sections';

/**
 * Which units show (docs/research/organization-lab.md, 2026-10-10). The system switches set every
 * category; a unit chosen on its own is an exception, shown or hidden against its switch; turning a
 * switch sets that system everywhere and clears its exceptions, so the last thing done wins at the
 * scope it was done. The unit in the box always shows, whatever this says (the caller's to apply).
 */
export interface ViewRule {
  /** The system switches: one setting for every category. */
  shown: ReadonlySet<FixedKey>;
  /** Exceptions: units shown or hidden on their own, against their system's switch. */
  overrides: ReadonlyMap<string, boolean>;
}

export const FRESH_RULE: ViewRule = { shown: new Set(SHOW_KEYS), overrides: new Map() };

export type ShowPreset = 'all' | 'everyday' | 'region';

export const SHOW_PRESETS: ReadonlyArray<{ id: ShowPreset; name: string }> = [
  { id: 'all', name: 'All units' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'region', name: 'Your region' },
];

export function presetKeys(preset: ShowPreset, preference: UnitPreference): ReadonlySet<FixedKey> {
  if (preset === 'all') return new Set(SHOW_KEYS);
  if (preset === 'everyday') return new Set(SHOW_KEYS.filter((key) => key !== 'specialist'));
  return new Set([ownKey(preference)]);
}

/** The preset the switches match, or null for a custom set. */
export function presetOf(
  shown: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): ShowPreset | null {
  const same = (keys: ReadonlySet<FixedKey>) =>
    keys.size === shown.size && [...keys].every((key) => shown.has(key));
  return SHOW_PRESETS.find((preset) => same(presetKeys(preset.id, preference)))?.id ?? null;
}

/** What the switches alone show: Other, and a category's everyday units where it has no regions, always. */
export function bySystem(
  unit: Unit,
  shown: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): boolean {
  const key = fixedKeyOf(unit, preference);
  return key === 'everyday' || key === 'other' || shown.has(key);
}

/** Whether a unit shows: its exception, if it has one, else its switch. */
export function shows(unit: Unit, rule: ViewRule, preference: UnitPreference): boolean {
  return rule.overrides.get(unit.id) ?? bySystem(unit, rule.shown, preference);
}

export type GroupState = 'all' | 'some' | 'none';

/** A section's or a system's checkbox: all of its units shown, some (a dash), or none. */
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

/** One system switched on or off, in every category, its exceptions everywhere cleared. */
export function withSystem(
  rule: ViewRule,
  key: FixedKey,
  on: boolean,
  preference: UnitPreference,
): ViewRule {
  const shown = new Set(rule.shown);
  if (on) shown.add(key);
  else shown.delete(key);
  return clearedFor(rule, shown, new Set([key]), preference);
}

/** A whole set of switches (a preset): each system that changes clears its exceptions. */
export function withSystems(
  rule: ViewRule,
  shown: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): ViewRule {
  const changed = new Set(SHOW_KEYS.filter((key) => rule.shown.has(key) !== shown.has(key)));
  return clearedFor(rule, shown, changed, preference);
}

function clearedFor(
  rule: ViewRule,
  shown: ReadonlySet<FixedKey>,
  keys: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): ViewRule {
  const overrides = new Map(rule.overrides);
  for (const id of overrides.keys()) {
    const unit = getUnit(id);
    if (!unit || keys.has(fixedKeyOf(unit, preference))) overrides.delete(id);
  }
  return { shown, overrides };
}

/** How many of these units are exceptions. */
export function exceptionsIn(rule: ViewRule, units: readonly Unit[]): number {
  return units.filter((unit) => rule.overrides.has(unit.id)).length;
}

/** These units back to their switches. */
export function withoutExceptions(rule: ViewRule, units: readonly Unit[]): ViewRule {
  const overrides = new Map(rule.overrides);
  for (const unit of units) overrides.delete(unit.id);
  return { ...rule, overrides };
}
