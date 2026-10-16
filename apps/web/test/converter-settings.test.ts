import { getUnit, unitsIn, type CategoryId, type UnitPreference } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import {
  displayChanged,
  FRESH_DISPLAY,
  FRESH_RULE,
  byHand,
  defaultOrder,
  FRESH_SETTINGS,
  hiddenByHand,
  orderChanged,
  orderOf,
  presetKeys,
  presetOf,
  presetRule,
  sectionOf,
  sectionsOf,
  settingsFrom,
  shownChoice,
  shows,
  storedOf,
  systemState,
  withChoice,
  withCustomPicked,
  withOrder,
  withoutHidden,
  withPresetPicked,
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
    // Other is a switch like the systems (Sean, 2026-10-15): on in the Standard preset, off with it.
    expect(shows(unit('knot'), FRESH_RULE, 'us')).toBe(true);
    expect(shows(unit('knot'), { shown: new Set(), overrides: new Map() }, 'us')).toBe(false);
    // Standard, a category with no regional system, always shows.
    expect(shows(unit('second'), { shown: new Set(), overrides: new Map() }, 'us')).toBe(true);
    // A unit hidden on its own leaves the switches as they were.
    expect(presetOf(withChoice(FRESH_RULE, [unit('inch')], false, 'us').shown, 'us')).toBe(
      'standard',
    );
  });

  it("makes a switch's change final for its system, other systems' choices staying, and a preset exact", () => {
    const noInch = withChoice(FRESH_RULE, [unit('inch')], false, 'us');
    const both = withChoice(noInch, [unit('mil')], true, 'us');
    expect(
      shows(
        unit('inch'),
        withSystem(withSystem(noInch, 'us', false, 'us'), 'us', true, 'us'),
        'us',
      ),
    ).toBe(true);
    // Specialty unchecked hides every specialty unit, one shown on its own too; US's choice stays.
    const off = withSystem(both, 'specialty', false, 'us');
    expect(shows(unit('mil'), off, 'us')).toBe(false);
    expect(off.overrides.get('inch')).toBe(false);
    expect(presetRule(presetKeys('all', 'us')).overrides.size).toBe(0);
    // A choice that agrees with its switch records nothing.
    expect(withChoice(noInch, [unit('inch')], true, 'us').overrides.has('inch')).toBe(false);
  });

  it('unhides the units hidden on their own, keeping those shown on their own and the switches', () => {
    const rule = withChoice(
      withChoice(FRESH_RULE, [unit('inch')], false, 'us'),
      [unit('mil')],
      true,
      'us',
    );
    expect(hiddenByHand(rule)).toBe(1);
    const unhidden = withoutHidden(rule);
    expect(shows(unit('inch'), unhidden, 'us')).toBe(true);
    expect(shows(unit('mil'), unhidden, 'us')).toBe(true);
    expect(presetOf(unhidden.shown, 'us')).toBe('standard');
  });

  it('reads a system as all, some, or none of its units, units chosen on their own counted', () => {
    expect(systemState(FRESH_RULE, 'specialty', 'us')).toBe('none');
    expect(systemState(FRESH_RULE, 'us', 'us')).toBe('all');
    const mil = withChoice(FRESH_RULE, [unit('mil')], true, 'us');
    expect(systemState(mil, 'specialty', 'us')).toBe('some');
    expect(systemState(mil, 'us', 'us')).toBe('all');
    // Custom lights while a unit is chosen on its own.
    const on = (rule: typeof FRESH_RULE) => ({ ...FRESH_SETTINGS, rule });
    expect(shownChoice(on(mil), 'us')).toBe('custom');
    expect(shownChoice(FRESH_SETTINGS, 'us')).toBe('standard');
    expect(shownChoice(on(withSystem(FRESH_RULE, 'uk', false, 'us')), 'us')).toBe('custom');
  });

  it("orders the sections as set: the visitor's own first on a fresh visit, Standard first, Other a system like the rest", () => {
    expect(defaultOrder('us')).toEqual(['us', 'metric', 'uk', 'other', 'specialty']);
    expect(defaultOrder('metric')).toEqual(['metric', 'us', 'uk', 'other', 'specialty']);
    const moved = withOrder(FRESH_SETTINGS, 'specialty', 0, 'us');
    expect(orderOf(moved, 'us')).toEqual(['specialty', 'us', 'metric', 'uk', 'other']);
    expect(orderChanged(moved, 'us')).toBe(true);
    expect(orderChanged(withOrder(moved, 'specialty', 9, 'us'), 'us')).toBe(false);
    for (const category of ['speed', 'pressure', 'time'] as const) {
      const rows = unitsIn(category).map((each) => ({ unit: each }));
      const present = new Set(rows.map((row) => sectionOf(row.unit, 'us')));
      // Other where it is set, as any system: here between UK and Specialty.
      const order = ['uk', 'other', 'specialty', 'metric', 'us'] as const;
      expect(sectionsOf(rows, 'us', order).map((section) => section.key)).toEqual(
        ['standard', 'uk', 'other', 'specialty', 'metric', 'us'].filter((key) =>
          present.has(key as never),
        ),
      );
    }
  });

  it('keeps a custom set aside when a preset is picked, and Custom brings it back', () => {
    // Custom is always in reach: picked on a fresh visit, what shows becomes the visitor's own.
    const picked = withCustomPicked(FRESH_SETTINGS);
    expect(shownChoice(picked, 'us')).toBe('custom');
    expect(picked.rule).toBe(FRESH_RULE);
    // A change by hand puts the visitor on Custom, and it stays lit even matching a preset.
    const noInch = withChoice(FRESH_RULE, [unit('inch')], false, 'us');
    const custom = byHand(FRESH_SETTINGS, noInch);
    expect(shownChoice(custom, 'us')).toBe('custom');
    expect(shownChoice(byHand(custom, FRESH_RULE), 'us')).toBe('custom');
    const all = withPresetPicked(custom, 'all', 'us');
    expect(shownChoice(all, 'us')).toBe('all');
    expect(shows(unit('inch'), all.rule, 'us')).toBe(true);
    // A preset picked over a preset keeps the set already aside.
    const standard = withPresetPicked(all, 'standard', 'us');
    expect(standard.kept).toBe(noInch);
    const back = withCustomPicked(standard);
    expect(shows(unit('inch'), back.rule, 'us')).toBe(false);
    expect(shownChoice(back, 'us')).toBe('custom');
  });

  it('reads remembered settings back as they were, and anything that does not read as a fresh part', () => {
    const settings = {
      ...withOrder(
        byHand(FRESH_SETTINGS, withChoice(FRESH_RULE, [unit('inch')], false, 'us')),
        'uk',
        0,
        'us',
      ),
      display: {
        ...FRESH_DISPLAY,
        format: 'both' as const,
        places: null,
        fractions: new Set([2, 5] as const),
      },
    };
    const stored = JSON.parse(JSON.stringify(storedOf(settings)));
    // Display keeps only what was changed, so a later default reaches what was never chosen.
    expect(Object.keys(stored.display).sort()).toEqual(['format', 'fractions', 'places']);
    const back = settingsFrom(stored)!;
    expect(back.custom).toBe(true);
    expect(back.order).toEqual(['uk', 'us', 'metric', 'other', 'specialty']);
    expect(shows(unit('inch'), back.rule, 'us')).toBe(false);
    expect([...back.rule.shown].sort()).toEqual([...settings.rule.shown].sort());
    expect(back.display).toEqual(settings.display);
    // Units gone since, and parts that do not read, fall away; what is not settings is none.
    const odd = settingsFrom({
      v: 3,
      rule: {
        shown: ['metric', 'martian'],
        overrides: [
          ['no-such-unit', true],
          ['inch', 'yes'],
        ],
      },
      order: ['us', 'us'],
      display: { names: 'loud', places: 7, fractions: [5, 9] },
    })!;
    expect([...odd.rule.shown]).toEqual(['metric']);
    expect(odd.rule.overrides.size).toBe(0);
    expect(odd.order).toBeNull();
    expect(odd.display.names).toBe('both');
    expect(odd.display.places).toBe(2);
    expect([...odd.display.fractions]).toEqual([5]);
    // Version 1 stored every display setting: its names, maybe the old default, take today's.
    const first = settingsFrom({
      v: 1,
      rule: { shown: ['metric'], overrides: [] },
      display: { names: 'symbol', places: 3 },
    })!;
    expect(first.display.names).toBe('both');
    expect(first.display.places).toBe(3);
    // Before version 3 Other had no switch and always showed: it comes back on, after the last
    // regional system in a stored order.
    const older = settingsFrom({
      v: 2,
      rule: { shown: ['us', 'metric'], overrides: [] },
      order: ['specialist', 'uk', 'us', 'metric'],
    })!;
    expect(older.rule.shown.has('other')).toBe(true);
    expect(older.order).toEqual(['specialty', 'uk', 'us', 'metric', 'other']);
    // Before version 4 Specialty's key was "specialist": switched on, kept aside, or ordered, it
    // reads as "specialty", so nobody's choices are lost (Sean, 2026-10-16).
    const before4 = settingsFrom({
      v: 3,
      rule: { shown: ['metric', 'other', 'specialist'], overrides: [] },
      kept: { shown: ['us', 'specialist'], overrides: [] },
      custom: true,
      order: ['specialist', 'metric', 'us', 'uk', 'other'],
    })!;
    expect([...before4.rule.shown].sort()).toEqual(['metric', 'other', 'specialty']);
    expect([...before4.kept!.shown].sort()).toEqual(['specialty', 'us']);
    expect(before4.order).toEqual(['specialty', 'metric', 'us', 'uk', 'other']);
    expect(storedOf(before4).v).toBe(4);
    expect(settingsFrom(null)).toBeNull();
    expect(settingsFrom({ v: 2 })).toBeNull();
    expect(settingsFrom({ v: 5, rule: { shown: [], overrides: [] } })).toBeNull();
  });
});

describe('settings: how it looks', () => {
  it('starts with symbols and names, two places, the nearest, eighths in waiting', () => {
    expect(FRESH_DISPLAY).toMatchObject({
      names: 'both',
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
      { ...initialState, text: '2 cubic in' },
      { ...EN, system: 'us', rule: FRESH_RULE },
    );
    if (view.kind !== 'matches') throw new Error(view.kind);
    expect(view.rows.filter((row) => row.kind === 'unit')).toHaveLength(0);
    expect(view.hidden.length).toBeGreaterThan(0);
    expect(view.hidden[0]).toMatchObject({ section: 'Specialty' });
    expect(view.announcement).toBe('Only hidden units match');
  });
});
