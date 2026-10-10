import {
  unitListGroup,
  unitsIn,
  type CategoryId,
  type Unit,
  type UnitPreference,
  type UnitSystem,
} from '@bigsmall/core';

/**
 * Groupings for the organization lab (docs/research/organization-lab.md). The four ideas share one
 * rule for whose everyday units lead, and differ in what a section is and what hides a row.
 */

export type Idea = 'earned' | 'jobs' | 'presets' | 'families' | 'fixed';
export type Preset = 'mine' | 'everyday' | 'all';
/** A family switch. `customary` is the shared inch, foot, and pound, one switch for both regions. */
export type Family = 'metric' | 'us' | 'uk' | 'customary' | 'more';

export const FAMILY_LABEL: Record<Family, string> = {
  metric: 'Metric',
  us: 'US',
  uk: 'UK',
  customary: 'US and UK',
  more: 'More',
};

const OWN: Record<UnitPreference, readonly UnitSystem[]> = {
  us: ['us', 'imperial'],
  imperial: ['uk', 'imperial'],
  metric: ['si', 'metric'],
};

/** A system a visitor can turn off. Time and data carry `si` and `metric` without being regional. */
const REGIONAL: ReadonlySet<UnitSystem> = new Set(['us', 'imperial', 'uk']);

export interface Row {
  id: string;
  unit: Unit;
}

export interface Section<T extends Row> {
  key: string;
  /** Null when the run stays unlabeled: one unit, or a category with nothing regional to name. */
  label: string | null;
  rows: T[];
}

interface JobDef {
  id: string;
  label: string;
  units: readonly string[];
}

/**
 * Sections named for the job, in catalog order. `sectionsFor` then leads with the visitor's own
 * everyday jobs, then other everyday jobs, then jobs that are all specialist. A specialist unit
 * stays in its job, so it can sit above a later job.
 */
const JOBS: Partial<Record<CategoryId, readonly JobDef[]>> = {
  length: [
    { id: 'customary', label: 'US customary', units: ['inch', 'foot', 'yard', 'mile'] },
    { id: 'metric', label: 'Metric', units: ['millimeter', 'centimeter', 'meter', 'kilometer'] },
    { id: 'tiny', label: 'Very small', units: ['nanometer', 'micrometer', 'mil'] },
    { id: 'nautical', label: 'Nautical', units: ['fathom', 'nautical-mile'] },
    { id: 'survey', label: 'Survey', units: ['furlong'] },
    {
      id: 'astronomy',
      label: 'Astronomy',
      units: ['astronomical-unit', 'light-year', 'parsec'],
    },
  ],
  volume: [
    {
      id: 'cooking',
      label: 'Cooking',
      units: [
        'us-teaspoon',
        'us-tablespoon',
        'us-fluid-ounce',
        'us-cup',
        'us-pint',
        'us-quart',
        'us-gallon',
      ],
    },
    { id: 'metric', label: 'Metric', units: ['milliliter', 'liter', 'cubic-meter'] },
    { id: 'cubic', label: 'Cubic', units: ['cubic-inch', 'cubic-foot', 'cubic-yard'] },
    {
      id: 'uk',
      label: 'UK',
      units: ['imperial-fluid-ounce', 'imperial-pint', 'imperial-gallon'],
    },
    { id: 'trade', label: 'Trade', units: ['oil-barrel'] },
  ],
  mass: [
    { id: 'customary', label: 'US customary', units: ['ounce', 'pound'] },
    { id: 'metric', label: 'Metric', units: ['milligram', 'gram', 'kilogram'] },
    { id: 'uk', label: 'UK', units: ['stone'] },
    {
      id: 'precious',
      label: 'Precious and small',
      units: ['microgram', 'carat', 'grain', 'troy-ounce'],
    },
    { id: 'tons', label: 'Tons', units: ['tonne', 'short-ton', 'long-ton'] },
  ],
  energy: [
    { id: 'electricity', label: 'Electricity', units: ['watt-hour', 'kilowatt-hour'] },
    { id: 'food', label: 'Food', units: ['calorie', 'kilocalorie'] },
    { id: 'heat', label: 'Heat', units: ['british-thermal-unit', 'therm'] },
    { id: 'si', label: 'SI', units: ['joule', 'kilojoule', 'megajoule', 'gigajoule'] },
    { id: 'other', label: 'Other', units: ['foot-pound', 'electronvolt'] },
  ],
  data: [
    {
      id: 'decimal',
      label: 'Decimal',
      units: ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'],
    },
    {
      id: 'binary',
      label: 'Binary',
      units: ['kibibyte', 'mebibyte', 'gibibyte', 'tebibyte', 'pebibyte'],
    },
    { id: 'bits', label: 'Bits', units: ['bit', 'kilobit', 'megabit', 'gigabit'] },
  ],
  area: [
    {
      id: 'metric',
      label: 'Metric',
      units: ['square-centimeter', 'square-meter', 'square-kilometer'],
    },
    {
      id: 'customary',
      label: 'US customary',
      units: ['square-inch', 'square-foot', 'square-yard', 'square-mile'],
    },
    { id: 'land', label: 'Land', units: ['acre', 'hectare'] },
  ],
  pressure: [
    {
      id: 'si',
      label: 'SI',
      units: ['pascal', 'hectopascal', 'kilopascal', 'megapascal', 'bar'],
    },
    {
      id: 'customary',
      label: 'US customary',
      units: ['pound-per-square-inch', 'inch-of-mercury'],
    },
    { id: 'atmosphere', label: 'Atmosphere', units: ['atmosphere', 'millimeter-of-mercury'] },
  ],
  power: [
    { id: 'si', label: 'SI', units: ['watt', 'kilowatt', 'megawatt', 'gigawatt'] },
    { id: 'horsepower', label: 'Horsepower', units: ['horsepower', 'metric-horsepower'] },
    { id: 'heat', label: 'Heat', units: ['btu-per-hour', 'ton-of-refrigeration'] },
  ],
  'fuel-economy': [
    {
      id: 'per-volume',
      label: 'Per volume',
      units: ['mile-per-us-gallon', 'mile-per-imperial-gallon', 'kilometer-per-liter'],
    },
    {
      id: 'per-distance',
      label: 'Per distance',
      units: ['liter-per-100-kilometers', 'us-gallon-per-100-miles'],
    },
  ],
};

