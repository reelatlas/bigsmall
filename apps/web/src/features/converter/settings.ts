import {
  FRACTION_SIZES,
  getUnit,
  unitsIn,
  type CategoryId,
  type FractionSize,
  type Rounding,
  type Unit,
  type UnitPreference,
  type UnitSystem,
} from '@bigsmall/core';

/**
 * Settings: what shows and how it looks (docs/UX-SPEC.md §3, §7; ADR 0018). Pure, no React, no
 * DOM: everything here is unit-tested in node.
 *
 * What shows has two layers. The system switches set every category. A unit chosen on its own in
 * a table is an exception, shown or hidden against its switch, until its system's switch changes,
 * which is final for that system, or a preset, which sets exactly its set; Show custom hidden
 * units, or the table, also clears it (Sean, 2026-10-15: with Specialty unchecked, no specialty
 * unit shows). The unit in the box always shows, whatever the settings say (the caller's to
 * apply).
 */

// ---------------------------------------------------------------------------
// Sections: the table's units by system, under fixed names, the same everywhere, so a switch
// means the same thing in every category.

/**
 * A section of the table: `standard` holds a category with no regional system (time, data, angle),
 * and `pace` a category's paces (Speed's min/km and min/mi), apart from the speeds they equal.
 */
export type SectionKey = 'metric' | 'us' | 'uk' | 'other' | 'standard' | 'pace' | 'specialty';

/**
 * Only headings take the parentheses; units keep their names and symbols. Specialty, for the units
 * of a field, pairs with Standard (Sean, 2026-10-14).
 */
export const SECTION_LABEL: Record<SectionKey, string> = {
  metric: 'Metric',
  us: 'US (customary)',
  uk: 'UK (imperial)',
  other: 'Other',
  standard: 'Standard',
  pace: 'Pace',
  specialty: 'Specialty',
};

/**
 * The system switches, in their order: the regional systems, Other (a regional category's
 * standard units that belong to none of them, the knot and the atmosphere), and Specialty. Every
 * heading the table shows has its row in Units but Standard, which is the whole standard list of a
 * category with no regional system (time, data, angle): a switch would only empty its table
 * (Sean, 2026-10-15: Other had none until then, always showing, after the last regional system).
 */
export const SYSTEM_KEYS: readonly SectionKey[] = ['metric', 'us', 'uk', 'other', 'specialty'];

const REGIONAL: ReadonlySet<UnitSystem> = new Set(['us', 'imperial', 'uk']);
const regional = new Map<CategoryId, boolean>();

/** A category whose units belong to US customary, imperial, or UK measure, so a region names them. */
function categoryIsRegional(category: CategoryId): boolean {
  let answer = regional.get(category);
  if (answer === undefined) {
    answer = unitsIn(category).some((unit) => REGIONAL.has(unit.system));
    regional.set(category, answer);
  }
  return answer;
}

/** The visitor's own section. */
function ownSection(preference: UnitPreference): SectionKey {
  if (preference === 'us') return 'us';
  if (preference === 'imperial') return 'uk';
  return 'metric';
}

/**
 * The section a unit belongs to, for this visitor. The shared inch, foot, and pound sit with
 * US (customary), or with UK (imperial) for a UK visitor; every specialty unit is Specialty's, and
 * every standard pace Pace's (Sean, 2026-10-16).
 */
export function sectionOf(unit: Unit, preference: UnitPreference): SectionKey {
  if (unit.tier === 'specialty') return 'specialty';
  if (unit.pace) return 'pace';
  if (!categoryIsRegional(unit.category)) return 'standard';
  if (unit.system === 'si' || unit.system === 'metric') return 'metric';
  if (unit.system === 'us') return 'us';
  if (unit.system === 'uk') return 'uk';
  if (unit.system === 'imperial') return preference === 'imperial' ? 'uk' : 'us';
  return 'other';
}

export interface Section<T> {
  key: SectionKey;
  label: string;
  rows: T[];
}

/**
 * The order of the table's sections, by their systems' switches, on a fresh visit: the visitor's
 * own first, then the others as SYSTEM_KEYS lists them, Specialty last (ADR 0011). Units' rows
 * reorder it, in every category (Sean, 2026-10-15).
 */
