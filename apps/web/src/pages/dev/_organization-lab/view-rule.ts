import { getUnit, type Unit, type UnitPreference } from '@bigsmall/core';
import type { TableRow } from '../../../features/converter/state';
import { fixedKeyOf, ownKey, SHOW_KEYS, type FixedKey } from './sections';

/**
 * The rule options E to I share (docs/research/organization-lab.md, 2026-10-10): the system
 * switches set what shows in every category; a unit chosen on its own overrides its switch either
 * way; a section's checkbox reads all, some, or none of its units, and sets them all.
 */
export interface ViewRule {
  /** The system switches: one setting for every category. */
  shown: ReadonlySet<FixedKey>;
  /** Units chosen on their own, shown or not, where that differs from their system's switch. */
  overrides: ReadonlyMap<string, boolean>;
}

export type ShowPreset = 'all' | 'everyday' | 'yours';

export const SHOW_PRESETS: ReadonlyArray<{ id: ShowPreset; name: string }> = [
  { id: 'all', name: 'All units' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'yours', name: 'Your units' },
];

export function presetKeys(preset: ShowPreset, preference: UnitPreference): ReadonlySet<FixedKey> {
  if (preset === 'all') return new Set(SHOW_KEYS);
  if (preset === 'everyday') return new Set(SHOW_KEYS.filter((key) => key !== 'specialist'));
  return new Set([ownKey(preference)]);
}

/** The preset the switches match, by name, or Custom. */
export function presetName(shown: ReadonlySet<FixedKey>, preference: UnitPreference): string {
  const same = (keys: ReadonlySet<FixedKey>) =>
    keys.size === shown.size && [...keys].every((key) => shown.has(key));
  return SHOW_PRESETS.find((preset) => same(presetKeys(preset.id, preference)))?.name ?? 'Custom';
}

/** What the switches show: Other, and a category's everyday units where it has no regions, always. */
export function bySystem(
  unit: Unit,
  shown: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): boolean {
  const key = fixedKeyOf(unit, preference);
  return key === 'everyday' || key === 'other' || shown.has(key);
}

/** Whether a row shows: the unit in the box always, else its own choice, else its switch. */
export function unitShown(row: TableRow, rule: ViewRule, preference: UnitPreference): boolean {
  if (row.inBox) return true;
  return rule.overrides.get(row.id) ?? bySystem(row.unit, rule.shown, preference);
}

export type GroupState = 'all' | 'some' | 'none';

/** A section's checkbox: all of its units shown, some (a dash), or none. */
export function groupState(
  rows: readonly TableRow[],
  shows: (row: TableRow) => boolean,
): GroupState {
  const count = rows.filter(shows).length;
  if (count === rows.length) return 'all';
  return count === 0 ? 'none' : 'some';
}

/** Units chosen one by one: an override where it differs from the switches, none where it agrees. */
export function withChoice<T extends ViewRule>(
  rule: T,
  rows: readonly TableRow[],
  show: boolean,
  preference: UnitPreference,
): T {
  const overrides = new Map(rule.overrides);
  for (const row of rows) {
    if (row.inBox) continue;
    if (bySystem(row.unit, rule.shown, preference) === show) overrides.delete(row.id);
    else overrides.set(row.id, show);
  }
  return { ...rule, overrides };
}

/** New switches, dropping the single-unit choices they now agree with. */
export function withSystems<T extends ViewRule>(
  rule: T,
  shown: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): T {
  const overrides = new Map(rule.overrides);
  for (const [id, show] of overrides) {
    const unit = getUnit(id);
    if (!unit || bySystem(unit, shown, preference) === show) overrides.delete(id);
  }
  return { ...rule, shown, overrides };
}
