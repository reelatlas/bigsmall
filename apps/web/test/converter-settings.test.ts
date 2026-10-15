import { getUnit, unitsIn, type CategoryId, type UnitPreference } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import {
  displayChanged,
  FRESH_DISPLAY,
  FRESH_RULE,
  groupState,
  hiddenByHand,
  litPreset,
  presetKeys,
  presetOf,
  presetRule,
  sectionOf,
  sectionsOf,
  shows,
  systemState,
  withChoice,
  withoutHidden,
  withSystem,
} from '../src/features/converter/settings';
import { initialState, selectTable } from '../src/features/converter/state';

const unit = (id: string) => getUnit(id)!;
const EN = { separators: { decimal: '.', group: ',' } } as const;

function labels(category: CategoryId, preference: UnitPreference) {
  const rows = unitsIn(category).map((each) => ({ unit: each }));
  return sectionsOf(rows, preference).map((section) => section.label);
}

describe('settings: sections', () => {
  it('names every section with the same names, the visitor’s own first, each one headed', () => {
    expect(labels('volume', 'us')).toEqual([
      'US (customary)',
      'Metric',
      'UK (imperial)',
      'Specialty',
    ]);
    expect(labels('volume', 'imperial')[0]).toBe('UK (imperial)');
    expect(labels('volume', 'metric')[0]).toBe('Metric');
    // Other comes before Specialty; a category with no regions is Standard, never "Metric".
    expect(labels('speed', 'us')).toEqual(['US (customary)', 'Metric', 'Other', 'Specialty']);
    expect(labels('time', 'us')).toEqual(['Standard', 'Specialty']);
  });

  it('puts the shared inch with the visitor’s customary section', () => {
    expect(sectionOf(unit('inch'), 'us')).toBe('us');
    expect(sectionOf(unit('inch'), 'imperial')).toBe('uk');
  });
});

describe('settings: what shows', () => {
  it('starts with every system but Specialty, the Standard preset', () => {
    expect(presetOf(FRESH_RULE.shown, 'us')).toBe('standard');
    expect(shows(unit('parsec'), FRESH_RULE, 'us')).toBe(false);
    expect(shows(unit('knot'), { shown: new Set(), overrides: new Map() }, 'us')).toBe(true);
    // A unit hidden on its own leaves the switches as they were.
    expect(presetOf(withChoice(FRESH_RULE, [unit('inch')], false, 'us').shown, 'us')).toBe(
      'standard',
    );
  });

  it("makes a switch's change final for its system, other systems' choices staying, and a preset exact", () => {
    const noInch = withChoice(FRESH_RULE, [unit('inch')], false, 'us');
    const both = withChoice(noInch, [unit('nanometer')], true, 'us');
    expect(
      shows(
        unit('inch'),
        withSystem(withSystem(noInch, 'us', false, 'us'), 'us', true, 'us'),
        'us',
      ),
    ).toBe(true);
    // Specialty unchecked hides every specialist unit, one shown on its own too; US's choice stays.
    const off = withSystem(both, 'specialist', false, 'us');
    expect(shows(unit('nanometer'), off, 'us')).toBe(false);
    expect(off.overrides.get('inch')).toBe(false);
    expect(presetRule(presetKeys('all', 'us')).overrides.size).toBe(0);
    // A choice that agrees with its switch records nothing.
    expect(withChoice(noInch, [unit('inch')], true, 'us').overrides.has('inch')).toBe(false);
  });

  it('unhides the units hidden on their own, keeping those shown on their own and the switches', () => {
    const rule = withChoice(
      withChoice(FRESH_RULE, [unit('inch')], false, 'us'),
      [unit('nanometer')],
      true,
      'us',
    );
    expect(hiddenByHand(rule)).toBe(1);
    const unhidden = withoutHidden(rule);
    expect(shows(unit('inch'), unhidden, 'us')).toBe(true);
    expect(shows(unit('nanometer'), unhidden, 'us')).toBe(true);
    expect(presetOf(unhidden.shown, 'us')).toBe('standard');
  });

  it('reads a system as all, some, or none of its units, units chosen on their own counted', () => {
    expect(systemState(FRESH_RULE, 'specialist', 'us')).toBe('none');
    expect(systemState(FRESH_RULE, 'us', 'us')).toBe('all');
    const nanometer = withChoice(FRESH_RULE, [unit('nanometer')], true, 'us');
    expect(systemState(nanometer, 'specialist', 'us')).toBe('some');
    expect(systemState(nanometer, 'us', 'us')).toBe('all');
    // No preset is lit while a unit is chosen on its own.
    expect(litPreset(nanometer, 'us')).toBeNull();
    expect(litPreset(FRESH_RULE, 'us')).toBe('standard');
  });

  it('reads a group as all, some, or none of its units', () => {
    const us = ['inch', 'foot', 'yard', 'mile'].map(unit);
    const one = withChoice(FRESH_RULE, [unit('inch')], false, 'us');
    expect(groupState(us, (each) => shows(each, FRESH_RULE, 'us'))).toBe('all');
    expect(groupState(us, (each) => shows(each, one, 'us'))).toBe('some');
  });
});