export function defaultOrder(preference: UnitPreference): readonly SectionKey[] {
  const own = ownSection(preference);
  return [own, ...SYSTEM_KEYS.filter((key) => key !== own)];
}

/**
 * Rows in their sections, every section headed, even a section of one, in `order`: Standard first
 * (it is a category's only standard section), then the systems as ordered, Other among them, with
 * Pace after every one of them but Specialty, wherever Specialty is ordered. Rows keep the listed
 * order within their section.
 */
export function sectionsOf<T extends { unit: Unit }>(
  rows: readonly T[],
  preference: UnitPreference,
  order: readonly SectionKey[] = defaultOrder(preference),
): Section<T>[] {
  const systems = order.filter((key) => key !== 'specialty').map((key) => order.indexOf(key));
  const pace = Math.max(-1, ...systems) + 0.5;
  const rank = (key: SectionKey) =>
    key === 'standard' ? -1 : key === 'pace' ? pace : order.indexOf(key);
  const sections = new Map<SectionKey, Section<T>>();
  for (const row of rows) {
    const key = sectionOf(row.unit, preference);
    const section = sections.get(key) ?? { key, label: SECTION_LABEL[key], rows: [] };
    section.rows.push(row);
    sections.set(key, section);
  }
  return [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, section]) => section);
}

// ---------------------------------------------------------------------------
// What shows.

export interface ViewRule {
  /** The system switches: one setting for every category. */
  shown: ReadonlySet<SectionKey>;
  /** Exceptions: units shown or hidden on their own, against their system's switch. */
  overrides: ReadonlyMap<string, boolean>;
}

/** A fresh visit's: every system but Specialty, the Standard preset. */
export const FRESH_RULE: ViewRule = {
  shown: new Set(SYSTEM_KEYS.filter((key) => key !== 'specialty')),
  overrides: new Map(),
};

export type ShowPreset = 'all' | 'standard' | 'region';

/** What Units' presets can light: a preset, or Custom, the visitor's own set (Sean, 2026-10-15). */
export type ShowChoice = ShowPreset | 'custom';

export const SHOW_PRESETS: ReadonlyArray<{ id: ShowPreset; name: string }> = [
  { id: 'all', name: 'All' },
  { id: 'standard', name: 'Standard' },
  { id: 'region', name: 'Your region' },
];

export function presetKeys(
  preset: ShowPreset,
  preference: UnitPreference,
): ReadonlySet<SectionKey> {
  if (preset === 'all') return new Set(SYSTEM_KEYS);
  if (preset === 'standard') return new Set(SYSTEM_KEYS.filter((key) => key !== 'specialty'));
  // The visitor's own system, and the units no region owns (the knot, the atmosphere).
  return new Set([ownSection(preference), 'other']);
}

/** The preset the switches alone match, or null for a custom set. */
export function presetOf(
  shown: ReadonlySet<SectionKey>,
  preference: UnitPreference,
): ShowPreset | null {
  const same = (keys: ReadonlySet<SectionKey>) =>
    keys.size === shown.size && [...keys].every((key) => shown.has(key));
  return SHOW_PRESETS.find((preset) => same(presetKeys(preset.id, preference)))?.id ?? null;
}

/**
 * What lights in Units: Custom while the visitor is on their own set (Custom picked, or anything
 * changed by hand), else the preset the switches match with no unit chosen on its own, else
 * Custom.
 */
export function shownChoice(settings: Settings, preference: UnitPreference): ShowChoice {
  if (settings.custom) return 'custom';
  const { rule } = settings;
  return (rule.overrides.size > 0 ? null : presetOf(rule.shown, preference)) ?? 'custom';
}

/** The section of a unit chosen on its own, by its id; undefined for an id no longer known. */
function sectionOfId(id: string, preference: UnitPreference): SectionKey | undefined {
  const unit = getUnit(id);
  return unit ? sectionOf(unit, preference) : undefined;
}

/**
 * A system's checkbox in Units: all its units shown, none, or some (a dash) while units of it are
 * chosen on their own against its switch, in any category.
 */
