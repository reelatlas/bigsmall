import {
  categories,
  localeSeparators,
  parse,
  type CategoryId,
  type Unit,
  type UnitPreference,
} from '@bigsmall/core';
import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import {
  displayChanged,
  displayValue,
  fractionsOf,
  FRESH_DISPLAY,
  heldBy,
  SIZE_NAME,
  SIZES,
  type Display,
  type Size,
} from './display';
import {
  BoxField,
  CHECKBOX,
  ChoiceRow,
  GIVE_WAY,
  RowCells,
  ROWS,
  Switch,
  ToggleRow,
  type Look,
} from './parts';
import { FIXED_LABEL, fixedKeyOf, sectionsOf, SHOW_KEYS } from './sections';
import {
  FRESH_RULE,
  groupState,
  hiddenByHand,
  presetKeys,
  presetOf,
  shows,
  SHOW_PRESETS,
  switchesChanged,
  withChoice,
  withoutHidden,
  withSystem,
  withSystems,
  type GroupState,
  type ShowPreset,
  type ViewRule,
} from './view-rule';

/**
 * The settings lab (docs/research/organization-lab.md, 2026-10-10): Sean's model in the context of
 * the action bar, with single units chosen in the table (Separate, Sean's direction). A Settings
 * button shapes what shows (the units, in every category) and how it looks (names, copy buttons,
 * decimals or fractions, rounding); the table heads its sections by system and keeps what is hidden
 * in a Hidden section at its foot; search leaves hidden units out and says when one matches. Two
 * looks for Settings' choices, side by side: compact pills, and a segmented control. Built from the
 * real engine, table view, menu, chip, and toolbar parts, with state of its own: no undo, no URL,
 * no arrow keys.
 */

