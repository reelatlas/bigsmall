import { getUnit, unitsIn, type CategoryId, type UnitPreference } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import {
  displayChanged,
  displayValue,
  FRESH_DISPLAY,
  stepFractions,
  type Display,
} from '../src/pages/dev/_organization-lab/display';
import { fixedKeyOf, sectionsOf } from '../src/pages/dev/_organization-lab/sections';
import {
  FRESH_RULE,
  groupState,
  presetKeys,
  hiddenByHand,
  presetOf,
  shows,
  switchesChanged,
  withChoice,
  withoutHidden,
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
  const everyday = withSystems(FRESH_RULE, presetKeys('everyday', 'us'));

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

  it('keeps units chosen on their own through the switches and the presets', () => {
    // The inch hidden in a table stays hidden when US is switched off and on again.
    const noInch = withChoice(everyday, [unit('inch')], false, 'us');
    const again = withSystem(withSystem(noInch, 'us', false), 'us', true);
    expect(shows(unit('inch'), again, 'us')).toBe(false);
    // The nanometer shown on its own stays when Specialist is switched on and off.
    const back = withChoice(everyday, [unit('nanometer')], true, 'us');
    const off = withSystem(withSystem(back, 'specialist', true), 'specialist', false);
    expect(shows(unit('nanometer'), off, 'us')).toBe(true);
    const all = withSystems(noInch, presetKeys('all', 'us'));
    expect(all.overrides.get('inch')).toBe(false);
  });

  it('resets the switches apart from the units hidden on their own, and unhides those apart', () => {
    const chosen = withChoice(
      withChoice(withSystem(everyday, 'specialist', true), [unit('inch')], false, 'us'),
      [unit('parsec')],
      false,
      'us',
    );
    expect(switchesChanged(chosen)).toBe(true);
    expect(hiddenByHand(chosen)).toBe(2);
    // Reset settings: the switches as fresh, the inch still hidden.
    const reset = withSystems(chosen, FRESH_RULE.shown);
    expect(switchesChanged(reset)).toBe(false);
    expect(shows(unit('inch'), reset, 'us')).toBe(false);
    // Unhide: the inch back, the switches untouched, a unit shown on its own kept.
    const shown = withChoice(
      withSystem(chosen, 'specialist', false),
      [unit('nanometer')],
      true,
      'us',
    );
    const unhidden = withoutHidden(shown);
    expect(hiddenByHand(unhidden)).toBe(0);
    expect(shows(unit('inch'), unhidden, 'us')).toBe(true);
    expect(shows(unit('nanometer'), unhidden, 'us')).toBe(true);
    expect(unhidden.shown.has('specialist')).toBe(false);
  });

  it('starts with every system but Specialist, the Everyday preset', () => {
    expect(presetOf(FRESH_RULE.shown, 'us')).toBe('everyday');
    expect(shows(unit('parsec'), FRESH_RULE, 'us')).toBe(false);
    expect(switchesChanged(FRESH_RULE)).toBe(false);
    expect(switchesChanged(withSystem(FRESH_RULE, 'specialist', true))).toBe(true);
    // A unit hidden on its own is not a change of the switches.
    expect(switchesChanged(withChoice(FRESH_RULE, [unit('inch')], false, 'us'))).toBe(false);
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

  it('starts with symbols, no copy buttons, and two places, rounded to the nearest', () => {
    expect(FRESH_DISPLAY).toMatchObject({
      names: 'symbol',
      copy: false,
      format: 'decimal',
      places: 2,
      rounding: 'nearest',
    });
    expect(text(0.473176, {})).toBe('0.47');
    // Fractions, once chosen, start in eighths.
    expect(stepFractions(FRESH_DISPLAY.step)).toEqual([
      '1/8',
      '1/4',
      '3/8',
      '1/2',
      '5/8',
      '3/4',
      '7/8',
    ]);
    expect(displayChanged(FRESH_DISPLAY)).toBe(false);
    expect(displayChanged(as({ step: 16 }))).toBe(true);
  });

  it('writes decimals to a place, rounded to the nearest, up, or down', () => {
    expect(text(0.473176, { places: 2 })).toBe('0.47');
    expect(text(0.473176, { places: 2, rounding: 'up' })).toBe('0.48');
    expect(text(0.479, { places: 2, rounding: 'down' })).toBe('0.47');
    expect(text(1234.5678, { places: 1 })).toBe('1,234.6');
    // Float noise never rounds a value down a step: 0.29 × 100 is 28.999… in binary.
    expect(text(0.29, { places: 2, rounding: 'down' })).toBe('0.29');
  });

  it('rounds up toward larger values and down toward smaller, below zero too', () => {
    expect(text(-2.15, { places: 1, rounding: 'up' })).toBe('−2.1');
    expect(text(-2.15, { places: 1, rounding: 'down' })).toBe('−2.2');
    expect(text(-6.3, { format: 'fraction', step: 4, rounding: 'up' })).toBe('−6 1/4');
    expect(text(-6.3, { format: 'fraction', step: 4, rounding: 'down' })).toBe('−6 1/2');
  });

  it('keeps the table’s own text with no limit, or where the places would read 0', () => {
    expect(text(0.473176, { places: null })).toBeNull();
    expect(text(0.000473, { places: 2 })).toBeNull();
  });

  it('writes fractions to the step chosen, in lowest terms, marked when not exact', () => {
    expect(displayValue(6.3, as({ format: 'fraction', step: 16 }), 'en-US')).toEqual({
      text: '6 5/16',
      approx: true,
    });
    expect(text(6.3, { format: 'fraction', step: 4 })).toBe('6 1/4');
    expect(text(6.3, { format: 'fraction', step: 4, rounding: 'up' })).toBe('6 1/2');
    expect(text(6.3, { format: 'fraction', step: 8, rounding: 'down' })).toBe('6 1/4');
    expect(displayValue(2.5, as({ format: 'fraction', step: 64 }), 'en-US')).toEqual({
      text: '2 1/2',
      approx: false,
    });
    expect(text(0.75, { format: 'fraction' })).toBe('3/4');
    expect(text(-1.5, { format: 'fraction' })).toBe('−1 1/2');
    expect(text(0.9999, { format: 'fraction', step: 4 })).toBe('1');
    expect(stepFractions(4)).toEqual(['1/4', '1/2', '3/4']);
  });

  it('keeps the table’s own text where a fraction would read 0 or the value is too large', () => {
    expect(text(0.001, { format: 'fraction', step: 16 })).toBeNull();
    expect(text(2_000_000, { format: 'fraction' })).toBeNull();
  });
});
