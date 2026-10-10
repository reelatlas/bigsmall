import {
  categories,
  formatNumber,
  getUnit,
  localeSeparators,
  type CategoryId,
  type UnitPreference,
} from '@bigsmall/core';
import { useId, useMemo, useRef, useState, type FocusEvent } from 'react';
import { Button } from '../../../components/Button';
import { CategoryMenu } from '../../../components/CategoryMenu';
import { ChevronDownIcon, CopyIcon } from '../../../components/icons';
import { FormattedNumber } from '../../../components/NumberText';
import { UnitChip } from '../../../components/UnitChip';
import { initialState, selectTable, type TableRow } from '../../../features/converter/state';
import { useColumnsFit } from '../../../lib/fit-step';
import {
  cx,
  CURSOR_ROW,
  FIELD_ROW,
  LIST_CARD,
  MENU_CHEVRON,
  MENU_OPTION,
  MENU_ROOT,
  MENU_SHELL,
  MENU_SIZER,
  MENU_SIZER_LABEL,
  MENU_TRIGGER,
  NO_ANSWER,
  PANEL_TITLE,
  rowFill,
  SHELL_PANEL,
  unitSymbol,
} from '../../../lib/recipes';
import { browserLocale } from '../../../lib/region';
import {
  FAMILY_LABEL,
  familyChips,
  familyHint,
  FIXED_LABEL,
  fixedKeyOf,
  ownKey,
  sectionsFor,
  SHOW_KEYS,
  showsInFamilies,
  showsInPreset,
  type Family,
  type FixedKey,
  type Preset,
  type Section,
} from './sections';

const CHOICE = 'flex min-h-11 items-center gap-2 text-sm';
const CHECKBOX = 'size-4 accent-accent';

/** How the rows are named. Both tables share this, so a filter is the only difference between them. */
type Cut = 'fixed' | 'jobs' | 'earned';
/** How a table chooses which of those rows stay on screen. */
type FilterId = 'show' | 'fold' | 'presets' | 'families' | 'checks' | 'menu' | 'find';

const CUTS: ReadonlyArray<{ id: Cut; name: string }> = [
  { id: 'fixed', name: 'Fixed system names' },
  { id: 'jobs', name: 'Jobs' },
  { id: 'earned', name: 'By system' },
];

const FILTERS: ReadonlyArray<{ id: FilterId; name: string; hint: string }> = [
  {
    id: 'show',
    name: 'E. Show menu',
    hint: 'A menu in the toolbar, like the category menu: All units, Everyday, or Your units, and a switch per system. One setting for every category.',
  },
  { id: 'fold', name: 'Fold', hint: 'The section name hides that group.' },
  {
    id: 'presets',
    name: 'Presets',
    hint: 'Mine, Everyday, or All. One choice for the whole table.',
  },
  { id: 'families', name: 'Families', hint: 'Metric, US, UK, and More, each on or off.' },
  {
    id: 'checks',
    name: 'Check list',
    hint: 'Edit turns on a checkbox per unit, and one per section. Done hides what is unchecked.',
  },
  {
    id: 'menu',
    name: 'Show menu',
    hint: 'One button opens a checkbox per section. The table stays clear until you open it.',
  },
  { id: 'find', name: 'Find', hint: 'Type to leave only the units whose name or symbol matches.' },
];

const PRESETS: ReadonlyArray<{ id: Preset; name: string; hint: string }> = [
  {
    id: 'mine',
    name: 'Mine',
    hint: 'Everyday units of your system. A category with no region shows every everyday unit.',
  },
  { id: 'everyday', name: 'Everyday', hint: 'Every everyday unit, of every system.' },
  { id: 'all', name: 'All', hint: 'Every unit.' },
];

const REGIONS: ReadonlyArray<{ id: UnitPreference; name: string }> = [
  { id: 'us', name: 'US' },
  { id: 'imperial', name: 'UK' },
  { id: 'metric', name: 'Metric' },
];

