import {
  categories,
  getCategory,
  localeSeparators,
  parse,
  unitsIn,
  type CategoryId,
  type Unit,
  type UnitPreference,
} from '@bigsmall/core';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { Button } from '../../../components/Button';
import { CategoryMenu } from '../../../components/CategoryMenu';
import {
  CalculatorIcon,
  ChevronDownIcon,
  CopyIcon,
  EraserIcon,
  RedoIcon,
  UndoIcon,
} from '../../../components/icons';
import { ToolbarDivider } from '../../../components/ToolbarDivider';
import {
  initialState,
  selectTable,
  type MatchesView,
  type TableRow,
} from '../../../features/converter/state';
import { useColumnsFit } from '../../../lib/fit-step';
import {
  CARD,
  cx,
  CURSOR_ROW,
  LIST_CARD,
  PANEL_TITLE,
  rowFill,
  unitSymbol,
} from '../../../lib/recipes';
import { browserLocale } from '../../../lib/region';
import { DENOMINATORS, displayChanged, displayValue, FRESH_DISPLAY, type Display } from './display';
import { BoxField, CHECKBOX, GIVE_WAY, RowCells, ROWS, toggleSet } from './parts';
import { FIXED_LABEL, fixedKeyOf, sectionsOf, SHOW_KEYS, type FixedKey } from './sections';
import {
  exceptionsIn,
  FRESH_RULE,
  groupState,
  presetKeys,
  presetOf,
  shows,
  SHOW_PRESETS,
  withChoice,
  withoutExceptions,
  withSystem,
  withSystems,
  type GroupState,
  type ShowPreset,
  type ViewRule,
} from './view-rule';

/**
 * The settings lab (docs/research/organization-lab.md, 2026-10-10): Sean's model in the context of
 * the action bar. A Settings button shapes what shows (the units, in every category) and how it
 * looks (names, copy buttons, decimals or fractions, rounding); the table heads its sections by
 * system and keeps what is hidden in a Hidden section at its foot; search leaves hidden units out
 * and says when one matches. Two ways to choose single units, side by side: in the table, or in
 * Settings. Built from the real engine, table view, menu, chip, and toolbar parts, with state of
 * its own: no undo, no URL, no arrow keys.
 */

type Variant = 'separate' | 'together';

const VARIANTS: ReadonlyArray<{ id: Variant; name: string; hint: string }> = [
  {
    id: 'separate',
    name: '1. Separate',
    hint: 'Settings set every category. Single units are chosen in the table: Edit at its foot puts a checkbox on every row and a three-state one on every heading.',
  },
  {
    id: 'together',
    name: '2. Together',
    hint: 'Settings show this category under each system: its checkbox reads all, some, or none of them here and sets the system everywhere, and it opens to the units, chosen here alone.',
  },
];

const REGIONS: ReadonlyArray<{ id: UnitPreference; name: string }> = [
  { id: 'us', name: 'US' },
  { id: 'imperial', name: 'UK' },
  { id: 'metric', name: 'Metric' },
];

/** A sample for each category, so switching shows values at once. */
const SAMPLES: Partial<Record<CategoryId, { unit: string; text: string }>> = {
  length: { unit: 'foot', text: '6.3' },
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

interface Ui {
  rule: ViewRule;
  display: Display;
  settingsOpen: boolean;
  /** The table is the checklist (variant 1). */
  editing: boolean;
  hiddenOpen: boolean;
  /** The hidden units a typed query matches, shown. */
  revealMatches: boolean;
  /** Systems opened to their units in Settings (variant 2). */
  expanded: ReadonlySet<FixedKey>;
}

function freshUi(): Ui {
  return {
    rule: FRESH_RULE,
    display: FRESH_DISPLAY,
    settingsOpen: false,
    editing: false,
    hiddenOpen: false,
    revealMatches: false,
    expanded: new Set(),
  };
}

/** A new category keeps every setting and exception; what was open closes. */
function closed(ui: Ui): Ui {
  return { ...ui, settingsOpen: false, editing: false, revealMatches: false, expanded: new Set() };
}

type UpdateUi = (update: (ui: Ui) => Ui) => void;

const OPTION_LINE =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-nested-md px-2 text-sm text-ink hover:bg-surface-raised';
const PILL =
  'flex min-h-11 cursor-pointer items-center rounded-md border-2 border-edge px-3 text-sm text-ink focus-ring-within-inset has-checked:border-transparent has-checked:bg-accent-soft has-disabled:cursor-not-allowed has-disabled:opacity-50';
const SUBHEAD = cx(PANEL_TITLE, 'text-xs');

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

/** A checkbox for a group: checked for all its units, a dash for some, clear for none. */
function TriCheckbox({ state, onChange }: { state: GroupState; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'some';
  });
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === 'all'}
      onChange={onChange}
      className={CHECKBOX}
    />
  );
}