export function systemState(
  rule: ViewRule,
  key: SectionKey,
  preference: UnitPreference,
): GroupState {
  const on = rule.shown.has(key);
  const against = [...rule.overrides].some(
    ([id, show]) => show !== on && sectionOfId(id, preference) === key,
  );
  if (against) return 'some';
  return on ? 'all' : 'none';
}

/**
 * The sections with no switch, which always show: Standard, a category's whole standard list, and
 * Pace, standard rather than specialty (Sean, 2026-10-16; how a category's own sections are
 * switched is a later exploration, docs/PLAN.md §2).
 */
const ALWAYS_SHOWN: ReadonlySet<SectionKey> = new Set(['standard', 'pace']);

/** What the switches alone show: Standard and Pace always. */
function bySystem(unit: Unit, shown: ReadonlySet<SectionKey>, preference: UnitPreference): boolean {
  const key = sectionOf(unit, preference);
  return ALWAYS_SHOWN.has(key) || shown.has(key);
}

/** Whether a unit shows: its exception, if it has one, else its switch. */
export function shows(unit: Unit, rule: ViewRule, preference: UnitPreference): boolean {
  return rule.overrides.get(unit.id) ?? bySystem(unit, rule.shown, preference);
}

export type GroupState = 'all' | 'some' | 'none';

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

/**
 * One system switched on or off, in every category, and final for it: its units chosen on their
 * own go back to the switch, so unchecking Specialty hides every specialty unit. Other systems'
 * exceptions stay.
 */
export function withSystem(
  rule: ViewRule,
  key: SectionKey,
  on: boolean,
  preference: UnitPreference,
): ViewRule {
  const shown = new Set(rule.shown);
  if (on) shown.add(key);
  else shown.delete(key);
  const overrides = new Map(
    [...rule.overrides].filter(([id]) => sectionOfId(id, preference) !== key),
  );
  return { shown, overrides };
}

/** A preset: exactly its systems, every unit chosen on its own back to its switch. */
export function presetRule(shown: ReadonlySet<SectionKey>): ViewRule {
  return { shown, overrides: new Map() };
}

/** The units hidden on their own, in every category. */
export function hiddenByHand(rule: ViewRule): number {
  return [...rule.overrides.values()].filter((show) => !show).length;
}

/**
 * Show custom hidden units: every unit hidden on its own back to its switch; those shown on their
 * own stay.
 */
export function withoutHidden(rule: ViewRule): ViewRule {
  return { ...rule, overrides: new Map([...rule.overrides].filter(([, show]) => show)) };
}

// ---------------------------------------------------------------------------
// How it looks.

export interface Display {
  names: 'symbol' | 'both';
  /** Both writes the decimal, then its fraction, as Format lists them. */
  format: 'decimal' | 'fraction' | 'both';
  /** Decimal places, or null for no limit: the table's six significant digits. */
  places: 1 | 2 | 3 | null;
  /** The fraction sizes chosen, each on or off by itself. */
  fractions: ReadonlySet<FractionSize>;
  rounding: Rounding;
}

/**
 * A fresh visit's: symbols with their names (Sean, 2026-10-15; symbols alone until then), two
 * places, rounded to the nearest, eighths in waiting.
 */
export const FRESH_DISPLAY: Display = {
  names: 'both',
  format: 'decimal',
  places: 2,
  fractions: new Set([2, 4, 8]),
  rounding: 'nearest',
};

function sameSizes(a: ReadonlySet<FractionSize>, b: ReadonlySet<FractionSize>): boolean {
  return a.size === b.size && [...a].every((size) => b.has(size));
}

/** Whether any display setting differs from a fresh visit's: what Reset display would change. */
export function displayChanged(display: Display): boolean {
  const fresh = FRESH_DISPLAY;
  return (
    display.names !== fresh.names ||
    display.format !== fresh.format ||
    display.places !== fresh.places ||
    !sameSizes(display.fractions, fresh.fractions) ||
    display.rounding !== fresh.rounding
  );
}