export function categoriesWithJobs(): CategoryId[] {
  return Object.keys(JOBS) as CategoryId[];
}

const MORE = 'More units';

const OWN_LABEL: Record<UnitPreference, string> = {
  us: 'US customary',
  imperial: 'Imperial',
  metric: 'Metric',
};

function neitherLabel(systems: ReadonlySet<UnitSystem>): string {
  const only = (system: UnitSystem) => [...systems].every((each) => each === system);
  if (only('uk')) return 'UK imperial';
  if (only('us')) return 'US customary';
  return 'Other';
}

/** A category whose units belong to US customary, imperial, or UK measure, so a region can name them. */
export function categoryIsRegional(category: CategoryId): boolean {
  return unitsIn(category).some((unit) => REGIONAL.has(unit.system));
}

function hasOwnEveryday(category: CategoryId, preference: UnitPreference): boolean {
  const own = OWN[preference];
  return unitsIn(category).some((unit) => unit.tier === 'basic' && own.includes(unit.system));
}

/** Mine, Everyday, or All. Mine falls back to every everyday unit when the category has no region. */
export function showsInPreset(unit: Unit, preset: Preset, preference: UnitPreference): boolean {
  if (preset === 'all') return true;
  if (unit.tier !== 'basic') return false;
  if (preset === 'everyday') return true;
  if (!hasOwnEveryday(unit.category, preference)) return true;
  return OWN[preference].includes(unit.system);
}

/** Which family switches this category offers. A non-regional category offers More alone. */
export function familyChips(category: CategoryId): Family[] {
  const units = unitsIn(category);
  const more = units.some((unit) => unit.tier === 'advanced');
  if (!categoryIsRegional(category)) return more ? ['more'] : [];
  const systems = new Set(units.map((unit) => unit.system));
  const chips: Family[] = [];
  if (systems.has('si') || systems.has('metric')) chips.push('metric');
  const hasUs = systems.has('us');
  const hasUk = systems.has('uk');
  if (hasUs && hasUk) chips.push('us', 'uk');
  else if (hasUs) chips.push('us');
  else if (hasUk) chips.push('uk');
  else if (systems.has('imperial')) chips.push('customary');
  if (more) chips.push('more');
  return chips;
}

