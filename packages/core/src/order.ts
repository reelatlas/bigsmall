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

/**
 * The unit's group in the list: 0 for an everyday unit of the visitor's own system, 1 of the
 * other main one, 2 of neither (knots), and 3 for every specialist unit, whatever its system.
 */
function listGroup(unit: Unit, preference: UnitPreference): number {
  if (unit.tier !== 'basic') return 3;
  if (OWN[preference].includes(unit.system)) return 0;
  if (OTHER[preference].includes(unit.system)) return 1;
  return 2;
}

/**
 * A unit's group in the listed order: an everyday unit of the visitor's own system, of the other
 * main one, or of neither, or a specialist unit of any system. The table's headings are the web's
 * (`sectionOf` in apps/web's settings.ts).
 */
export type ListGroup = 'own' | 'other' | 'neither' | 'specialist';

const LIST_GROUPS: readonly ListGroup[] = ['own', 'other', 'neither', 'specialist'];

/** The group `orderUnits` lists the unit in for a visitor of this preference. */
export function unitListGroup(unit: Unit, preference: UnitPreference = 'metric'): ListGroup {
  return LIST_GROUPS[listGroup(unit, preference)] ?? 'neither';
}

/**
 * The order a category's units are listed in with nothing typed (docs/UX-SPEC.md §3, ADR 0011,
 * ADR 0016): the everyday units of the visitor's own system first, then of the other main system,
 * then of neither, then the specialist units of every system, each group smallest to largest;
 * units of one size keep the catalog's order, most common first. Size orders
 * only units with a plain factor: where a unit has an offset (temperature) or is a reciprocal
 * (fuel economy), the catalog's everyday order stands, the visitor's own everyday unit first.
 * With no preference, metric leads, as the international default.
 */
export function orderUnits(units: readonly Unit[], preference: UnitPreference = 'metric'): Unit[] {
  const linear = units.filter((unit): unit is LinearUnit => unit.kind === 'linear');
  if (linear.length === units.length) {
    return linear
      .map((unit, index) => ({ unit, index, group: listGroup(unit, preference) }))
      .sort((a, b) => a.group - b.group || a.unit.factor - b.unit.factor || a.index - b.index)
      .map(({ unit }) => unit);
  }
  const everyday = units.find((unit) => listGroup(unit, preference) === 0);
  return everyday ? [everyday, ...units.filter((unit) => unit !== everyday)] : [...units];
}