/** Both layers and the display: everything Settings holds, kept apart from the conversion's history. */
export interface Settings {
  rule: ViewRule;
  display: Display;
  /**
   * The visitor's own set, kept aside when a preset was picked over it, for Custom to bring back:
   * the switches and the units chosen on their own. Null until there is one.
   */
  kept: ViewRule | null;
  /**
   * Whether the visitor is on Custom, their own set: Custom picked, or anything changed by hand (a
   * system's checkbox, a unit shown or hidden in the table, Show custom hidden units), until a
   * preset is picked. Custom then stays lit even if the set matches a preset (Sean, 2026-10-15).
   */
  custom: boolean;
  /** The sections' order as the visitor set it in Units, or null for a fresh visit's (defaultOrder). */
  order: readonly SectionKey[] | null;
}

export const FRESH_SETTINGS: Settings = {
  rule: FRESH_RULE,
  display: FRESH_DISPLAY,
  kept: null,
  custom: false,
  order: null,
};

/** What shows changed by hand: the visitor is on Custom from here. */
export function byHand(settings: Settings, rule: ViewRule): Settings {
  return { ...settings, rule, custom: true };
}

/** The sections' order in force. */
export function orderOf(settings: Settings, preference: UnitPreference): readonly SectionKey[] {
  return settings.order ?? defaultOrder(preference);
}

/** A system moved to place `to` (0 is first) in the order, in every category. */
export function withOrder(
  settings: Settings,
  key: SectionKey,
  to: number,
  preference: UnitPreference,
): Settings {
  const order = orderOf(settings, preference).filter((each) => each !== key);
  order.splice(Math.min(Math.max(to, 0), order.length), 0, key);
  return { ...settings, order };
}

/** Whether the order differs from a fresh visit's, for Units' Reset order. */
export function orderChanged(settings: Settings, preference: UnitPreference): boolean {
  const fresh = defaultOrder(preference);
  return orderOf(settings, preference).some((key, at) => key !== fresh[at]);
}

/**
 * A preset picked in Units: exactly its set; a custom set that was showing is kept aside, not lost,
 * so Custom can bring it back (the pattern of a browser's tracking protection: Standard, Strict,
 * Custom).
 */
export function withPresetPicked(
  settings: Settings,
  preset: ShowPreset,
  preference: UnitPreference,
): Settings {
  const custom = shownChoice(settings, preference) === 'custom';
  return {
    ...settings,
    rule: presetRule(presetKeys(preset, preference)),
    kept: custom ? settings.rule : settings.kept,
    custom: false,
  };
}

/**
 * Custom picked: the set kept aside comes back; with none kept, what shows stays as it is, now
 * the visitor's own to change. Custom is never out of reach (Sean, 2026-10-15).
 */
export function withCustomPicked(settings: Settings): Settings {
  return { ...settings, rule: settings.kept ?? settings.rule, custom: true };
}

// ---------------------------------------------------------------------------
// Remembered in this browser (settings-store.ts; Sean, 2026-10-15).

/** A view rule as stored: plain lists. */
interface StoredRule {
  shown: string[];
  overrides: [string, boolean][];
}

/**
 * Settings as stored: plain JSON, versioned, so a later shape can read or drop an older one.
 * Display keeps only what differs from a fresh visit's (since version 2), so a default changed
 * later reaches everyone who never chose otherwise; version 1, a day old, kept all of it. Version
 * 3 knows Other's switch. Version 4 keys Specialty's switch `specialty`, the screen's word, where
 * earlier versions stored `specialist` (Sean, 2026-10-16: one vocabulary in code and on screen).
 */
export interface StoredSettings {
  v: 4;
  rule: StoredRule;
  kept: StoredRule | null;
  custom: boolean;
  order: string[] | null;
  display: Partial<Omit<Display, 'fractions'> & { fractions: number[] }>;
}

function storedRule(rule: ViewRule): StoredRule {
  return { shown: [...rule.shown], overrides: [...rule.overrides] };
}