/** The line under the family switches, for the chips this category actually shows. */
export function familyHint(category: CategoryId): string {
  const chips = familyChips(category);
  const shares = unitsIn(category).some(
    (unit) => unit.system === 'imperial' && unit.tier === 'basic',
  );
  if (chips.length === 1 && chips[0] === 'more') {
    return 'No regions in this category. More is the specialist units.';
  }
  if (chips.includes('customary')) {
    return 'US and UK is the shared customary units. More is every specialist unit.';
  }
  if (shares && chips.includes('us') && chips.includes('uk')) {
    return 'Shared units stay on while either US or UK is on. More is every specialist unit.';
  }
  if (chips.includes('more')) return 'More is every specialist unit, of any system.';
  return 'Each switch covers the everyday units of that family.';
}

/**
 * A family's everyday units. Specialist units follow More, whichever system they belong to.
 * Shared imperial units stay while either region that uses them is on.
 */
export function showsInFamilies(unit: Unit, on: ReadonlySet<Family>): boolean {
  if (unit.tier === 'advanced') return on.has('more');
  if (!categoryIsRegional(unit.category)) return true;
  const chips = familyChips(unit.category);
  if (unit.system === 'si' || unit.system === 'metric') return on.has('metric');
  if (unit.system === 'other') return true;
  if (unit.system === 'us') return on.has('us');
  if (unit.system === 'uk') return on.has('uk');
  if (chips.includes('customary')) return on.has('customary');
  if (chips.includes('us') && chips.includes('uk')) return on.has('us') || on.has('uk');
  if (chips.includes('us')) return on.has('us');
  if (chips.includes('uk')) return on.has('uk');
  return true;
}

function jobRank(def: JobDef, category: CategoryId, preference: UnitPreference): number {
  const own = OWN[preference];
  const byId = new Map(unitsIn(category).map((unit) => [unit.id, unit]));
  const basic = def.units
    .map((id) => byId.get(id))
    .filter((unit): unit is Unit => unit !== undefined && unit.tier === 'basic');
  if (basic.some((unit) => own.includes(unit.system))) return 0;
  if (basic.length > 0) return 1;
  return 2;
}

function jobDefs(category: CategoryId, preference: UnitPreference): readonly JobDef[] | null {
  const defs = JOBS[category];
  if (!defs) return null;
  return defs
    .map((def, index) => ({ def, index, rank: jobRank(def, category, preference) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ def }) => def);
}

/** Jobs where this category has them, otherwise the everyday run and a More units tail. */
function namedSections<T extends Row>(
  rows: readonly T[],
  preference: UnitPreference,
): Section<T>[] {
  const category = rows[0]?.unit.category;
  const defs = category ? jobDefs(category, preference) : null;
  if (!defs) return tailSections(rows);
  const claimed = new Set<string>();
  const sections: Section<T>[] = [];
  for (const def of defs) {
    const taken = rows.filter((row) => def.units.includes(row.id) && !claimed.has(row.id));
    for (const row of taken) claimed.add(row.id);
    if (taken.length > 0) sections.push({ key: def.id, label: def.label, rows: taken });
  }
  const left = rows.filter((row) => !claimed.has(row.id));
  if (left.length > 0) sections.push({ key: 'left', label: 'Left over', rows: left });
  return sections;
}

/** Everyday units with no heading, then the specialist units under More units. */
function tailSections<T extends Row>(rows: readonly T[]): Section<T>[] {
  const everyday = rows.filter((row) => row.unit.tier === 'basic');
  const more = rows.filter((row) => row.unit.tier === 'advanced');
  const sections: Section<T>[] = [];
  if (everyday.length > 0) sections.push({ key: 'everyday', label: null, rows: everyday });
  if (more.length > 0) sections.push({ key: 'more', label: MORE, rows: more });
  return sections;
}

const GROUP_ORDER = ['own', 'other', 'neither', 'everyday', 'specialist'] as const;