/** A sample for each category, so switching shows values at once. Same numbers as the table controls lab. */
const SAMPLES: Partial<Record<CategoryId, { unit: string; text: string }>> = {
  length: { unit: 'foot', text: '6' },
  mass: { unit: 'pound', text: '150' },
  volume: { unit: 'us-cup', text: '2' },
  temperature: { unit: 'fahrenheit', text: '72' },
  area: { unit: 'square-foot', text: '1200' },
  speed: { unit: 'mile-per-hour', text: '60' },
  time: { unit: 'hour', text: '3' },
  data: { unit: 'gigabyte', text: '64' },
  'fuel-economy': { unit: 'mile-per-us-gallon', text: '30' },
  energy: { unit: 'kilocalorie', text: '250' },
  pressure: { unit: 'pound-per-square-inch', text: '32' },
  power: { unit: 'horsepower', text: '300' },
  angle: { unit: 'degree', text: '45' },
};

const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';
const GIVE_WAY = ['name'] as const;
const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;
const REGION_MARK = / \((?:US|UK)\)$/;

const TONE: Record<TableRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

const ALL_FAMILIES: ReadonlySet<Family> = new Set(['metric', 'us', 'uk', 'customary', 'more']);

interface FilterState {
  /** The Show menu's switches: kept across categories, as one setting for all of them. */
  shown: ReadonlySet<FixedKey>;
  showOpen: boolean;
  preset: Preset;
  families: ReadonlySet<Family>;
  folds: ReadonlySet<string>;
  hiddenUnits: ReadonlySet<string>;
  hiddenSections: ReadonlySet<string>;
  editing: boolean;
  menuOpen: boolean;
  query: string;
}

function freshFilter(): FilterState {
  return {
    shown: new Set(SHOW_KEYS),
    showOpen: false,
    preset: 'all',
    families: new Set(ALL_FAMILIES),
    folds: new Set(),
    hiddenUnits: new Set(),
    hiddenSections: new Set(),
    editing: false,
    menuOpen: false,
    query: '',
  };
}

function filterMeta(id: FilterId): { id: FilterId; name: string; hint: string } {
  return FILTERS.find((filter) => filter.id === id) ?? FILTERS[0]!;
}