describe('settings: how it looks', () => {
  it('starts with symbols, no copy buttons, two places, the nearest, eighths in waiting', () => {
    expect(FRESH_DISPLAY).toMatchObject({
      names: 'symbol',
      copy: false,
      format: 'decimal',
      places: 2,
      rounding: 'nearest',
    });
    expect([...FRESH_DISPLAY.fractions].sort((a, b) => a - b)).toEqual([2, 4, 8]);
    expect(displayChanged(FRESH_DISPLAY)).toBe(false);
    expect(displayChanged({ ...FRESH_DISPLAY, fractions: new Set([8, 4, 2]) })).toBe(false);
    expect(displayChanged({ ...FRESH_DISPLAY, format: 'both' })).toBe(true);
  });
});

describe('the table and the matches, by the settings', () => {
  const volume = { ...initialState, text: '2', unit: 'us-cup', category: 'volume' } as const;

  it('lists the shown units in their sections, in the cursor’s order, the hidden apart', () => {
    const view = selectTable(volume, { ...EN, system: 'us', rule: FRESH_RULE });
    if (view.kind !== 'units') throw new Error(view.kind);
    expect(view.sections.map((section) => section.label)).toEqual([
      'US (customary)',
      'Metric',
      'UK (imperial)',
    ]);
    expect(view.rows).toEqual(view.sections.flatMap((section) => section.rows));
    expect(view.hidden.map((section) => section.label)).toEqual(['Specialty']);
    expect(view.all).toHaveLength(unitsIn('volume').length);
    expect(view.announcement).toBe(`2 cups in ${view.rows.length} units of volume`);
  });

  it('always shows the unit in the box', () => {
    const rule = withChoice(FRESH_RULE, [unit('us-cup')], false, 'us');
    const view = selectTable(volume, { ...EN, system: 'us', rule });
    if (view.kind !== 'units') throw new Error(view.kind);
    expect(view.rows.some((row) => row.id === 'us-cup')).toBe(true);
  });

  it('shows every unit without a rule, as before Settings', () => {
    const view = selectTable(volume, { ...EN, system: 'us' });
    if (view.kind !== 'units') throw new Error(view.kind);
    expect(view.rows).toHaveLength(unitsIn('volume').length);
    expect(view.hidden).toEqual([]);
  });

  it('leaves hidden units out of the matches, offered apart under their section’s name', () => {
    const view = selectTable(
      { ...initialState, text: '2 cubic' },
      { ...EN, system: 'us', rule: FRESH_RULE },
    );
    if (view.kind !== 'matches') throw new Error(view.kind);
    expect(view.rows.filter((row) => row.kind === 'unit')).toHaveLength(0);
    expect(view.hidden.length).toBeGreaterThan(0);
    expect(view.hidden[0]).toMatchObject({ section: 'Specialty' });
    expect(view.announcement).toBe('Only hidden units match');
  });
});