const LOOKS: ReadonlyArray<{ id: Look; name: string; hint: string }> = [
  {
    id: 'pills',
    name: '1. Compact pills',
    hint: 'Each choice its own pill, drawn 32 px tall with less padding than today’s 44 px; each still takes a 44 px tap.',
  },
  {
    id: 'segmented',
    name: '2. Segmented control',
    hint: 'A setting’s choices joined in one strip, a line between each, at the same size; the same 44 px tap.',
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
  /** The table is the checklist. */
  editing: boolean;
  hiddenOpen: boolean;
  /** The hidden units a typed query matches, shown. */
  revealMatches: boolean;
}

function freshUi(): Ui {
  return {
    rule: FRESH_RULE,
    display: FRESH_DISPLAY,
    settingsOpen: false,
    editing: false,
    hiddenOpen: false,
    revealMatches: false,
  };
}

/** A new category keeps every setting and exception; what was open closes. */
function closed(ui: Ui): Ui {
  return { ...ui, settingsOpen: false, editing: false, revealMatches: false };
}

type UpdateUi = (update: (ui: Ui) => Ui) => void;

const OPTION_LINE =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-nested-md px-2 text-sm text-ink hover:bg-surface-raised';
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

/** One choice of a few, under its legend, in the converter's look. */
function Choices<T extends string | number>({
  look,
  legend,
  options,
  value,
  disabled = false,
  hideLegend = false,
  onChange,
}: {
  look: Look;
  legend: string;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  value: T | null;
  disabled?: boolean;
  /** The legend for screen readers alone, where the choices say what they are (Sean, 2026-10-10). */
  hideLegend?: boolean;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="grid">
      <legend className={hideLegend ? 'sr-only' : SUBHEAD}>{legend}</legend>
      <ChoiceRow look={look} name={name} options={options} value={value} onChange={onChange} />
    </fieldset>
  );
}

const PLACES: ReadonlyArray<{ value: string; label: string; places: Display['places'] }> = [
  { value: '1', label: '0.1', places: 1 },
  { value: '2', label: '0.01', places: 2 },
  { value: '3', label: '0.001', places: 3 },
  { value: 'none', label: 'No limit', places: null },
];

/** What the sizes chosen write, in full up to nine, the ends of the list past them. */
function sizesPreview(chosen: ReadonlySet<Size>): string {
  const all = fractionsOf(chosen).map((f) => `${f.n}/${f.d}`);
  if (all.length <= 9) return all.join(', ');
  return `${all.slice(0, 3).join(', ')} … ${all.at(-1)}, ${all.length} in all`;
}

/** The two rows of sizes: halves to eighths, then the finer ones. */
const SIZE_ROWS: ReadonlyArray<readonly Size[]> = [SIZES.slice(0, 4), SIZES.slice(4)];

/**
 * Fractions in the sizes chosen, several at once (Sean, 2026-10-10): each writes its whole grid,
 * and a finer one holds the coarser it contains, which then show chosen and locked. Thirds stand
 * alone. A line under them says what the sizes write.
 */
function FractionSizes({
  look,
  chosen,
  onChange,
}: {
  look: Look;
  chosen: ReadonlySet<Size>;
  onChange: (chosen: ReadonlySet<Size>) => void;
}) {
  const toggle = (size: Size) => {
    const next = new Set(chosen);
    if (next.has(size)) next.delete(size);
    else next.add(size);
    onChange(next);
  };
  return (
    <fieldset className="grid">
      <legend className={SUBHEAD}>Round to</legend>
      {SIZE_ROWS.map((sizes) => (
        <ToggleRow<Size>
          key={sizes.join()}
          look={look}
          options={sizes.map((size) => {
            const holder = heldBy(size, chosen);
            return {
              value: size,
              checked: holder !== null || chosen.has(size),
              locked: holder !== null,
              ...(holder ? { title: `In 1/${holder} already` } : {}),
              label: (
                <>
                  <span className="font-numeric">1/{size}</span>
                  <span className="sr-only">
                    , {SIZE_NAME[size]}
                    {holder && `, in ${SIZE_NAME[holder]} already`}
                  </span>
                </>
              ),
            };
          })}
          onToggle={toggle}
        />
      ))}
      <p className="pt-1 text-xs text-ink-muted">
        {chosen.size > 0 ? (
          <>
            Shows <span className="font-numeric">{sizesPreview(chosen)}</span>
          </>
        ) : (
          'Choose a size to write fractions; until then values keep their decimals.'
        )}
      </p>
    </fieldset>
  );
}

/** Settings: what shows, in every category, then how it looks. */
function SettingsPanel({
  look,
  id,
  ui,
  preference,
  onUi,
}: {
  look: Look;
  id: string;
  ui: Ui;
  preference: UnitPreference;
  onUi: UpdateUi;
}) {
  const { rule, display } = ui;
  const hiddenCount = hiddenByHand(rule);
  const settingsChanged = switchesChanged(rule) || displayChanged(display);
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
        'absolute top-full right-0 z-20 mt-1 grid max-h-120 w-80 gap-3 overflow-y-auto p-3 shadow-md',
      )}
    >
      <section className="grid gap-2" aria-label="Units">
        <div>
          <h3 className={PANEL_TITLE}>Units</h3>
          <p className="text-xs text-ink-muted">
            What search and the table show in every category. Units you hide or show in a table stay
            as you set them.
          </p>
        </div>
        <Choices<ShowPreset>
          look={look}
          legend="Show"
          hideLegend
          options={SHOW_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
          value={presetOf(rule.shown, preference)}
          onChange={(preset) => setRule((now) => withSystems(now, presetKeys(preset, preference)))}
        />
        <fieldset className="grid">
          <legend className="sr-only">Systems</legend>
          {SHOW_KEYS.map((key) => (
            <label key={key} className={OPTION_LINE}>
              <input
                type="checkbox"
                checked={rule.shown.has(key)}
                onChange={() => setRule((now) => withSystem(now, key, !now.shown.has(key)))}
                className={CHECKBOX}
              />
              {FIXED_LABEL[key]}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="grid gap-2 border-t border-line pt-3" aria-label="Display">
        <h3 className={PANEL_TITLE}>Display</h3>
        <Choices<Display['names']>
          look={look}
          legend="Unit names"
          hideLegend
          options={[
            { value: 'symbol', label: 'Symbol only' },
            { value: 'both', label: 'Symbol and name' },
          ]}
          value={display.names}
          onChange={(names) => setDisplay({ names })}
        />
        <Switch
          label="Copy buttons"
          checked={display.copy}
          onChange={(copy) => setDisplay({ copy })}
        />
        <Choices<Display['format']>
          look={look}
          legend="Format"
          options={[
            { value: 'decimal', label: 'Decimals' },
            { value: 'fraction', label: 'Fractions' },
          ]}
          value={display.format}
          onChange={(format) => setDisplay({ format })}
        />
        {display.format === 'decimal' ? (
          <Choices
            look={look}
            legend="Round to"
            options={PLACES}
            value={PLACES.find((each) => each.places === display.places)?.value ?? null}
            onChange={(value) =>
              setDisplay({ places: PLACES.find((each) => each.value === value)?.places ?? null })
            }
          />
        ) : (
          <FractionSizes
            look={look}
            chosen={display.fractions}
            onChange={(fractions) => setDisplay({ fractions })}
          />
        )}
        <Choices<Display['rounding']>
          look={look}
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
      {/*
       * Two resets (Sean, 2026-10-10): the settings, which leave the units hidden in a table, and
       * the units hidden in a table, which leave the settings.
       */}
      <div className="grid gap-1 border-t border-line pt-2">
        {/* Off with aria-disabled, which keeps focus where it was, so the panel stays open. */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            aria-disabled={!settingsChanged}
            onClick={() => {
              if (!settingsChanged) return;
              onUi((now) => ({
                ...now,
                rule: withSystems(now.rule, FRESH_RULE.shown),
                display: FRESH_DISPLAY,
              }));
            }}
            className="text-sm"
          >
            Reset settings
          </Button>
          <Button
            variant="ghost"
            aria-disabled={hiddenCount === 0}
            onClick={() => {
              if (hiddenCount > 0) setRule(withoutHidden);
            }}
            className="text-sm"
          >
            Unhide units
            {hiddenCount > 0 && <span className="font-numeric font-normal">{hiddenCount}</span>}
          </Button>
        </div>
        <p className="px-2 text-xs text-ink-muted">
          Reset settings keeps the units you hid; Unhide shows them again, in every category.
        </p>
      </div>
    </div>
  );
}

/** A grid of the converter's columns, the names giving way when its own rows have no room. */
function OwnGrid({ children }: { children: (namesHidden: boolean) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const namesHidden = useColumnsFit(ref, GIVE_WAY).includes('name');
  return (
    <div ref={ref} className={ROWS}>
      {children(namesHidden)}
    </div>
  );
}

/** The table: sections headed by system, hidden units kept at its foot, values as Display writes them. */
function ResultsTable({
  ui,
  rows,
  preference,
  locale,
  onUi,
  onTake,
}: {
  ui: Ui;
  rows: readonly TableRow[];
  preference: UnitPreference;
  locale: string | undefined;
  onUi: UpdateUi;
  onTake: (row: TableRow) => void;
}) {
  const id = useId();
  const withName = ui.display.names === 'both';
  const { copy } = ui.display;
  const isShown = (row: TableRow) => row.inBox || shows(row.unit, ui.rule, preference);
  const { editing } = ui;
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
  const checkRow = (row: TableRow, namesHidden: boolean) => {
    const on = isShown(row);
    return (
      <label
        key={row.id}
        htmlFor={`${id}-${row.id}`}
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
          check={
            <input
              id={`${id}-${row.id}`}
              type="checkbox"
              checked={on}
              disabled={row.inBox}
              onChange={() => choose([row], !on)}
              className={CHECKBOX}
            />
          }
        />
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
          {/* Done closes Hidden too: whoever just chose what to hide should not have to fold it. */}
          <Button
            variant="ghost"
            nested
            onClick={() => onUi((now) => ({ ...now, editing: false, hiddenOpen: false }))}
            className="text-sm"
          >
            Done
          </Button>
        </div>
      )}
      <OwnGrid>
        {(namesHidden) =>
          sectionsOf(rows, preference).map((section, at) => {
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
                  if (editing) return checkRow(row, namesHidden);
                  return (
                    <div key={row.id} className="col-span-6 grid grid-cols-subgrid items-center">
                      {/* Without copy buttons the row runs to the card's edge: no column is kept for them. */}
                      <button
                        type="button"
                        onClick={() => onTake(row)}
                        className={cx(
                          CURSOR_ROW,
                          'grid grid-cols-subgrid items-center',
                          copy ? 'col-span-5' : 'col-span-6',
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
                      {copy &&
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
          })
        }
      </OwnGrid>
      {!editing && (
        <div className="mt-1 flex min-h-11 items-center justify-between gap-2 border-t border-line pt-1">
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
              {/* The word and its count on one baseline, as the matches' headers; the icon centred. */}
              <span className="flex items-baseline gap-1.5">
                Hidden
                <span className="font-numeric font-normal">{hidden.length}</span>
              </span>
            </button>
          ) : (
            <span className="px-2 text-sm text-ink-muted">Every unit shown</span>
          )}
          <Button
            variant="ghost"
            nested
            onClick={() => onUi((now) => ({ ...now, editing: true }))}
            className="text-sm"
          >
            Edit
          </Button>
        </div>
      )}
      {/*
       * The Hidden list sizes its columns to its own rows, so opening it never moves the table's
       * (Sean, 2026-10-10: a checkbox and a long hidden value had widened the shared value column).
       */}
      {!editing && ui.hiddenOpen && hidden.length > 0 && (
        <OwnGrid>
          {(namesHidden) =>
            sectionsOf(hidden, preference).map((section) => (
              <div
                key={section.key}
                role="group"
                aria-label={`Hidden, ${section.label}`}
                className="col-span-6 grid grid-cols-subgrid gap-y-0.5"
              >
                {headedCheck(section.label, section.rows, 'pt-1')}
                {section.rows.map((row) => checkRow(row, namesHidden))}
              </div>
            ))
          }
        </OwnGrid>
      )}
    </div>
  );
}

/**
 * While a unit is typed: the matches that show, written as Display writes the table (symbols
 * alone with Symbol only, the name kept for screen readers); a line, and a way in, for those that
 * are hidden.
 */
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
  const withName = ui.display.names === 'both';
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
      <span className={withName ? 'truncate text-ink' : 'sr-only'}>{row.unit.plural}</span>
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
  look,
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
  look: Look;
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
  const meta = LOOKS.find((each) => each.id === look) ?? LOOKS[0]!;
  const separators = useMemo(() => localeSeparators(locale), [locale]);
  const view = useMemo(
    () =>
      selectTable(
        { ...initialState, text, unit, category },
        { locale, separators, system: preference },
      ),
    [text, unit, category, locale, separators, preference],
  );
  const close = () => onUi((now) => ({ ...now, settingsOpen: false }));

  /*
   * Settings closes on Escape, a press outside it, or focus moving outside it; never on focus
   * merely lost, as when a reset turns itself off or Reset settings takes the fraction steps away
   * (Sean, 2026-10-10: a reset that closed the panel left no way to see that it worked).
   */
  const settingsRef = useRef<HTMLDivElement>(null);
  // A layout effect, so the listeners are there before the next press (CLAUDE.md, rule 5).
  useLayoutEffect(() => {
    if (!ui.settingsOpen) return undefined;
    const outside = (target: EventTarget | null) =>
      target instanceof Node && !settingsRef.current?.contains(target);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPress = (event: PointerEvent) => {
      if (outside(event.target)) close();
    };
    const onFocus = (event: FocusEvent) => {
      if (outside(event.target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPress);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('focusin', onFocus);
    };
  });

  /**
   * A unit taken into the box is shown from then on (Sean, 2026-10-10): one taken from the hidden
   * matches leaves Hidden, as if checked there, so clearing the box never hides it again.
   */
  const take = (chosen: Unit, number: string) => {
    onUnit(chosen.id);
    onText(number);
    onUi((now) => ({
      ...now,
      rule: withChoice(now.rule, [chosen], true, preference),
      revealMatches: false,
    }));
  };

  return (
    <div className="min-w-0">
      <h2 className="font-display text-lg font-semibold">{meta.name}</h2>
      <p className="min-h-10 text-sm text-ink-muted">{meta.hint}</p>
      <div
        role="toolbar"
        aria-label={`Tools, ${meta.name}`}
        className="relative mt-2 mb-2 flex flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2"
      >
        <CategoryMenu categories={categories} value={category} onChoose={onCategory} />
        <div className="flex shrink-0 items-center gap-1">
          <div ref={settingsRef} className="contents">
            <Button
              variant="ghost"
              square
              on={ui.settingsOpen}
              aria-expanded={ui.settingsOpen}
              aria-controls={`${id}-settings`}
              aria-label="Settings"
              title="Settings"
              onClick={() => onUi((now) => ({ ...now, settingsOpen: !now.settingsOpen }))}
            >
              <SlidersIcon />
            </Button>
            {ui.settingsOpen && (
              <SettingsPanel
                look={look}
                id={`${id}-settings`}
                ui={ui}
                preference={preference}
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
        {LOOKS.map((look, index) => (
          <Converter
            key={look.id}
            look={look.id}
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
