import type { UnitPreference } from './region';
import type { LinearUnit, Unit, UnitSystem } from './types';

/** The systems a visitor of each preference reads as their own units. */
const OWN: Record<UnitPreference, readonly UnitSystem[]> = {
  us: ['us', 'imperial'],
  imperial: ['uk', 'imperial'],
  metric: ['si', 'metric'],
};

/** The other main system for each preference: metric for US and UK visitors, and the reverse. */
const OTHER: Record<UnitPreference, readonly UnitSystem[]> = {
  us: ['si', 'metric'],
  imperial: ['si', 'metric'],
  metric: ['imperial', 'us', 'uk'],
};

/** 0 for the visitor's own system, 1 for the other main one, 2 for units of neither (knots). */
function systemGroup(system: UnitSystem, preference: UnitPreference): number {
  if (OWN[preference].includes(system)) return 0;
  if (OTHER[preference].includes(system)) return 1;
  return 2;
}

/**
 * The order a category's units are listed in with nothing typed (docs/UX-SPEC.md §3, ADR 0011):
 * the visitor's own system first, then the other main system, then units of neither, each group
 * smallest to largest; units of one size keep the catalog's order, most common first. Size orders
 * only units with a plain factor: where a unit has an offset (temperature) or is a reciprocal
 * (fuel economy), the catalog's everyday order stands, the visitor's own everyday unit first.
 * With no preference, metric leads, as the international default.
 */
export function orderUnits(units: readonly Unit[], preference: UnitPreference = 'metric'): Unit[] {
  const linear = units.filter((unit): unit is LinearUnit => unit.kind === 'linear');
  if (linear.length === units.length) {
    return linear
      .map((unit, index) => ({ unit, index, group: systemGroup(unit.system, preference) }))
      .sort((a, b) => a.group - b.group || a.unit.factor - b.unit.factor || a.index - b.index)
      .map(({ unit }) => unit);
  }
  const everyday = units.find((unit) => systemGroup(unit.system, preference) === 0);
  return everyday ? [everyday, ...units.filter((unit) => unit !== everyday)] : [...units];
}