/**
 * The listed-order groups. A run of one unit keeps its rows and loses its name, and a category
 * with no regional system leaves its everyday units unnamed. The specialist run is More units.
 */
function earnedSections<T extends Row>(
  rows: readonly T[],
  preference: UnitPreference,
): Section<T>[] {
  const regional = rows.some((row) => REGIONAL.has(row.unit.system));
  const sections = new Map<string, Section<T>>();
  for (const row of rows) {
    const group = unitListGroup(row.unit, preference);
    const key = group === 'specialist' || regional ? group : 'everyday';
    const section = sections.get(key) ?? { key, label: null, rows: [] };
    section.rows.push(row);
    sections.set(key, section);
  }
  for (const section of sections.values()) {
    const systems = new Set(section.rows.map((row) => row.unit.system));
    if (section.key === 'specialist') section.label = MORE;
    else if (section.key === 'own') section.label = OWN_LABEL[preference];
    else if (section.key === 'other') {
      section.label = preference === 'metric' ? 'Imperial and US customary' : 'Metric';
    } else if (section.key === 'neither') section.label = neitherLabel(systems);
    if (section.label !== null && section.rows.length < 2) section.label = null;
  }
  return GROUP_ORDER.map((key) => sections.get(key)).filter(
    (section): section is Section<T> => section !== undefined,
  );
}

/**
 * A section of the fixed names (Sean, 2026-10-10): the same five everywhere, so one filter can mean
 * the same thing in every category. `everyday` is a category with no regional system's everyday
 * units (time, data, angle), which a filter of systems never hides.
 */
export type FixedKey = 'metric' | 'us' | 'uk' | 'other' | 'everyday' | 'specialist';

export const FIXED_LABEL: Record<FixedKey, string> = {
  metric: 'Metric',
  us: 'US (customary)',
  uk: 'UK (imperial)',
  other: 'Other',
  everyday: 'Everyday',
  specialist: 'Specialist',
};

/** The Show menu's switches, in its order: one setting for every category. */
export const SHOW_KEYS: readonly FixedKey[] = ['metric', 'us', 'uk', 'other', 'specialist'];

/** The visitor's own fixed section. */
export function ownKey(preference: UnitPreference): FixedKey {
  if (preference === 'us') return 'us';
  if (preference === 'imperial') return 'uk';
  return 'metric';
}

/**
 * The fixed section a unit belongs to, for this visitor. The shared inch, foot, and pound sit with
 * US (customary), or with UK (imperial) for a UK visitor; every specialist unit is Specialist.
 */
export function fixedKeyOf(unit: Unit, preference: UnitPreference): FixedKey {
  if (unit.tier !== 'basic') return 'specialist';
  if (!categoryIsRegional(unit.category)) return 'everyday';
  if (unit.system === 'si' || unit.system === 'metric') return 'metric';
  if (unit.system === 'us') return 'us';
  if (unit.system === 'uk') return 'uk';
  if (unit.system === 'imperial') return preference === 'imperial' ? 'uk' : 'us';
  return 'other';
}

/**
 * The fixed names, every section headed, even a section of one: the visitor's own first, then the
 * other systems in the listed order, then Other, then Specialist. Rows keep the listed order
 * within their section.
 */
function fixedSections<T extends Row>(
  rows: readonly T[],
  preference: UnitPreference,
): Section<T>[] {
  const own = ownKey(preference);
  const rank = (key: FixedKey) =>
    key === own || key === 'everyday' ? 0 : key === 'specialist' ? 3 : key === 'other' ? 2 : 1;
  const sections = new Map<FixedKey, Section<T>>();
  for (const row of rows) {
    const key = fixedKeyOf(row.unit, preference);
    const section = sections.get(key) ?? { key, label: FIXED_LABEL[key], rows: [] };
    section.rows.push(row);
    sections.set(key, section);
  }
  return [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, section]) => section);
}

/** The sections an idea draws. Presets and the family switches label; they do not change the cut. */
export function sectionsFor<T extends Row>(
  rows: readonly T[],
  idea: Idea,
  preference: UnitPreference,
): Section<T>[] {
  if (idea === 'earned') return earnedSections(rows, preference);
  if (idea === 'fixed') return fixedSections(rows, preference);
  return namedSections(rows, preference);
}