function toggleSet<T extends string>(set: ReadonlySet<T>, key: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/**
 * The symbols a section shows. A heading that names the region can drop "(US)" and "(UK)"; the
 * fixed names leave every unit as it is (Sean, 2026-10-10).
 */
function sectionSymbols(section: Section<TableRow>, shorten: boolean): Map<string, string> {
  const namesRegion = shorten && section.label !== null && /US|UK|Imperial/i.test(section.label);
  const short = section.rows.map((row) => row.symbol.replace(REGION_MARK, ''));
  const unique = new Set(short).size === short.length;
  return new Map(
    section.rows.map((row, at) => [row.id, namesRegion && unique ? short[at]! : row.symbol]),
  );
}

function matchesQuery(row: TableRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [row.name, row.symbol, row.unit.name, row.unit.plural].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

/** A section with no name of its own is still choosable in the show menu, by its first symbols. */
function menuName(section: Section<TableRow>): string {
  if (section.label) return section.label;
  const symbols = section.rows.slice(0, 3).map((row) => row.symbol);
  const extra = section.rows.length - symbols.length;
  return extra > 0 ? `${symbols.join(', ')} +${extra}` : symbols.join(', ');
}

function rowKept(
  row: TableRow,
  filter: FilterId,
  state: FilterState,
  folded: boolean,
  sectionKey: string,
  preference: UnitPreference,
): boolean {
  if (filter === 'show') return !showsInMenu(row, state.shown, preference);
  if (filter === 'fold') return folded;
  if (filter === 'presets') return !showsInPreset(row.unit, state.preset, preference);
  if (filter === 'families') return !showsInFamilies(row.unit, state.families);
  if (filter === 'checks') return state.hiddenUnits.has(row.id);
  if (filter === 'menu') return state.hiddenSections.has(sectionKey);
  return !matchesQuery(row, state.query);
}

type ShowPreset = 'all' | 'everyday' | 'yours';

const SHOW_PRESETS: ReadonlyArray<{ id: ShowPreset; name: string }> = [
  { id: 'all', name: 'All units' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'yours', name: 'Your units' },
];

function presetKeys(preset: ShowPreset, preference: UnitPreference): ReadonlySet<FixedKey> {
  if (preset === 'all') return new Set(SHOW_KEYS);
  if (preset === 'everyday') return new Set(SHOW_KEYS.filter((key) => key !== 'specialist'));
  return new Set([ownKey(preference)]);
}

/** The preset the switches match, or null for a custom choice. */
function presetOf(shown: ReadonlySet<FixedKey>, preference: UnitPreference): ShowPreset | null {
  const same = (keys: ReadonlySet<FixedKey>) =>
    keys.size === shown.size && [...keys].every((key) => shown.has(key));
  return SHOW_PRESETS.find((preset) => same(presetKeys(preset.id, preference)))?.id ?? null;
}

/** A row stays unless its system is switched off; a category with no regions keeps its everyday units. */
function showsInMenu(
  row: TableRow,
  shown: ReadonlySet<FixedKey>,
  preference: UnitPreference,
): boolean {
  const key = fixedKeyOf(row.unit, preference);
  return key === 'everyday' || shown.has(key);
}

/**
 * The Show menu (option E): built from the category menu's recipes, a ghost at rest reading what it
 * shows, "Show All units"; open, the presets, then a switch per system. Its sizer holds every
 * label, so it never changes width. A press on a choice keeps focus where it is, so the menu's
 * blur does not close it before the choice lands.
 */
function ShowMenu({
  shown,
  preference,
  open,
  onOpen,
  onShown,
}: {
  shown: ReadonlySet<FixedKey>;
  preference: UnitPreference;
  open: boolean;
  onOpen: (open: boolean) => void;
  onShown: (shown: ReadonlySet<FixedKey>) => void;
}) {
  const id = useId();
  const preset = presetOf(shown, preference);
  const current = SHOW_PRESETS.find((each) => each.id === preset)?.name ?? 'Custom';
  const sizes = [
    ...[...SHOW_PRESETS.map((each) => each.name), 'Custom'].map((name) => `Show ${name}`),
    ...SHOW_KEYS.map((key) => FIXED_LABEL[key]),
  ];
  return (
    <div
      className={MENU_ROOT}
      data-open={open || undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onOpen(false);
      }}
    >
      <span aria-hidden="true" className={MENU_SIZER}>
        {sizes.map((label) => (
          <span key={label} className={MENU_SIZER_LABEL}>
            <span className="size-4" />
            {label}
            <span className="size-4" />
          </span>
        ))}
      </span>
      <div className={MENU_SHELL}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => onOpen(!open)}
          className={MENU_TRIGGER}
        >
          <span className="text-ink-muted">Show</span>
          {current}
          <ChevronDownIcon width="16" height="16" className={MENU_CHEVRON} />
        </button>
        <div id={`${id}-panel`} className={cx(SHELL_PANEL, 'p-1')}>
          <fieldset>
            <legend className="sr-only">Show</legend>
            {SHOW_PRESETS.map((each) => (
              <label
                key={each.id}
                onPointerDown={(event) => event.preventDefault()}
                className={MENU_OPTION}
              >
                <input
                  type="radio"
                  name={`${id}-preset`}
                  checked={preset === each.id}
                  onChange={() => onShown(presetKeys(each.id, preference))}
                  className="sr-only"
                />
                {each.name}
              </label>
            ))}
          </fieldset>
          <fieldset className="mt-1 border-t border-line pt-1">
            <legend className="sr-only">Systems</legend>
            {SHOW_KEYS.map((key) => (
              <label
                key={key}
                onPointerDown={(event) => event.preventDefault()}
                className={cx(MENU_OPTION, 'gap-2')}
              >
                <input
                  type="checkbox"
                  checked={shown.has(key)}
                  onChange={() => onShown(toggleSet(shown, key))}
                  className={CHECKBOX}
                />
                {FIXED_LABEL[key]}
              </label>
            ))}
          </fieldset>
        </div>
      </div>
    </div>
  );
}

function RowCells({
  row,
  symbol,
  namesHidden,
}: {
  row: TableRow;
  symbol: string;
  namesHidden: boolean;
}) {
  const exponent = EXPONENT.exec(symbol)?.[0] ?? '';
  return (
    <>
      <span className={cx('pr-2 text-right font-numeric whitespace-nowrap', TONE[row.tone])}>
        {row.tone === 'value' ? <FormattedNumber text={row.text} /> : row.text}
      </span>
      <span className={cx('col-start-3 pl-2 text-right whitespace-nowrap', unitSymbol())}>
        {symbol.slice(0, symbol.length - exponent.length)}
      </span>
      <span className={cx('whitespace-nowrap', unitSymbol())}>{exponent}</span>
      <span
        hidden={namesHidden}
        className="min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap text-ink"
        data-column="name"
      >
        {row.name}
      </span>
    </>
  );
}

