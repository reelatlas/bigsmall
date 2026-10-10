import { getUnit, unitsIn, type CategoryId, type UnitPreference } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import {
  displayValue,
  FRESH_DISPLAY,
  type Display,
} from '../src/pages/dev/_organization-lab/display';
import { fixedKeyOf, sectionsOf } from '../src/pages/dev/_organization-lab/sections';
import {
  FRESH_RULE,
  groupState,
  presetKeys,
  shows,
  withChoice,
  withSystem,
  withSystems,
} from '../src/pages/dev/_organization-lab/view-rule';

const unit = (id: string) => getUnit(id)!;

function labels(category: CategoryId, preference: UnitPreference) {
  const rows = unitsIn(category).map((each) => ({ unit: each }));
  return sectionsOf(rows, preference).map((section) => section.label);
}

describe('settings lab: sections', () => {
  it('names every section with the same five names, the visitor’s own first, each one headed', () => {
    expect(labels('volume', 'us')).toEqual([
      'US (customary)',
      'Metric',
      'UK (imperial)',
      'Specialist',
    ]);
    expect(labels('volume', 'imperial')).toEqual([
      'UK (imperial)',
      'Metric',
      'US (customary)',
      'Specialist',
    ]);
    expect(labels('volume', 'metric')).toEqual([
      'Metric',
      'US (customary)',
      'UK (imperial)',
      'Specialist',
    ]);
    // A section of one keeps its name, and Other comes before Specialist.
    expect(labels('energy', 'us')[0]).toBe('US (customary)');
    expect(labels('speed', 'us')).toEqual(['US (customary)', 'Metric', 'Other', 'Specialist']);
    // No regions: the everyday units are Everyday, never "Metric" over minutes.
    expect(labels('time', 'us')).toEqual(['Everyday', 'Specialist']);
  });

  it('puts the shared inch with the visitor’s customary section', () => {
    expect(fixedKeyOf(unit('inch'), 'us')).toBe('us');
    expect(fixedKeyOf(unit('inch'), 'metric')).toBe('us');
    expect(fixedKeyOf(unit('inch'), 'imperial')).toBe('uk');
  });
});

describe('settings lab: what shows', () => {
  const everyday = withSystems(FRESH_RULE, presetKeys('everyday', 'us'), 'us');

  it('lets a switch hide a system, and a unit chosen on its own show back', () => {
    expect(shows(unit('nanometer'), everyday, 'us')).toBe(false);
    const back = withChoice(everyday, [unit('nanometer')], true, 'us');
    expect(shows(unit('nanometer'), back, 'us')).toBe(true);
    expect(shows(unit('parsec'), back, 'us')).toBe(false);
  });

  it('records a choice only where it differs from the switch', () => {
    const hidden = withChoice(everyday, [unit('inch')], false, 'us');
    expect(hidden.overrides.get('inch')).toBe(false);
    expect(withChoice(hidden, [unit('inch')], true, 'us').overrides.has('inch')).toBe(false);
  });

  it('sets a system everywhere and clears its exceptions, the last thing done winning', () => {
    // The US box reads "some" with the inch hidden; its checkbox shows the whole system again.
    const noInch = withChoice(everyday, [unit('inch')], false, 'us');
    const us = withSystem(noInch, 'us', true, 'us');
    expect(shows(unit('inch'), us, 'us')).toBe(true);
    // Turning Specialist on and off clears the nanometer shown on its own.
    const back = withChoice(everyday, [unit('nanometer')], true, 'us');
    const off = withSystem(withSystem(back, 'specialist', true, 'us'), 'specialist', false, 'us');
    expect(shows(unit('nanometer'), off, 'us')).toBe(false);
  });

  it('lets a preset clear the exceptions of the systems it changes and keep the rest', () => {
    const chosen = withChoice(
      withChoice(everyday, [unit('inch')], false, 'us'),
      [unit('nanometer')],
      true,
      'us',
    );
    const all = withSystems(chosen, presetKeys('all', 'us'), 'us');
    expect(all.overrides.has('nanometer')).toBe(false);
    expect(all.overrides.get('inch')).toBe(false);
  });

  it('always shows Other, which has no switch', () => {
    expect(shows(unit('knot'), { shown: new Set(), overrides: new Map() }, 'us')).toBe(true);
  });

  it('reads a group as all, some, or none of its units', () => {
    const us = ['inch', 'foot', 'yard', 'mile'].map(unit);
    const one = withChoice(everyday, [unit('inch')], false, 'us');
    expect(groupState(us, (each) => shows(each, everyday, 'us'))).toBe('all');
    expect(groupState(us, (each) => shows(each, one, 'us'))).toBe('some');
    const none = withChoice(everyday, us, false, 'us');
    expect(groupState(us, (each) => shows(each, none, 'us'))).toBe('none');
  });
});

describe('settings lab: display', () => {
  const as = (patch: Partial<Display>) => ({ ...FRESH_DISPLAY, ...patch });
  const text = (value: number, patch: Partial<Display>) =>
    displayValue(value, as(patch), 'en-US')?.text ?? null;

  it('writes decimals to a place, rounded to the nearest, up, or down', () => {
    expect(text(0.473176, { places: 2 })).toBe('0.47');
    expect(text(0.473176, { places: 2, rounding: 'up' })).toBe('0.48');
    expect(text(0.479, { places: 2, rounding: 'down' })).toBe('0.47');
    expect(text(1234.5678, { places: 1 })).toBe('1,234.6');
  });

  it('keeps the table’s own text with no limit, or where the places would read 0', () => {
    expect(text(0.473176, {})).toBeNull();
    expect(text(0.000473, { places: 2 })).toBeNull();
  });

  it('writes fractions in the sizes chosen, the nearest of them, marked when not exact', () => {
    const sixteenths = new Set([2, 4, 8, 16]);
    expect(
      displayValue(6.3, as({ format: 'fraction', denominators: sixteenths }), 'en-US'),
    ).toEqual({ text: '6 5/16', approx: true });
    expect(text(6.3, { format: 'fraction', denominators: new Set([4]) })).toBe('6 1/4');
    expect(text(6.3, { format: 'fraction', denominators: new Set([4]), rounding: 'up' })).toBe(
      '6 1/2',
    );
    expect(text(6.3, { format: 'fraction', denominators: new Set([8]), rounding: 'down' })).toBe(
      '6 1/4',
    );
    expect(displayValue(2.5, as({ format: 'fraction' }), 'en-US')).toEqual({
      text: '2 1/2',
      approx: false,
    });
    expect(text(0.75, { format: 'fraction' })).toBe('3/4');
    expect(text(-1.5, { format: 'fraction' })).toBe('−1 1/2');
    expect(text(0.9999, { format: 'fraction', denominators: new Set([4]) })).toBe('1');
  });

  it('keeps the table’s own text where a fraction would read 0 or the value is too large', () => {
    expect(text(0.001, { format: 'fraction', denominators: new Set([16]) })).toBeNull();
    expect(text(2_000_000, { format: 'fraction' })).toBeNull();
  });
});
