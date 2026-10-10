import { unitsIn, type CategoryId, type UnitPreference } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import {
  categoriesWithJobs,
  familyChips,
  fixedKeyOf,
  sectionsFor,
  showsInFamilies,
  showsInPreset,
} from '../src/pages/dev/_organization-lab/sections';
import {
  groupState,
  unitShown,
  withChoice,
  withSystems,
  type ViewRule,
} from '../src/pages/dev/_organization-lab/view-rule';
import type { TableRow } from '../src/features/converter/state';

function rows(category: CategoryId) {
  return unitsIn(category).map((unit) => ({ id: unit.id, unit }));
}

function labels(category: CategoryId, idea: 'earned' | 'jobs', preference: UnitPreference) {
  return sectionsFor(rows(category), idea, preference).map((section) => section.label);
}

describe('organization lab groupings', () => {
  it('gives every unit of a jobbed category exactly one job', () => {
    for (const category of categoriesWithJobs()) {
      const sections = sectionsFor(rows(category), 'jobs', 'us');
      const ids = sections.flatMap((section) => section.rows.map((row) => row.id));
      expect(sections.some((section) => section.label === 'Left over')).toBe(false);
      expect(ids.slice().sort()).toEqual(
        unitsIn(category)
          .map((unit) => unit.id)
          .sort(),
      );
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('leads with the visitor’s own everyday jobs', () => {
    expect(labels('length', 'jobs', 'us')).toEqual([
      'US customary',
      'Metric',
      'Very small',
      'Nautical',
      'Survey',
      'Astronomy',
    ]);
    expect(labels('length', 'jobs', 'metric')[0]).toBe('Metric');
    expect(labels('volume', 'jobs', 'us')).toEqual(['Cooking', 'Metric', 'UK', 'Cubic', 'Trade']);
    expect(labels('volume', 'jobs', 'metric')[0]).toBe('Metric');
    expect(labels('energy', 'jobs', 'us')[0]).toBe('Heat');
    expect(labels('data', 'jobs', 'us')).toEqual(['Decimal', 'Bits', 'Binary']);
  });

  it('names a listed-order run only when it has two or more units', () => {
    expect(labels('length', 'earned', 'us')).toEqual(['US customary', 'Metric', 'More units']);
    const energy = sectionsFor(rows('energy'), 'earned', 'us');
    expect(energy[0]?.label).toBeNull();
    expect(energy[0]?.rows.map((row) => row.id)).toEqual(['british-thermal-unit']);
    expect(energy[1]?.label).toBe('Metric');
    expect(labels('time', 'earned', 'us')).toEqual([null, 'More units']);
    expect(labels('temperature', 'jobs', 'us')).toEqual([null, 'More units']);
  });

  it('treats Mine as your everyday system, and as every everyday unit when there is no region', () => {
    const length = unitsIn('length');
    const mine = length.filter((unit) => showsInPreset(unit, 'mine', 'us')).map((unit) => unit.id);
    expect(mine.slice().sort()).toEqual(['foot', 'inch', 'mile', 'yard']);
    const energy = unitsIn('energy').filter((unit) => showsInPreset(unit, 'mine', 'us'));
    expect(energy.map((unit) => unit.id)).toEqual(['british-thermal-unit']);
    const data = unitsIn('data').filter((unit) => showsInPreset(unit, 'mine', 'us'));
    expect(data.some((unit) => unit.id === 'gigabyte')).toBe(true);
    expect(data.some((unit) => unit.id === 'kibibyte')).toBe(false);
  });

  it('offers region switches only where a region names the units', () => {
    expect(familyChips('length')).toEqual(['metric', 'customary', 'more']);
    expect(familyChips('volume')).toEqual(['metric', 'us', 'uk', 'more']);
    expect(familyChips('data')).toEqual(['more']);
    expect(familyChips('time')).toEqual(['more']);
    const minute = unitsIn('time').find((unit) => unit.id === 'minute')!;
    const nano = unitsIn('time').find((unit) => unit.id === 'nanosecond')!;
    expect(showsInFamilies(minute, new Set())).toBe(true);
    expect(showsInFamilies(nano, new Set())).toBe(false);
    const inch = unitsIn('length').find((unit) => unit.id === 'inch')!;
    const ounce = unitsIn('mass').find((unit) => unit.id === 'ounce')!;
    const stone = unitsIn('mass').find((unit) => unit.id === 'stone')!;
    const btu = unitsIn('energy').find((unit) => unit.id === 'british-thermal-unit')!;
    expect(showsInFamilies(inch, new Set(['customary']))).toBe(true);
    expect(showsInFamilies(inch, new Set())).toBe(false);
    expect(showsInFamilies(ounce, new Set(['us']))).toBe(true);
    expect(showsInFamilies(stone, new Set(['us']))).toBe(false);
    expect(showsInFamilies(stone, new Set(['uk']))).toBe(true);
    expect(showsInFamilies(btu, new Set(['us']))).toBe(true);
    expect(showsInFamilies(btu, new Set())).toBe(false);
  });

  it('names every section with the same five names, the visitor’s own first, each one headed', () => {
    const fixed = (category: CategoryId, preference: UnitPreference) =>
      sectionsFor(rows(category), 'fixed', preference).map((section) => section.label);
    expect(fixed('volume', 'us')).toEqual([
      'US (customary)',
      'Metric',
      'UK (imperial)',
      'Specialist',
    ]);
    expect(fixed('volume', 'imperial')).toEqual([
      'UK (imperial)',
      'Metric',
      'US (customary)',
      'Specialist',
    ]);
    expect(fixed('volume', 'metric')).toEqual([
      'Metric',
      'US (customary)',
      'UK (imperial)',
      'Specialist',
    ]);
    // A section of one keeps its name, and Other comes before Specialist.
    expect(fixed('energy', 'us')[0]).toBe('US (customary)');
    expect(fixed('speed', 'us')).toEqual(['US (customary)', 'Metric', 'Other', 'Specialist']);
    // No regions: the everyday units are Everyday, never "Metric" over minutes.
    expect(fixed('time', 'us')).toEqual(['Everyday', 'Specialist']);
  });

  it('puts the shared inch with the visitor’s customary section', () => {
    const inch = unitsIn('length').find((unit) => unit.id === 'inch')!;
    expect(fixedKeyOf(inch, 'us')).toBe('us');
    expect(fixedKeyOf(inch, 'metric')).toBe('us');
    expect(fixedKeyOf(inch, 'imperial')).toBe('uk');
  });

  describe('the rule options E to I share', () => {
    const row = (id: string, inBox = false): TableRow => {
      const unit = unitsIn('length').find((each) => each.id === id)!;
      return {
        unit,
        id,
        name: unit.plural,
        symbol: unit.symbol,
        value: null,
        text: '—',
        tone: 'empty',
        inBox,
      };
    };
    const everyday: ViewRule = { shown: new Set(['metric', 'us', 'uk']), overrides: new Map() };

    it('lets a switch hide a system, a single choice show one back, and the box keep its unit', () => {
      expect(unitShown(row('nanometer'), everyday, 'us')).toBe(false);
      const shownBack = withChoice(everyday, [row('nanometer')], true, 'us');
      expect(unitShown(row('nanometer'), shownBack, 'us')).toBe(true);
      expect(unitShown(row('parsec', true), everyday, 'us')).toBe(true);
    });

    it('records a choice only where it differs from the switch', () => {
      const hidden = withChoice(everyday, [row('inch')], false, 'us');
      expect(hidden.overrides.get('inch')).toBe(false);
      expect(withChoice(hidden, [row('inch')], true, 'us').overrides.has('inch')).toBe(false);
    });

    it('reads a section as all, some, or none of its units', () => {
      const us = ['inch', 'foot', 'yard', 'mile'].map((id) => row(id));
      const one = withChoice(everyday, [row('inch')], false, 'us');
      expect(groupState(us, (each) => unitShown(each, everyday, 'us'))).toBe('all');
      expect(groupState(us, (each) => unitShown(each, one, 'us'))).toBe('some');
      const none = withChoice(everyday, us, false, 'us');
      expect(groupState(us, (each) => unitShown(each, none, 'us'))).toBe('none');
    });

    it('drops the single choices a switch now agrees with', () => {
      const shownBack = withChoice(everyday, [row('nanometer')], true, 'us');
      const all = withSystems(shownBack, new Set(['metric', 'us', 'uk', 'specialist']), 'us');
      expect(all.overrides.size).toBe(0);
    });

    it('always shows Other, which has no switch', () => {
      const knot = unitsIn('speed').find((unit) => unit.id === 'knot')!;
      const knotRow: TableRow = {
        unit: knot,
        id: 'knot',
        name: 'knots',
        symbol: 'kn',
        value: null,
        text: '—',
        tone: 'empty',
        inBox: false,
      };
      expect(unitShown(knotRow, { shown: new Set(), overrides: new Map() }, 'us')).toBe(true);
    });
  });
});
