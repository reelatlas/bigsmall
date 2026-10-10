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
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EraserIcon,
  RedoIcon,
  UndoIcon,
} from '../../../components/icons';
import { SegmentedControl, SegmentedToggles } from '../../../components/SegmentedControl';
import { Switch } from '../../../components/Switch';
import { ToolbarDivider } from '../../../components/ToolbarDivider';
import {
  initialState,
  selectTable,
  type MatchesView,
  type TableRow,
} from '../../../features/converter/state';
import { useCopied } from '../../../lib/copied';
import { useColumnsFit } from '../../../lib/fit-step';
import {
  CARD,
  cx,
  CURSOR_ROW,
  LIST_CARD,
  OPTION_ROW,
  PANEL_TITLE,
  rowFill,
  unitSymbol,
} from '../../../lib/recipes';
import { browserLocale } from '../../../lib/region';
import {
  displayChanged,
  displayValue,
  fractionsOf,
  fractionValue,
  FRESH_DISPLAY,
  SIZE_NAME,
  SIZES,
  type Display,
  type Size,
} from './display';
import { BoxField, CHECKBOX, ColumnSizer, GIVE_WAY, RowCells, ROWS, writtenValue } from './parts';
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
 * the action bar, with single units chosen in the table (Separate) and Settings' choices drawn as
 * segmented controls (both Sean's choices). A Settings button shapes what shows (the units, in
 * every category) and how it looks (names, copy buttons, decimals, fractions, or both, and
 * rounding); the table heads its sections by system and keeps what is hidden in a Hidden list at
 * its foot; search leaves hidden units out and says when one matches. Built from the real engine,
 * table view, menu, chip, and toolbar parts, with state of its own: no undo, no URL, no arrow keys.
 */

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

const OPTION_LINE = cx(OPTION_ROW, 'gap-2');
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

/** One choice of a few, a segmented control under its legend. */
function Choices<T extends string | number>({
  legend,
  options,
  value,
  disabled = false,
  hideLegend = false,
  onChange,
}: {
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
      <SegmentedControl name={name} options={options} value={value} onChange={onChange} />
    </fieldset>
  );
}

const ROUNDINGS: readonly Display['rounding'][] = ['nearest', 'up', 'down'];

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

/**
 * The two strips of sizes, from the least fine to the finest as the places run (Sean,
 * 2026-10-10: people break a measure down that way): halves to eighths, then sixteenths to
 * sixty-fourths.
 */
const SIZE_ROWS: ReadonlyArray<readonly Size[]> = [SIZES.slice(0, 4), SIZES.slice(4)];

/**
 * Fractions in the sizes chosen, each on or off by itself (Sean, 2026-10-10): what is chosen is
 * what shows, a fraction written in the smallest size chosen that writes it (1/4 alone writes a
 * half as 2/4; with 1/2 as well, 1/2). The line under them says what they write.
 */