/** One choice of a few, as pills. */
function Pills<T extends string>({
  legend,
  options,
  value,
  disabled = false,
  onChange,
}: {
  legend: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="grid gap-1">
      <legend className={cx(SUBHEAD, 'pb-1')}>{legend}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <label key={option.value} className={PILL}>
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const PLACES: ReadonlyArray<{ value: string; label: string; places: Display['places'] }> = [
  { value: '1', label: '0.1', places: 1 },
  { value: '2', label: '0.01', places: 2 },
  { value: '3', label: '0.001', places: 3 },
  { value: 'none', label: 'No limit', places: null },
];

/**
 * Settings: what shows, in every category, then how it looks. Variant 1 lists the systems as
 * switches for every category; variant 2 shows this category under each one.
 */
function SettingsPanel({
  variant,
  id,
  ui,
  preference,
  category,
  boxUnit,
  onUi,
}: {
  variant: Variant;
  id: string;
  ui: Ui;
  preference: UnitPreference;
  category: CategoryId;
  boxUnit: string | null;
  onUi: UpdateUi;
}) {
  const { rule, display } = ui;
  const name = getCategory(category)?.name ?? '';
  const here = unitsIn(category);
  const isShown = (unit: Unit) => unit.id === boxUnit || shows(unit, rule, preference);
  const exceptions = exceptionsIn(rule, here);
  const setRule = (next: (rule: ViewRule) => ViewRule) =>
    onUi((now) => ({ ...now, rule: next(now.rule) }));
  const setDisplay = (patch: Partial<Display>) =>
    onUi((now) => ({ ...now, display: { ...now.display, ...patch } }));

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Settings"
      onPointerDown={(event) => event.preventDefault()}
      className={cx(
        CARD,
        'absolute top-full right-0 z-20 mt-1 grid max-h-120 w-80 gap-4 overflow-y-auto p-3 shadow-md',
      )}
    >
      <section className="grid gap-2" aria-label="Units">
        <div>
          <h3 className={PANEL_TITLE}>Units</h3>
          <p className="text-xs text-ink-muted">
            What the table and search show, in every category.
          </p>
        </div>
        <Pills<ShowPreset>
          legend="Show"
          options={SHOW_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
          value={presetOf(rule.shown, preference)}
          onChange={(preset) =>
            setRule((now) => withSystems(now, presetKeys(preset, preference), preference))
          }
        />
        <fieldset className="grid">
          <legend className={cx(SUBHEAD, 'pb-1')}>
            {variant === 'separate' ? 'Systems' : `Systems, and the units in ${name}`}
          </legend>
          {SHOW_KEYS.map((key) => {
            const units = here.filter((unit) => fixedKeyOf(unit, preference) === key);
            if (variant === 'separate' || units.length === 0) {
              return (
                <label key={key} className={OPTION_LINE}>
                  <input
                    type="checkbox"
                    checked={rule.shown.has(key)}
                    onChange={() =>
                      setRule((now) => withSystem(now, key, !now.shown.has(key), preference))
                    }
                    className={CHECKBOX}
                  />
                  {FIXED_LABEL[key]}
                  {variant === 'together' && (
                    <span className="ml-auto text-xs text-ink-muted">none in {name}</span>
                  )}
                </label>
              );
            }
            const state = groupState(units, isShown);
            const open = ui.expanded.has(key);
            return (
              <div key={key}>
                <div className="flex items-center">
                  <label className={cx(OPTION_LINE, 'min-w-0 flex-1')}>
                    <TriCheckbox
                      state={state}
                      onChange={() =>
                        setRule((now) => withSystem(now, key, state !== 'all', preference))
                      }
                    />
                    {FIXED_LABEL[key]}
                    <span className="ml-auto font-numeric text-xs text-ink-muted">
                      {units.filter(isShown).length} of {units.length}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-label={`${FIXED_LABEL[key]} units in ${name}`}
                    onClick={() =>
                      onUi((now) => ({ ...now, expanded: toggleSet(now.expanded, key) }))
                    }
                    className="grid size-11 shrink-0 place-items-center rounded-nested-md text-ink-muted hover:bg-surface-raised"
                  >
                    <ChevronDownIcon
                      width="16"
                      height="16"
                      className={cx('transition-transform', !open && '-rotate-90')}
                    />
                  </button>
                </div>
                {open &&
                  units.map((unit) => (
                    <label key={unit.id} className={cx(OPTION_LINE, 'pl-8')}>
                      <input
                        type="checkbox"
                        checked={isShown(unit)}
                        disabled={unit.id === boxUnit}
                        onChange={() =>
                          setRule((now) => withChoice(now, [unit], !isShown(unit), preference))
                        }
                        className={CHECKBOX}
                      />
                      <span className={unitSymbol()}>{unit.symbol}</span>
                      <span className="truncate">{unit.plural}</span>
                      {unit.id === boxUnit && (
                        <span className="ml-auto text-xs text-ink-muted">in the box</span>
                      )}
                    </label>
                  ))}
              </div>
            );
          })}
        </fieldset>
        <p className="text-xs text-ink-muted">
          {variant === 'separate'
            ? 'A system switch sets every category and clears the units chosen against it.'
            : 'A system’s checkbox sets it in every category and clears the units chosen against it; a unit’s sets that unit alone.'}
        </p>
        {exceptions > 0 && (
          <p className="flex items-center justify-between gap-2 text-xs text-ink-muted">
            <span>
              <span className="font-numeric">{exceptions}</span>{' '}
              {exceptions === 1 ? 'unit' : 'units'} chosen on {exceptions === 1 ? 'its' : 'their'}{' '}
              own in {name}
            </span>
            <Button
              variant="ghost"
              nested
              onClick={() => setRule((now) => withoutExceptions(now, here))}
              className="text-sm"
            >
              Reset {name}
            </Button>
          </p>
        )}
      </section>

      <section className="grid gap-3 border-t border-line pt-3" aria-label="Display">
        <h3 className={PANEL_TITLE}>Display</h3>
        <Pills
          legend="Unit names"
          options={[
            { value: 'both', label: 'Symbol and name' },
            { value: 'symbol', label: 'Symbol only' },
          ]}
          value={display.names}
          onChange={(names) => setDisplay({ names })}
        />
        <label className={OPTION_LINE}>
          <input
            type="checkbox"
            checked={display.copy}
            onChange={() => setDisplay({ copy: !display.copy })}
            className={CHECKBOX}
          />
          Copy buttons
        </label>
        <Pills
          legend="Format"
          options={[
            { value: 'decimal', label: 'Decimals' },
            { value: 'fraction', label: 'Fractions' },
          ]}
          value={display.format}
          onChange={(format) => setDisplay({ format })}
        />
        {display.format === 'decimal' ? (
          <Pills
            legend="Round to"
            options={PLACES}
            value={PLACES.find((each) => each.places === display.places)?.value ?? null}
            onChange={(value) =>
              setDisplay({ places: PLACES.find((each) => each.value === value)?.places ?? null })
            }
          />
        ) : (
          <fieldset className="grid gap-1">
            <legend className={cx(SUBHEAD, 'pb-1')}>Fractions in</legend>
            <div className="flex flex-wrap gap-1">
              {DENOMINATORS.map((of) => (
                <label key={of} className={PILL}>
                  <input
                    type="checkbox"
                    checked={display.denominators.has(of)}
                    onChange={() =>
                      setDisplay({ denominators: toggleSet(display.denominators, of) })
                    }
                    className="sr-only"
                  />
                  1/{of}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Pills
          legend="Rounding"
          options={[
            { value: 'nearest', label: 'Nearest' },
            { value: 'up', label: 'Up' },
            { value: 'down', label: 'Down' },
          ]}
          value={display.rounding}
          disabled={display.format === 'decimal' && display.places === null}
          onChange={(rounding) => setDisplay({ rounding })}
        />
      </section>
      <div className="border-t border-line pt-2">
        <Button
          variant="ghost"
          onClick={() => onUi((now) => ({ ...now, rule: FRESH_RULE, display: FRESH_DISPLAY }))}
          className="text-sm"
        >
          Reset all settings
        </Button>
      </div>
    </div>
  );
}

/** The table: sections headed by system, hidden units kept at its foot, values as Display writes them. */
function ResultsTable({
  variant,
  ui,
  rows,
  preference,
  locale,
  onUi,
  onTake,
}: {
  variant: Variant;
  ui: Ui;
  rows: readonly TableRow[];
  preference: UnitPreference;
  locale: string | undefined;
  onUi: UpdateUi;
  onTake: (row: TableRow) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const namesHidden = useColumnsFit(gridRef, GIVE_WAY).includes('name');
  const withName = ui.display.names === 'both';
  const isShown = (row: TableRow) => row.inBox || shows(row.unit, ui.rule, preference);
  const editing = variant === 'separate' && ui.editing;
  const hidden = rows.filter((row) => !isShown(row));
  const shownValue = (row: TableRow) =>
    row.tone === 'value' ? displayValue(row.value, ui.display, locale) : null;
  const choose = (chosen: readonly TableRow[], show: boolean) =>
    onUi((now) => ({
      ...now,
      rule: withChoice(
        now.rule,
        chosen.filter((row) => !row.inBox).map((row) => row.unit),
        show,
        preference,
      ),
    }));

  /** A row that is a checkbox: in Edit, or in the Hidden section. */
  const checkRow = (row: TableRow) => {
    const on = isShown(row);
    return (
      <label
        key={row.id}
        className={cx(
          CURSOR_ROW,
          'col-span-6 grid grid-cols-subgrid items-center',
          rowFill(row.inBox, false),
        )}
      >
        <RowCells
          row={row}
          shown={shownValue(row)}
          namesHidden={namesHidden}
          withName={withName}
          muted={!on}
        />
        <span className="grid size-11 place-items-center">
          <input
            type="checkbox"
            checked={on}
            disabled={row.inBox}
            onChange={() => choose([row], !on)}
            className={CHECKBOX}
          />
        </span>
      </label>
    );
  };

  const headedCheck = (label: string, group: readonly TableRow[], edge: string) => {
    const state = groupState(group, isShown);
    return (
      <h4 className={cx('col-span-6', edge)}>
        <label className={cx(PANEL_TITLE, 'flex min-h-11 items-center gap-2 px-2')}>
          <TriCheckbox state={state} onChange={() => choose(group, state !== 'all')} />
          {label}
        </label>
      </h4>
    );
  };

  return (
    <div className={cx(LIST_CARD, 'p-2')}>
      {editing && (
        <div className="flex items-center justify-between gap-2 pb-1 pl-2">
          <span className={PANEL_TITLE}>Choose the units to show</span>
          <Button
            variant="ghost"
            nested
            onClick={() => onUi((now) => ({ ...now, editing: false }))}
            className="text-sm"
          >
            Done
          </Button>
        </div>
      )}
      <div ref={gridRef} className={ROWS}>
        {sectionsOf(rows, preference).map((section, at) => {
          const listed = editing ? section.rows : section.rows.filter(isShown);
          if (listed.length === 0) return null;
          const edge = at === 0 ? 'pt-1' : 'mt-1 border-t border-line pt-2';
          return (
            <div
              key={section.key}
              role="group"
              aria-label={section.label}
              className="col-span-6 grid grid-cols-subgrid gap-y-0.5"
            >
              {editing ? (
                headedCheck(section.label, section.rows, edge)
              ) : (
                <h4 className={cx('col-span-6 px-2 pb-1', PANEL_TITLE, edge)}>{section.label}</h4>
              )}
              {listed.map((row) => {
                if (editing) return checkRow(row);
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
                      <RowCells
                        row={row}
                        shown={shownValue(row)}
                        namesHidden={namesHidden}
                        withName={withName}
                      />
                    </button>
                    {ui.display.copy &&
                      (row.tone === 'value' ? (
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
                      ))}
                  </div>
                );
              })}
            </div>
          );
        })}
        {!editing && (hidden.length > 0 || variant === 'separate') && (
          <div className="col-span-6 mt-1 flex min-h-11 items-center justify-between gap-2 border-t border-line pt-1">
            {hidden.length > 0 ? (
              <button
                type="button"
                aria-expanded={ui.hiddenOpen}
                onClick={() => onUi((now) => ({ ...now, hiddenOpen: !now.hiddenOpen }))}
                className={cx(
                  PANEL_TITLE,
                  'flex min-h-11 items-center gap-2 rounded-nested px-2 hover:bg-surface-raised',
                )}
              >
                <ChevronDownIcon
                  width="16"
                  height="16"
                  className={cx('transition-transform', !ui.hiddenOpen && '-rotate-90')}
                />
                Hidden
                <span className="font-numeric font-normal">{hidden.length}</span>
              </button>
            ) : (
              <span className="px-2 text-sm text-ink-muted">Every unit shown</span>
            )}
            {variant === 'separate' && (
              <Button
                variant="ghost"
                nested
                onClick={() => onUi((now) => ({ ...now, editing: true }))}
                className="text-sm"
              >
                Edit
              </Button>
            )}
          </div>
        )}
        {!editing &&
          ui.hiddenOpen &&
          sectionsOf(hidden, preference).map((section) => (
            <div
              key={section.key}
              role="group"
              aria-label={`Hidden, ${section.label}`}
              className="col-span-6 grid grid-cols-subgrid gap-y-0.5"
            >
              {headedCheck(section.label, section.rows, 'pt-1')}
              {section.rows.map((row) => checkRow(row))}
            </div>
          ))}
      </div>
    </div>
  );
}

/** While a unit is typed: the matches that show; a line, and a way in, for those that are hidden. */
function MatchesList({
  view,
  ui,
  preference,
  onUi,
  onTake,
}: {
  view: MatchesView;
  ui: Ui;
  preference: UnitPreference;
  onUi: UpdateUi;
  onTake: (unit: Unit) => void;
}) {
  const units = view.rows.flatMap((row) => (row.kind === 'unit' ? [row] : []));
  const visible = (row: (typeof units)[number]) =>
    row.inBox || shows(row.unit, ui.rule, preference);
  const shown = units.filter(visible);
  const hidden = units.filter((row) => !visible(row));
  const groups = new Map<string, typeof shown>();
  for (const row of shown) {
    groups.set(row.category.name, [...(groups.get(row.category.name) ?? []), row]);
  }
  const line = (row: (typeof units)[number], hint?: string): ReactNode => (
    <button
      key={row.unit.id}
      type="button"
      onClick={() => onTake(row.unit)}
      className={cx(
        CURSOR_ROW,
        'flex w-full items-center gap-2 text-left',
        rowFill(row.inBox, false),
      )}
    >
      <span className={unitSymbol()}>{row.unit.symbol}</span>
      <span className="truncate text-ink">{row.unit.plural}</span>
      {hint && <span className="ml-auto text-xs text-ink-muted">{hint}</span>}
    </button>
  );
  return (
    <div className={cx(LIST_CARD, 'grid gap-1 p-2')}>
      {[...groups].map(([name, rows]) => (
        <div key={name} role="group" aria-label={name}>
          <p className={cx(PANEL_TITLE, 'px-2 pt-1 pb-1')}>{name}</p>
          {rows.map((row) => line(row))}
        </div>
      ))}
      {shown.length === 0 && hidden.length === 0 && (
        <p className="px-2 py-2 text-sm text-ink-muted">No unit matches.</p>
      )}
      {hidden.length > 0 && (
        <div
          className={cx(
            'flex min-h-11 items-center justify-between gap-2',
            shown.length > 0 && 'border-t border-line pt-1',
          )}
        >
          <span className="px-2 text-sm text-ink-muted">
            {shown.length === 0 ? (
              'Only hidden units match'
            ) : (
              <>
                <span className="font-numeric">{hidden.length}</span> hidden{' '}
                {hidden.length === 1 ? 'unit also matches' : 'units also match'}
              </>
            )}
          </span>
          <Button
            variant="ghost"
            nested
            aria-expanded={ui.revealMatches}
            onClick={() => onUi((now) => ({ ...now, revealMatches: !now.revealMatches }))}
            className="text-sm"
          >
            {ui.revealMatches ? 'Hide them' : 'Show them'}
          </Button>
        </div>
      )}
      {hidden.length > 0 && ui.revealMatches && (
        <div role="group" aria-label="Hidden matches">
          <p className={cx(PANEL_TITLE, 'px-2 pt-1 pb-1')}>Hidden</p>
          {hidden.map((row) =>
            line(row, `${row.category.name} · ${FIXED_LABEL[fixedKeyOf(row.unit, preference)]}`),
          )}
        </div>
      )}
    </div>
  );
}

/** One converter: its action bar, the box, and the table or the matches. */
function Converter({
  variant,
  preference,
  locale,
  category,
  text,
  unit,
  ui,
  onCategory,
  onText,
  onUnit,
  onUi,
}: {
  variant: Variant;
  preference: UnitPreference;
  locale: string | undefined;
  category: CategoryId;
  text: string;
  unit: string | null;
  ui: Ui;
  onCategory: (category: CategoryId) => void;
  onText: (text: string) => void;
  onUnit: (unit: string | null) => void;
  onUi: UpdateUi;
}) {
  const id = useId();
  const meta = VARIANTS.find((each) => each.id === variant) ?? VARIANTS[0]!;
  const separators = useMemo(() => localeSeparators(locale), [locale]);
  const view = useMemo(
    () =>
      selectTable(
        { ...initialState, text, unit, category },
        { locale, separators, system: preference },
      ),
    [text, unit, category, locale, separators, preference],
  );
  const changed =
    ui.rule.overrides.size > 0 ||
    ui.rule.shown.size !== SHOW_KEYS.length ||
    displayChanged(ui.display);
  const close = () => onUi((now) => ({ ...now, settingsOpen: false }));

  useEffect(() => {
    if (!ui.settingsOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const take = (chosen: Unit, number: string) => {
    onUnit(chosen.id);
    onText(number);
  };

  return (
    <div className="min-w-0">
      <h2 className="font-display text-lg font-semibold">{meta.name}</h2>
      <p className="min-h-16 text-sm text-ink-muted">{meta.hint}</p>
      <div
        role="toolbar"
        aria-label={`Tools, ${meta.name}`}
        className="relative mt-2 mb-2 flex flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2"
      >
        <CategoryMenu categories={categories} value={category} onChoose={onCategory} />
        <div className="flex shrink-0 items-center gap-1">
          <div
            className="contents"
            onBlur={(event: FocusEvent<HTMLDivElement>) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
            }}
          >
            <Button
              variant="ghost"
              square
              on={ui.settingsOpen}
              aria-expanded={ui.settingsOpen}
              aria-controls={`${id}-settings`}
              aria-label={changed ? 'Settings, changed' : 'Settings'}
              title="Settings"
              onClick={() => onUi((now) => ({ ...now, settingsOpen: !now.settingsOpen }))}
              className="relative"
            >
              <SlidersIcon />
              {changed && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 size-2 rounded-full bg-accent"
                />
              )}
            </Button>
            {ui.settingsOpen && (
              <SettingsPanel
                variant={variant}
                id={`${id}-settings`}
                ui={ui}
                preference={preference}
                category={category}
                boxUnit={unit}
                onUi={onUi}
              />
            )}
          </div>
          <ToolbarDivider />
          <Button variant="ghost" square aria-label="Calculator" aria-disabled title="Calculator">
            <CalculatorIcon />
          </Button>
          <ToolbarDivider />
          <Button variant="ghost" square aria-label="Undo" aria-disabled title="Undo">
            <UndoIcon />
          </Button>
          <Button variant="ghost" square aria-label="Redo" aria-disabled title="Redo">
            <RedoIcon />
          </Button>
          <ToolbarDivider />
          <Button
            variant="ghost"
            square
            aria-label="Clear all"
            title="Clear all"
            onClick={() => {
              onText('');
              onUnit(null);
            }}
          >
            <EraserIcon />
          </Button>
        </div>
      </div>
      <BoxField text={text} unit={unit} onText={onText} onRemove={() => onUnit(null)} />
      <div className="mt-2">
        {view.kind === 'matches' ? (
          <MatchesList
            view={view}
            ui={ui}
            preference={preference}
            onUi={onUi}
            onTake={(chosen) => take(chosen, parse(text, separators).valueText ?? '')}
          />
        ) : view.kind === 'units' ? (
          <ResultsTable
            variant={variant}
            ui={ui}
            rows={view.rows}
            preference={preference}
            locale={locale}
            onUi={onUi}
            onTake={(row) => {
              if (row.inBox || row.tone === 'message' || row.value === null) return;
              take(row.unit, String(Number(row.value.toPrecision(10))));
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function OrganizationLab() {
  const id = useId();
  const [system, setSystem] = useState<UnitPreference>('us');
  const [category, setCategory] = useState<CategoryId>('volume');
  const [unit, setUnit] = useState<string | null>(SAMPLES.volume?.unit ?? null);
  const [text, setText] = useState(SAMPLES.volume?.text ?? '');
  const [uis, setUis] = useState<[Ui, Ui]>([freshUi(), freshUi()]);
  const locale = browserLocale();

  const choose = (next: CategoryId) => {
    setCategory(next);
    setUnit(SAMPLES[next]?.unit ?? null);
    setText(SAMPLES[next]?.text ?? '');
    setUis((current) => [closed(current[0]), closed(current[1])]);
  };
  const startOver = () => {
    setUis([freshUi(), freshUi()]);
    setUnit(SAMPLES[category]?.unit ?? null);
    setText(SAMPLES[category]?.text ?? '');
  };

  return (
    <div className="mt-6 grid gap-6">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <div role="group" aria-label="Region" className="flex flex-wrap items-center gap-x-4">
          <span className={PANEL_TITLE}>Region</span>
          {REGIONS.map((region) => (
            <label key={region.id} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${id}-region`}
                checked={system === region.id}
                onChange={() => setSystem(region.id)}
                className={CHECKBOX}
              />
              {region.name}
            </label>
          ))}
        </div>
        <Button variant="secondary" onClick={startOver}>
          Start over
        </Button>
      </div>
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-6">
        {VARIANTS.map((variant, index) => (
          <Converter
            key={variant.id}
            variant={variant.id}
            preference={system}
            locale={locale}
            category={category}
            text={text}
            unit={unit}
            ui={uis[index]!}
            onCategory={choose}
            onText={setText}
            onUnit={setUnit}
            onUi={(update) =>
              setUis((current) => {
                const next: [Ui, Ui] = [current[0], current[1]];
                next[index] = update(current[index]!);
                return next;
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