/** Settings as stored, Display by what was changed. */
export function storedOf(settings: Settings): StoredSettings {
  const { display } = settings;
  const fresh = FRESH_DISPLAY;
  const changed: StoredSettings['display'] = {};
  if (display.names !== fresh.names) changed.names = display.names;
  if (display.format !== fresh.format) changed.format = display.format;
  if (display.places !== fresh.places) changed.places = display.places;
  if (!sameSizes(display.fractions, fresh.fractions)) changed.fractions = [...display.fractions];
  if (display.rounding !== fresh.rounding) changed.rounding = display.rounding;
  return {
    v: 4,
    rule: storedRule(settings.rule),
    kept: settings.kept && storedRule(settings.kept),
    custom: settings.custom,
    order: settings.order && [...settings.order],
    display: changed,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** The versions settingsFrom reads. */
const VERSIONS: readonly unknown[] = [1, 2, 3, 4];

/** A system's key as stored, read as today's: before version 4, Specialty's was `specialist`. */
const keyOf = (key: unknown): unknown => (key === 'specialist' ? 'specialty' : key);

/** A stored rule read back: unknown systems and units, gone since it was saved, are left out. */
function ruleFrom(value: unknown): ViewRule | null {
  if (!isRecord(value) || !Array.isArray(value.shown) || !Array.isArray(value.overrides)) {
    return null;
  }
  const shown = new Set(
    value.shown
      .map(keyOf)
      .filter((key): key is SectionKey => SYSTEM_KEYS.includes(key as SectionKey)),
  );
  const overrides = new Map<string, boolean>();
  for (const entry of value.overrides) {
    if (Array.isArray(entry) && getUnit(String(entry[0])) && typeof entry[1] === 'boolean') {
      overrides.set(String(entry[0]), entry[1]);
    }
  }
  return { shown, overrides };
}

/** One of `allowed`, or the fallback. */
function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Stored settings read back, each part checked: a part that does not read, or was never changed,
 * falls back to a fresh visit's, and anything that is not settings at all reads as none. Version
 * 1 stored every display setting, so its names cannot tell a choice from the old default, symbols
 * alone: they take today's. Before version 3 Other had no switch and always showed: it comes back
 * on, placed after the last regional system, where it stood. Before version 4 Specialty's key was
 * `specialist`: it reads as `specialty`, so nobody's choices are lost.
 */
export function settingsFrom(value: unknown): Settings | null {
  if (!isRecord(value) || !VERSIONS.includes(value.v)) return null;
  const before3 = value.v === 1 || value.v === 2;
  const withOther = (rule: ViewRule | null): ViewRule | null =>
    rule && before3 ? { ...rule, shown: new Set([...rule.shown, 'other']) } : rule;
  const rule = withOther(ruleFrom(value.rule));
  if (!rule) return null;
  let stored = Array.isArray(value.order) ? (value.order as unknown[]).map(keyOf) : null;
  if (stored && before3 && !stored.includes('other')) {
    const after = Math.max(...(['metric', 'us', 'uk'] as const).map((key) => stored!.indexOf(key)));
    stored = [...stored.slice(0, after + 1), 'other', ...stored.slice(after + 1)];
  }
  const order =
    stored &&
    stored.length === SYSTEM_KEYS.length &&
    SYSTEM_KEYS.every((key) => stored!.includes(key))
      ? (stored as SectionKey[])
      : null;
  const shown = isRecord(value.display) ? value.display : {};
  const fresh = FRESH_DISPLAY;
  const display: Display = {
    names:
      value.v === 1 ? fresh.names : oneOf(shown.names, ['symbol', 'both'] as const, fresh.names),
    format: oneOf(shown.format, ['decimal', 'fraction', 'both'] as const, fresh.format),
    places: oneOf(shown.places, [1, 2, 3, null] as const, fresh.places),
    fractions: Array.isArray(shown.fractions)
      ? new Set(FRACTION_SIZES.filter((size) => (shown.fractions as unknown[]).includes(size)))
      : fresh.fractions,
    rounding: oneOf(shown.rounding, ['nearest', 'up', 'down'] as const, fresh.rounding),
  };
  return {
    rule,
    display,
    kept: withOther(ruleFrom(value.kept)),
    custom: value.custom === true,
    order,
  };
}
