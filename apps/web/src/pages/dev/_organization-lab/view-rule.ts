import type { Unit, UnitPreference } from '@bigsmall/core';
import { fixedKeyOf, ownKey, SHOW_KEYS, type FixedKey } from './sections';

/**
 * Which units show (docs/research/organization-lab.md, 2026-10-10). Two layers. The system
 * switches set every category. A unit chosen on its own in a table is an exception, shown or
 * hidden against its switch, and is a layer of its own (Sean, 2026-10-10): the switches, the
 * presets, and Reset settings leave it, and only Unhide (every unit hidden on its own) or the
 * table clears it. The unit in the box always shows, whatever this says (the caller's to apply).
 */
export interface ViewRule {
  /** The system switches: one setting for every category. */
  shown: ReadonlySet<FixedKey>;
  /** Exceptions: units shown or hidden on their own, against their system's switch. */
  overrides: ReadonlyMap<string, boolean>;
}

/** A fresh visit's: every system but Specialist, the Everyday preset (Sean, 2026-10-10). */
export const FRESH_RULE: ViewRule = {
  shown: new Set(SHOW_KEYS.filter((key) => key !== 'specialist')),
  overrides: new Map(),
};

/** Whether the switches differ from a fresh visit's; units chosen on their own are not counted. */
export function switchesChanged(rule: ViewRule): boolean {
  const fresh = FRESH_RULE.shown;
  return rule.shown.size !== fresh.size || [...fresh].some((key) => !rule.shown.has(key));
}

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

/** One system switched on or off, in every category; units chosen on their own stay. */
export function withSystem(rule: ViewRule, key: FixedKey, on: boolean): ViewRule {
  const shown = new Set(rule.shown);
  if (on) shown.add(key);
  else shown.delete(key);
  return { ...rule, shown };
}

/** A whole set of switches (a preset, or Reset settings); units chosen on their own stay. */
export function withSystems(rule: ViewRule, shown: ReadonlySet<FixedKey>): ViewRule {
  return { ...rule, shown };
}

/** The units hidden on their own, in every category. */
export function hiddenByHand(rule: ViewRule): number {
  return [...rule.overrides.values()].filter((show) => !show).length;
}

/** Unhide: every unit hidden on its own back to its switch; those shown on their own stay. */
export function withoutHidden(rule: ViewRule): ViewRule {
  return { ...rule, overrides: new Map([...rule.overrides].filter(([, show]) => show)) };
}