function FractionSizes({
  legend,
  chosen,
  onChange,
}: {
  legend: string;
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
      <legend className={SUBHEAD}>{legend}</legend>
      {SIZE_ROWS.map((sizes) => (
        <SegmentedToggles<Size>
          key={sizes.join()}
          options={sizes.map((size) => ({
            value: size,
            label: (
              <>
                <span className="font-numeric">1/{size}</span>
                <span className="sr-only">, {SIZE_NAME[size]}</span>
              </>
            ),
          }))}
          checked={(size) => chosen.has(size)}
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
  id,
  ui,
  preference,
  onUi,
}: {
  id: string;
  ui: Ui;
  preference: UnitPreference;
  onUi: UpdateUi;
}) {
  const { rule, display } = ui;
  const hiddenCount = hiddenByHand(rule);
  const settingsChanged = switchesChanged(rule) || displayChanged(display);
  // A reset done shows a check after its label that draws itself in, in the success color, at
  // full strength while it shows; then the button settles to its off look (Sean, 2026-10-10).
  // useCopied times it as it does a copy's check, and the status line says it.
  const { copied: done, markCopied, pointerProps } = useCopied<'reset' | 'unhide'>();
  const doneCheck = <CheckIcon width="16" height="16" className="check-draw text-success" />;
  const setRule = (next: (rule: ViewRule) => ViewRule) =>
    onUi((now) => ({ ...now, rule: next(now.rule) }));
  const setDisplay = (patch: Partial<Display>) =>
    onUi((now) => ({ ...now, display: { ...now.display, ...patch } }));
  const both = display.format === 'both';

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Settings"
      onPointerDown={(event) => event.preventDefault()}
      className={cx(
        CARD,
        'absolute inset-x-0 top-full z-20 mt-1 grid max-h-120 gap-3 overflow-y-auto p-3 shadow-md sm:right-auto sm:w-80',
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
          legend="Format"
          options={[
            { value: 'decimal', label: 'Decimals' },
            { value: 'fraction', label: 'Fractions' },
            { value: 'both', label: 'Both' },
          ]}
          value={display.format}
          onChange={(format) => setDisplay({ format })}
        />
        {/* Decimals first, then fractions, as Format lists them (Sean, 2026-10-10). */}
        {display.format !== 'fraction' && (
          <Choices
            legend={both ? 'Round decimals to' : 'Round to'}
            options={PLACES}
            value={PLACES.find((each) => each.places === display.places)?.value ?? null}
            onChange={(value) =>
              setDisplay({ places: PLACES.find((each) => each.value === value)?.places ?? null })
            }
          />
        )}
        {display.format !== 'decimal' && (
          <FractionSizes
            legend={both ? 'Round fractions to' : 'Round to'}
            chosen={display.fractions}
            onChange={(fractions) => setDisplay({ fractions })}
          />
        )}
        <Choices<Display['rounding']>
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
            aria-disabled={!settingsChanged && done !== 'reset'}
            onClick={() => {
              if (!settingsChanged) return;
              onUi((now) => ({
                ...now,
                rule: withSystems(now.rule, FRESH_RULE.shown),
                display: FRESH_DISPLAY,
              }));
              markCopied('reset');
            }}
            {...pointerProps('reset')}
            className="text-sm"
          >
            Reset settings
            {done === 'reset' && doneCheck}
          </Button>
          <Button
            variant="ghost"
            aria-disabled={hiddenCount === 0 && done !== 'unhide'}
            onClick={() => {
              if (hiddenCount === 0) return;
              setRule(withoutHidden);
              markCopied('unhide');
            }}
            {...pointerProps('unhide')}
            className="text-sm"
          >
            Unhide units
            {hiddenCount > 0 && <span className="font-numeric font-normal">{hiddenCount}</span>}
            {done === 'unhide' && doneCheck}
          </Button>
        </div>
        <p className="px-2 text-xs text-ink-muted">
          Reset settings keeps the units you hid; Unhide shows them again, in every category.
        </p>
        <p role="status" className="sr-only">
          {done === 'reset' ? 'Settings reset' : done === 'unhide' ? 'Units unhidden' : ''}
        </p>
      </div>
    </div>
  );
}

/**
 * The table: sections headed by system, values as Display writes them, the hidden units listed at
 * its foot. A sizer holds every column at the widest it could hold, so nothing moves as presets,
 * switches, Hidden, or units hidden change what shows (Sean, 2026-10-10).
 */
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
  const gridRef = useRef<HTMLDivElement>(null);
  const fitted = useColumnsFit(gridRef, GIVE_WAY);
  const namesHidden = fitted.includes('name');
  const secondHidden = fitted.includes('second');
  const { display, editing } = ui;
  const withName = display.names === 'both';
  const isShown = (row: TableRow) => row.inBox || shows(row.unit, ui.rule, preference);
  const hidden = rows.filter((row) => !isShown(row));

  /** The value as Display writes it first (the decimal with Both), and Both's fraction after it. */
  const firstOf = (row: TableRow, under: Display = display) =>
    writtenValue(row, row.tone === 'value' ? displayValue(row.value, under, locale) : null);
  const secondOf = (row: TableRow, under: Display = display): ReactNode => {
    if (under.format !== 'both' || row.tone !== 'value') return null;
    const fraction = fractionValue(row.value, under, locale);
    return fraction ? writtenValue(row, fraction) : null;
  };
  /*
   * The sizer measures each value under every rounding, so choosing Up, Down, or Nearest never
   * moves the columns (Sean, 2026-10-10); a change of format or places, which rewrites the values,
   * may.
   */
  const everyRounding =
    (cell: (row: TableRow, under?: Display) => ReactNode) =>
    (row: TableRow): ReactNode =>
      ROUNDINGS.map((rounding) => (
        <span key={rounding} className="block">
          {cell(row, { ...display, rounding })}
        </span>
      ));
  const cells = (row: TableRow, muted = false, check?: ReactNode) => (
    <RowCells
      row={row}
      value={firstOf(row)}
      second={display.format === 'both' ? secondOf(row) : null}
      namesHidden={namesHidden}
      secondHidden={secondHidden}
      withName={withName}
      muted={muted}
      check={check}
    />
  );

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

  const checkbox = (row: TableRow, on: boolean) => (
    <input
      id={`${id}-${row.id}`}
      type="checkbox"
      checked={on}
      disabled={row.inBox}
      onChange={() => choose([row], !on)}
      className={CHECKBOX}
    />
  );

  /** A row that is a checkbox, in Edit. */
  const checkRow = (row: TableRow) => {
    const on = isShown(row);
    return (
      <label
        key={row.id}
        htmlFor={`${id}-${row.id}`}
        className={cx(
          CURSOR_ROW,
          'col-span-7 grid grid-cols-subgrid items-center',
          rowFill(row.inBox, false),
        )}
      >
        {cells(row, !on, checkbox(row, on))}
      </label>
    );
  };

  const headedCheck = (label: string, group: readonly TableRow[], edge: string) => {
    const state = groupState(group, isShown);
    return (
      <h4 className={edge}>
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
              className="col-span-7 grid grid-cols-subgrid gap-y-0.5"
            >
              {editing ? (
                <div className="col-span-7">{headedCheck(section.label, section.rows, edge)}</div>
              ) : (
                <h4 className={cx('col-span-7 px-2 pb-1', PANEL_TITLE, edge)}>{section.label}</h4>
              )}
              {listed.map((row) => {
                if (editing) return checkRow(row);
                return (
                  <div key={row.id} className="col-span-7 grid grid-cols-subgrid items-center">
                    {/* Without copy buttons the row runs to the card's edge: no column is kept for them. */}
                    <button
                      type="button"
                      onClick={() => onTake(row)}
                      className={cx(
                        CURSOR_ROW,
                        'grid grid-cols-subgrid items-center',
                        display.copy ? 'col-span-6' : 'col-span-7',
                        rowFill(row.inBox, false),
                      )}
                    >
                      {cells(row)}
                    </button>
                    {display.copy &&
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
        <ColumnSizer
          rows={rows}
          value={everyRounding(firstOf)}
          second={display.format === 'both' ? everyRounding(secondOf) : null}
          namesHidden={namesHidden}
          secondHidden={secondHidden}
          withName={withName}
        />
      </div>
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
       * The Hidden list names its units, without values (Sean, 2026-10-10): it is for bringing
       * them back, and needs none of the table's columns, so opening it moves nothing.
       */}
      {!editing &&
        ui.hiddenOpen &&
        sectionsOf(hidden, preference).map((section) => (
          <div key={section.key} role="group" aria-label={`Hidden, ${section.label}`}>
            {headedCheck(section.label, section.rows, 'pt-1')}
            {section.rows.map((row) => (
              <label
                key={row.id}
                htmlFor={`${id}-${row.id}`}
                className={cx(CURSOR_ROW, 'flex items-center gap-2 pl-8 hover:bg-surface-raised')}
              >
                {checkbox(row, false)}
                <span className={unitSymbol()}>{row.symbol}</span>
                <span className={withName ? 'truncate text-ink' : 'sr-only'}>{row.name}</span>
              </label>
            ))}
          </div>
        ))}
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

/** The converter: its action bar, the box, and the table or the matches. */
function Converter({
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
   * merely lost, as when a reset turns itself off or Reset settings takes the fraction sizes away
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
      {/*
       * The action bar (Sean, 2026-10-10): the category menu, the calculator, and Settings lead,
       * with no dividers between them; undo, redo, and clear all keep the right end. Where the two
       * do not fit on one line, the leading group wraps to the line over the box, as the
       * converter's toolbar does, and the others stay at the right.
       */}
      <div
        role="toolbar"
        aria-label="Tools"
        className="relative mb-2 flex flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2"
      >
        <div className="flex items-center gap-1">
          <CategoryMenu categories={categories} value={category} onChoose={onCategory} />
          <Button variant="ghost" square aria-label="Calculator" aria-disabled title="Calculator">
            <CalculatorIcon />
          </Button>
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
              <SettingsPanel id={`${id}-settings`} ui={ui} preference={preference} onUi={onUi} />
            )}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
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
      <BoxField
        text={text}
        unit={unit}
        symbolOnly={ui.display.names === 'symbol'}
        value={ui.display.copy ? parse(text, separators).value : undefined}
        onText={onText}
        onRemove={() => onUnit(null)}
      />
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
  const [ui, setUi] = useState<Ui>(freshUi);
  const locale = browserLocale();

  const choose = (next: CategoryId) => {
    setCategory(next);
    setUnit(SAMPLES[next]?.unit ?? null);
    setText(SAMPLES[next]?.text ?? '');
    setUi(closed);
  };
  const startOver = () => {
    setUi(freshUi());
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
      <div className="max-w-xl min-w-0">
        <Converter
          preference={system}
          locale={locale}
          category={category}
          text={text}
          unit={unit}
          ui={ui}
          onCategory={choose}
          onText={setText}
          onUnit={setUnit}
          onUi={setUi}
        />
      </div>
    </div>
  );
}