function Mock({
  filter,
  cut,
  rows,
  category,
  preference,
  text,
  unit,
  state,
  onText,
  onTake,
  onRemove,
  onState,
}: {
  filter: FilterId;
  cut: Cut;
  rows: readonly TableRow[];
  category: CategoryId;
  preference: UnitPreference;
  text: string;
  unit: string | null;
  state: FilterState;
  onText: (text: string) => void;
  onTake: (row: TableRow) => void;
  onRemove: () => void;
  onState: (update: (current: FilterState) => FilterState) => void;
}) {
  const id = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const namesHidden = useColumnsFit(gridRef, GIVE_WAY).includes('name');
  const chipUnit = unit ? getUnit(unit) : undefined;
  const meta = filterMeta(filter);
  const chips = familyChips(category);
  const sections = sectionsFor(rows, cut, preference).map((section) => {
    const foldKey = `${category}:${section.key}`;
    const folded = filter === 'fold' && section.label !== null && state.folds.has(foldKey);
    const sectionOff = filter === 'menu' && state.hiddenSections.has(section.key);
    const visible = section.rows.filter((row) => {
      if (row.inBox) return true;
      if (folded || sectionOff) return false;
      if (filter === 'show') return showsInMenu(row, state.shown, preference);
      if (filter === 'presets') return showsInPreset(row.unit, state.preset, preference);
      if (filter === 'families') return showsInFamilies(row.unit, state.families);
      if (filter === 'checks') return state.editing || !state.hiddenUnits.has(row.id);
      if (filter === 'find') return matchesQuery(row, state.query);
      return true;
    });
    const listed = section.rows.filter((row) => !row.inBox);
    const sectionOn = listed.every((row) => !state.hiddenUnits.has(row.id));
    return { ...section, foldKey, folded, visible, sectionOn };
  });
  const drawn = sections.filter((section) => section.folded || section.visible.length > 0);
  const visibleCount = drawn.reduce((count, section) => count + section.visible.length, 0);
  const kept = sections.some((section) =>
    section.rows.some(
      (row) => row.inBox && rowKept(row, filter, state, section.folded, section.key, preference),
    ),
  );
  const hiddenChecked = filter === 'checks' && !state.editing ? state.hiddenUnits.size : 0;

  const setUnits = (ids: readonly string[], hide: boolean) => {
    onState((current) => {
      const next = new Set(current.hiddenUnits);
      for (const unitId of ids) {
        if (hide) next.add(unitId);
        else next.delete(unitId);
      }
      return { ...current, hiddenUnits: next };
    });
  };

  return (
    <div className="min-w-0">
      <p className="min-h-12 text-sm text-ink-muted">{meta.hint}</p>
      {filter === 'show' && (
        <div className="mt-2 flex">
          <ShowMenu
            shown={state.shown}
            preference={preference}
            open={state.showOpen}
            onOpen={(open) => onState((current) => ({ ...current, showOpen: open }))}
            onShown={(shown) => onState((current) => ({ ...current, shown }))}
          />
        </div>
      )}
      <div className={cx(LIST_CARD, FIELD_ROW, 'mt-2')}>
        <label htmlFor={`${id}-number`} className="sr-only">
          Number
        </label>
        <input
          id={`${id}-number`}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => onText(event.currentTarget.value)}
          className="min-w-0 flex-1 bg-transparent font-numeric text-3xl text-ink"
        />
        {chipUnit && (
          <UnitChip unit={chipUnit} compact={false} onOpen={() => undefined} onRemove={onRemove} />
        )}
      </div>
      <div className={cx(LIST_CARD, 'mt-2 p-2')}>
        {filter === 'presets' && (
          <div className="grid gap-2 pb-2">
            <div role="group" aria-label="How much to show" className="flex flex-wrap gap-1">
              {PRESETS.map((each) => (
                <Button
                  key={each.id}
                  variant="secondary"
                  nested
                  on={state.preset === each.id}
                  aria-pressed={state.preset === each.id}
                  onClick={() => onState((current) => ({ ...current, preset: each.id }))}
                  className="text-sm"
                >
                  {each.name}
                </Button>
              ))}
            </div>
            <p className="px-2 text-xs text-ink-muted">
              {PRESETS.find((each) => each.id === state.preset)?.hint}
            </p>
          </div>
        )}
        {filter === 'families' && chips.length > 0 && (
          <div className="grid gap-2 pb-2">
            <div role="group" aria-label="Families to show" className="flex flex-wrap gap-1">
              {chips.map((family) => {
                const on = state.families.has(family);
                return (
                  <Button
                    key={family}
                    variant="secondary"
                    nested
                    on={on}
                    aria-pressed={on}
                    onClick={() =>
                      onState((current) => ({
                        ...current,
                        families: toggleSet(current.families, family),
                      }))
                    }
                    className="text-sm"
                  >
                    {FAMILY_LABEL[family]}
                  </Button>
                );
              })}
            </div>
            <p className="px-2 text-xs text-ink-muted">{familyHint(category)}</p>
          </div>
        )}
        {filter === 'checks' && (
          <div className="flex items-center justify-end pb-1">
            <Button
              variant="ghost"
              nested
              onClick={() => onState((current) => ({ ...current, editing: !current.editing }))}
              className="text-sm"
            >
              {state.editing ? 'Done' : 'Edit'}
            </Button>
          </div>
        )}
        {filter === 'menu' && (
          <div className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                nested
                on={state.menuOpen}
                aria-expanded={state.menuOpen}
                onClick={() => onState((current) => ({ ...current, menuOpen: !current.menuOpen }))}
                className="text-sm"
              >
                Show
              </Button>
              {state.menuOpen && (
                <Button
                  variant="ghost"
                  nested
                  onClick={() => onState((current) => ({ ...current, hiddenSections: new Set() }))}
                  className="text-sm"
                >
                  Show all
                </Button>
              )}
            </div>
            {state.menuOpen && (
              <div role="group" aria-label="Sections to show" className="flex flex-wrap gap-x-4">
                {sections.map((section) => (
                  <label key={section.key} className={CHOICE}>
                    <input
                      type="checkbox"
                      checked={!state.hiddenSections.has(section.key)}
                      onChange={() =>
                        onState((current) => ({
                          ...current,
                          hiddenSections: toggleSet(current.hiddenSections, section.key),
                        }))
                      }
                      className={CHECKBOX}
                    />
                    {menuName(section)}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {filter === 'find' && (
          <div className="pb-2">
            <label htmlFor={`${id}-find`} className="sr-only">
              Find a unit
            </label>
            <input
              id={`${id}-find`}
              type="search"
              value={state.query}
              placeholder="Find a unit"
              onChange={(event) =>
                onState((current) => ({ ...current, query: event.currentTarget.value }))
              }
              className="min-h-11 w-full rounded-md border-2 border-edge bg-surface px-3 text-ink"
            />
          </div>
        )}
        {drawn.length === 0 ? (
          <p className="px-2 py-6 text-sm text-ink-muted">
            {filter === 'find'
              ? 'Nothing matches.'
              : filter === 'presets'
                ? 'Nothing shown. Choose All to bring the units back.'
                : 'Nothing shown. Turn a section back on.'}
          </p>
        ) : (
          <div ref={gridRef} className={ROWS}>
            {drawn.map((section, at) => {
              const symbols = sectionSymbols(section, cut !== 'fixed');
              const edge = at === 0 ? 'pt-1' : 'mt-1 border-t border-line pt-2';
              const checking = filter === 'checks' && state.editing;
              return (
                <div
                  key={section.key}
                  role="group"
                  aria-label={section.label ?? 'Units'}
                  className="col-span-6 grid grid-cols-subgrid gap-y-0.5"
                >
                  {section.label && filter === 'fold' ? (
                    <h3 className={cx('col-span-6', edge)}>
                      <button
                        type="button"
                        aria-expanded={!section.folded}
                        onClick={() =>
                          onState((current) => ({
                            ...current,
                            folds: toggleSet(current.folds, section.foldKey),
                          }))
                        }
                        className={cx(
                          PANEL_TITLE,
                          'flex min-h-11 w-full items-center gap-2 rounded-nested px-2 text-left hover:bg-surface-raised',
                        )}
                      >
                        <ChevronDownIcon
                          width="16"
                          height="16"
                          className={cx(
                            'shrink-0 transition-transform',
                            section.folded && '-rotate-90',
                          )}
                        />
                        {section.label}
                        {section.folded && (
                          <span className="font-numeric font-normal">{section.rows.length}</span>
                        )}
                      </button>
                    </h3>
                  ) : section.label ? (
                    <h3 className={cx('col-span-6', edge)}>
                      {checking ? (
                        <label
                          className={cx(
                            PANEL_TITLE,
                            'flex min-h-11 items-center gap-2 rounded-nested px-2',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={section.sectionOn}
                            onChange={() =>
                              setUnits(
                                section.rows.filter((row) => !row.inBox).map((row) => row.id),
                                section.sectionOn,
                              )
                            }
                            className={CHECKBOX}
                          />
                          {section.label}
                        </label>
                      ) : (
                        <span className={cx('block px-2 pb-1', PANEL_TITLE)}>{section.label}</span>
                      )}
                    </h3>
                  ) : (
                    at > 0 && (
                      <div aria-hidden="true" className="col-span-6 mt-1 border-t border-line" />
                    )
                  )}
                  {section.visible.map((row) => {
                    const symbol = symbols.get(row.id) ?? row.symbol;
                    const unchecked = state.hiddenUnits.has(row.id);
                    if (checking) {
                      return (
                        <label
                          key={row.id}
                          className={cx(
                            CURSOR_ROW,
                            'col-span-6 grid grid-cols-subgrid items-center',
                            rowFill(row.inBox, false),
                            unchecked && 'opacity-50',
                          )}
                        >
                          <RowCells row={row} symbol={symbol} namesHidden={namesHidden} />
                          <span className="grid size-11 place-items-center">
                            <input
                              type="checkbox"
                              checked={!unchecked || row.inBox}
                              disabled={row.inBox}
                              onChange={() => setUnits([row.id], !unchecked)}
                              className={CHECKBOX}
                            />
                          </span>
                        </label>
                      );
                    }
                    return (
                      <div key={row.id} className="col-span-6 grid grid-cols-subgrid items-center">
                        <button
                          type="button"
                          onClick={() => onTake(row)}
                          className={cx(
                            CURSOR_ROW,
                            'col-span-5 grid grid-cols-subgrid items-center',
                            rowFill(row.inBox, false),
                          )}
                        >
                          <RowCells row={row} symbol={symbol} namesHidden={namesHidden} />
                        </button>
                        {row.tone === 'value' ? (
                          <Button
                            variant="ghost"
                            square
                            nested
                            aria-label={`Copy ${row.name}`}
                            onClick={() => void navigator.clipboard?.writeText(String(row.value))}
                          >
                            <CopyIcon />
                          </Button>
                        ) : (
                          <span className="block size-11" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        <p className="flex items-center justify-between gap-2 border-t border-line px-2 pt-2 text-sm text-ink-muted">
          {filter === 'show' ? (
            <span>
              {visibleCount < rows.length ? (
                <>
                  <span className="font-numeric">{rows.length - visibleCount}</span> hidden
                </>
              ) : (
                'Every unit shown'
              )}
              {kept && ' · the unit in the box stays'}
            </span>
          ) : (
            <span>
              <span className="font-numeric">{visibleCount}</span> of{' '}
              <span className="font-numeric">{rows.length}</span>
              {kept && ' · the unit in the box stays'}
            </span>
          )}
          {filter === 'show' && visibleCount < rows.length && (
            <Button
              variant="ghost"
              nested
              onClick={() => onState((current) => ({ ...current, shown: new Set(SHOW_KEYS) }))}
              className="text-sm"
            >
              Show all
            </Button>
          )}
          {hiddenChecked > 0 && (
            <Button
              variant="ghost"
              nested
              onClick={() => onState((current) => ({ ...current, editing: true }))}
              className="text-sm"
            >
              <span className="font-numeric">{hiddenChecked}</span> hidden
            </Button>
          )}
        </p>
      </div>
    </div>
  );
}

function InlineRadios<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<{ id: T; name: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-x-4">
      <span className={PANEL_TITLE}>{label}</span>
      {options.map((option) => (
        <label key={option.id} className={CHOICE}>
          <input
            type="radio"
            name={name}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            className={CHECKBOX}
          />
          {option.name}
        </label>
      ))}
    </div>
  );
}

/**
 * Sections shared by two tables, and a filter of its own on each (docs/research/organization-lab.md).
 * Built from the real engine and table view, with the names giving way, and its own state.
 */
export function OrganizationLab() {
  const id = useId();
  const [cut, setCut] = useState<Cut>('fixed');
  const [filters, setFilters] = useState<[FilterId, FilterId]>(['show', 'fold']);
  const [system, setSystem] = useState<UnitPreference>('us');
  const [category, setCategory] = useState<CategoryId>('volume');
  const [unit, setUnit] = useState<string | null>(SAMPLES.volume?.unit ?? null);
  const [text, setText] = useState(SAMPLES.volume?.text ?? '');
  const [columns, setColumns] = useState<[FilterState, FilterState]>([
    freshFilter(),
    freshFilter(),
  ]);

  const locale = browserLocale();
  const rows = useMemo(() => {
    const env = { locale, separators: localeSeparators(locale), system };
    const state = { ...initialState, text, unit, category };
    const shown = selectTable(state, env);
    const view = shown.kind === 'units' ? shown : selectTable({ ...state, text: '' }, env);
    return view.kind === 'units' ? view.rows : [];
  }, [locale, system, text, unit, category]);

  const choose = (next: CategoryId) => {
    setCategory(next);
    setUnit(SAMPLES[next]?.unit ?? null);
    setText(SAMPLES[next]?.text ?? '');
    // The Show menu's switches are one setting for every category, so they stay.
    const reset = (column: FilterState): FilterState => ({
      ...column,
      folds: new Set<string>(),
      hiddenUnits: new Set<string>(),
      hiddenSections: new Set<string>(),
      query: '',
      editing: false,
      menuOpen: false,
      showOpen: false,
    });
    setColumns((current) => [reset(current[0]), reset(current[1])]);
  };
  const take = (row: TableRow) => {
    if (row.inBox || row.tone === 'message') return;
    setText(row.value === null ? text : formatNumber(row.value, { precision: 10, locale }));
    setUnit(row.id);
  };
  const startOver = () => {
    setColumns([freshFilter(), freshFilter()]);
    setUnit(SAMPLES[category]?.unit ?? null);
    setText(SAMPLES[category]?.text ?? '');
  };
  const setColumn = (index: 0 | 1, update: (current: FilterState) => FilterState) => {
    setColumns((current) => {
      const next: [FilterState, FilterState] = [current[0], current[1]];
      next[index] = update(current[index]);
      return next;
    });
  };

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <InlineRadios
          label="Sections"
          name={`${id}-cut`}
          options={CUTS}
          value={cut}
          onChange={setCut}
        />
        <InlineRadios
          label="Region"
          name={`${id}-region`}
          options={REGIONS}
          value={system}
          onChange={setSystem}
        />
        <Button variant="secondary" onClick={startOver}>
          Start over
        </Button>
      </div>
      <CategoryMenu categories={categories} value={category} onChoose={choose} />
      <div className="grid items-start gap-8 md:grid-cols-2 md:gap-4">
        {([0, 1] as const).map((index) => (
          <div key={index} className="grid min-w-0 gap-2">
            <div role="group" aria-label={index === 0 ? 'Left filter' : 'Right filter'}>
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((each) => (
                  <Button
                    key={each.id}
                    variant="secondary"
                    on={filters[index] === each.id}
                    aria-pressed={filters[index] === each.id}
                    onClick={() =>
                      setFilters((current) => {
                        const next: [FilterId, FilterId] = [current[0], current[1]];
                        next[index] = each.id;
                        return next;
                      })
                    }
                    className="text-sm"
                  >
                    {each.name}
                  </Button>
                ))}
              </div>
            </div>
            <Mock
              filter={filters[index]}
              cut={cut}
              rows={rows}
              category={category}
              preference={system}
              text={text}
              unit={unit}
              state={columns[index]}
              onText={setText}
              onTake={take}
              onRemove={() => setUnit(null)}
              onState={(update) => setColumn(index, update)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
