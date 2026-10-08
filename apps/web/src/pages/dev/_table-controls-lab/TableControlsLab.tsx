import {
  categories,
  formatNumber,
  getUnit,
  localeSeparators,
  unitListGroup,
  type CategoryId,
  type UnitPreference,
  type UnitSystem,
} from '@bigsmall/core';
import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../components/Button';
import { CategoryMenu } from '../../../components/CategoryMenu';
import { ChevronDownIcon, CopyIcon } from '../../../components/icons';
import { FormattedNumber } from '../../../components/NumberText';
import { UnitChip } from '../../../components/UnitChip';
import { initialState, selectTable, type TableRow } from '../../../features/converter/state';
import { useColumnsFit } from '../../../lib/fit-step';
import {
  CARD,
  cx,
  CURSOR_ROW,
  FIELD_ROW,
  LIST_CARD,
  NO_ANSWER,
  PANEL_TITLE,
  rowFill,
  unitSymbol,
} from '../../../lib/recipes';
import { browserLocale } from '../../../lib/region';

// The lab's own controls, as the wordmark lab draws them.
const HEADING = 'font-display text-lg font-semibold';
const CHOICE = 'flex min-h-11 items-center gap-2 text-sm';
const CHECKBOX = 'size-4 accent-accent';

/** How the table's units are filtered: the four prototypes. */
type Concept = 'fold' | 'chips' | 'panel' | 'edit';
/** How a section of the table is marked. */
type Headings = 'none' | 'label' | 'divider' | 'line';
type Width = 'phone' | 'wide';

const CONCEPTS: ReadonlyArray<{ id: Concept; name: string; hint: string }> = [
  {
    id: 'fold',
    name: 'A. Fold the sections',
    hint: 'Each heading folds its section away and back. No new control.',
  },
  {
    id: 'chips',
    name: 'B. Chips over the table',
    hint: 'One toggle per section at the top of the table.',
  },
  {
    id: 'panel',
    name: 'C. A filter panel',
    hint: 'A filter button in the toolbar opens sections and single units to show or hide.',
  },
  {
    id: 'edit',
    name: 'D. Edit the list',
    hint: 'Edit swaps the copy buttons for checkboxes; hidden units leave a line at the bottom.',
  },
];

const HEADING_STYLES: ReadonlyArray<{ id: Headings; name: string }> = [
  { id: 'none', name: 'None' },
  { id: 'label', name: 'Labels' },
  { id: 'divider', name: 'Labels with a line' },
  { id: 'line', name: 'A line only' },
];

const REGIONS: ReadonlyArray<{ id: UnitPreference; name: string }> = [
  { id: 'us', name: 'US' },
  { id: 'imperial', name: 'UK' },
  { id: 'metric', name: 'Metric' },
];

const SPECIALIST_LABELS = ['Specialist', 'Less common', 'More units'] as const;

/** A sample for each category, so switching shows values at once. */
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

/** The converter's table columns: value, spare width, symbol, its exponent, name, and a last cell. */
const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';
const GIVE_WAY = ['name'] as const;
const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;
/** A region's mark on a symbol, which a heading naming the region makes redundant. */
const REGION_MARK = / \((?:US|UK)\)$/;

const TONE: Record<TableRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

interface Section {
  key: string;
  /** The heading, or null for a category's everyday units where it has no regional system. */
  label: string | null;
  rows: TableRow[];
}

const OWN_LABEL: Record<UnitPreference, string> = {
  us: 'US customary',
  imperial: 'Imperial',
  metric: 'Metric',
};
const REGIONAL: ReadonlySet<UnitSystem> = new Set(['us', 'imperial', 'uk']);

function neitherLabel(systems: ReadonlySet<UnitSystem>): string {
  const only = (system: UnitSystem) => [...systems].every((each) => each === system);
  if (only('uk')) return 'UK imperial';
  if (only('us')) return 'US customary';
  return 'Other';
}

/**
 * The table's rows in sections, from core's groups (`unitListGroup`): the visitor's everyday units,
 * the other main system's, those of neither, then the specialist units. A category with no regional
 * system (time, data, angle) lists its everyday units together, without a heading.
 */
function sectionsOf(
  rows: readonly TableRow[],
  system: UnitPreference,
  specialist: string,
): Section[] {
  const regional = rows.some((row) => REGIONAL.has(row.unit.system));
  const sections = new Map<string, Section>();
  for (const row of rows) {
    const group = unitListGroup(row.unit, system);
    const key = group === 'specialist' || regional ? group : 'everyday';
    const section = sections.get(key) ?? { key, label: null, rows: [] };
    section.rows.push(row);
    sections.set(key, section);
  }
  for (const section of sections.values()) {
    const systems = new Set(section.rows.map((row) => row.unit.system));
    if (section.key === 'specialist') section.label = specialist;
    else if (section.key === 'own') section.label = OWN_LABEL[system];
    else if (section.key === 'other')
      section.label = system === 'metric' ? 'Imperial and US customary' : 'Metric';
    else if (section.key === 'neither') section.label = neitherLabel(systems);
  }
  return [...sections.values()];
}

/** The symbols a section shows: without "(US)" or "(UK)" when its heading names the region and no two would then read alike. */
function sectionSymbols(section: Section, shorten: boolean): Map<string, string> {
  const short = section.rows.map((row) => row.symbol.replace(REGION_MARK, ''));
  const unique = new Set(short).size === short.length;
  return new Map(
    section.rows.map((row, at) => [row.id, shorten && unique ? short[at]! : row.symbol]),
  );
}

function FilterIcon() {
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
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={cx(CARD, 'grid min-w-0 content-start gap-2 p-5')}>
      <legend className={cx('px-1', HEADING)}>{title}</legend>
      {children}
    </fieldset>
  );
}

function Radios<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<{ id: T; name: string; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid">
      {options.map((option) => (
        <label key={option.id} className={cx(CHOICE, 'items-start py-2')}>
          <input
            type="radio"
            name={name}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            className={cx(CHECKBOX, 'mt-0.5')}
          />
          <span>
            {option.name}
            {option.hint && <span className="block text-xs text-ink-muted">{option.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** A row's value, symbol, exponent, and name, in the converter's columns. */
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

/**
 * Prototypes for filtering the table and naming its sections (Sean, 2026-10-08; docs/research/
 * table-controls.md). Built from the real engine, table view, menu, and chip, with the table's
 * columns and its names giving way, but holding its own simple state: no undo, no URL, no keys.
 */
export function TableControlsLab() {
  const id = useId();
  const [concept, setConcept] = useState<Concept>('fold');
  const [headings, setHeadings] = useState<Headings>('label');
  const [shorten, setShorten] = useState(true);
  const [specialist, setSpecialist] = useState<string>(SPECIALIST_LABELS[0]);
  const [system, setSystem] = useState<UnitPreference>('us');
  const [width, setWidth] = useState<Width>('phone');
  const [category, setCategory] = useState<CategoryId>('volume');
  const [unit, setUnit] = useState<string | null>(SAMPLES.volume?.unit ?? null);
  const [text, setText] = useState(SAMPLES.volume?.text ?? '');
  const [hiddenSections, setHiddenSections] = useState<ReadonlySet<string>>(new Set());
  const [hiddenUnits, setHiddenUnits] = useState<ReadonlySet<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const namesHidden = useColumnsFit(gridRef, GIVE_WAY).includes('name');

  const locale = browserLocale();
  const view = useMemo(() => {
    const env = { locale, separators: localeSeparators(locale), system };
    const state = { ...initialState, text, unit, category };
    const shown = selectTable(state, env);
    // A letter in the box would turn the table into matches; the lab keeps to numbers.
    return shown.kind === 'units' ? shown : selectTable({ ...state, text: '' }, env);
  }, [locale, system, text, unit, category]);
  const rows = view.kind === 'units' ? view.rows : [];
  const sections = sectionsOf(rows, system, specialist);
  const chipUnit = unit ? getUnit(unit) : undefined;

  // Folding and the chips need a name for each section; a line alone has none.
  const named =
    concept === 'fold' || concept === 'chips' || headings === 'label' || headings === 'divider';
  const labelLook = headings === 'divider' ? 'divider' : 'label';

  const toggle = (set: ReadonlySet<string>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };
  const showsRow = (section: Section, row: TableRow) =>
    row.inBox || (!hiddenSections.has(section.key) && !hiddenUnits.has(row.id));
  const hiddenCount = rows.filter(
    (row) => !sections.some((section) => section.rows.includes(row) && showsRow(section, row)),
  ).length;

  const choose = (next: CategoryId) => {
    setCategory(next);
    setUnit(SAMPLES[next]?.unit ?? null);
    setText(SAMPLES[next]?.text ?? '');
    setHiddenSections(new Set());
    setHiddenUnits(new Set());
  };
  const take = (row: TableRow) => {
    if (row.inBox || row.tone === 'message') return;
    setText(row.value === null ? text : formatNumber(row.value, { precision: 10, locale }));
    setUnit(row.id);
  };
  const startOver = () => {
    choose(category);
    setEditing(false);
    setPanelOpen(false);
  };

  const heading = (section: Section, first: boolean) => {
    const label = section.label ?? 'Everyday';
    const folded = hiddenSections.has(section.key);
    const edge =
      !first && (headings === 'divider' || headings === 'line')
        ? 'mt-1 border-t border-line pt-2'
        : '';
    if (concept === 'fold' && section.label) {
      return (
        <h3 className={cx('col-span-6', edge, !first && !edge && 'pt-2')}>
          <button
            type="button"
            aria-expanded={!folded}
            onClick={() => setHiddenSections(toggle(hiddenSections, section.key))}
            className={cx(
              PANEL_TITLE,
              'flex min-h-11 w-full items-center gap-2 rounded-nested px-2 text-left hover:bg-surface-raised',
            )}
          >
            <ChevronDownIcon
              width="16"
              height="16"
              className={cx('shrink-0 transition-transform', folded && '-rotate-90')}
            />
            {label}
            {folded && <span className="font-numeric font-normal">{section.rows.length}</span>}
          </button>
        </h3>
      );
    }
    if (named && section.label && headings !== 'none' && headings !== 'line') {
      return (
        <h3
          className={cx(
            'col-span-6 px-2 pb-1',
            PANEL_TITLE,
            labelLook === 'divider' && !first
              ? 'mt-1 border-t border-line pt-3'
              : first
                ? 'pt-1'
                : 'pt-4',
          )}
        >
          {label}
        </h3>
      );
    }
    if (!first && (headings === 'line' || headings === 'divider')) {
      return <div aria-hidden="true" className="col-span-6 my-1 border-t border-line" />;
    }
    return null;
  };

  const table = (
    <div className={cx(LIST_CARD, 'p-2')}>
      {concept === 'chips' && (
        <div role="group" aria-label="Sections to show" className="flex flex-wrap gap-1 pb-2">
          {sections.map((section) => {
            const shown = !hiddenSections.has(section.key);
            return (
              <Button
                key={section.key}
                variant="secondary"
                nested
                on={shown}
                aria-pressed={shown}
                onClick={() => setHiddenSections(toggle(hiddenSections, section.key))}
                className="text-sm"
              >
                {section.label ?? 'Everyday'}
              </Button>
            );
          })}
        </div>
      )}
      {concept === 'edit' && (
        <div className="flex items-center justify-between gap-2 pb-1 pl-2">
          <span className={PANEL_TITLE}>{editing ? 'Choose the units to show' : ''}</span>
          <Button variant="ghost" nested onClick={() => setEditing(!editing)} className="text-sm">
            {editing ? 'Done' : 'Edit'}
          </Button>
        </div>
      )}
      <div ref={gridRef} className={ROWS}>
        {sections.map((section, at) => {
          const symbols = sectionSymbols(section, shorten && named && headings !== 'line');
          return (
            <div
              key={section.key}
              role="group"
              aria-label={section.label ?? 'Everyday'}
              className="col-span-6 grid grid-cols-subgrid gap-y-0.5"
            >
              {heading(section, at === 0)}
              {section.rows.map((row) => {
                const shown = showsRow(section, row);
                const symbol = symbols.get(row.id) ?? row.symbol;
                if (concept === 'edit' && editing) {
                  return (
                    <label
                      key={row.id}
                      className={cx(
                        CURSOR_ROW,
                        'col-span-6 grid grid-cols-subgrid items-center',
                        rowFill(row.inBox, false),
                        !shown && 'opacity-50',
                      )}
                    >
                      <RowCells row={row} symbol={symbol} namesHidden={namesHidden} />
                      <span className="grid size-11 place-items-center">
                        <input
                          type="checkbox"
                          checked={shown}
                          disabled={row.inBox}
                          onChange={() => setHiddenUnits(toggle(hiddenUnits, row.id))}
                          className={CHECKBOX}
                        />
                      </span>
                    </label>
                  );
                }
                if (!shown) return null;
                return (
                  <div key={row.id} className="col-span-6 grid grid-cols-subgrid items-center">
                    <button
                      type="button"
                      onClick={() => take(row)}
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
      {concept === 'edit' && !editing && hiddenCount > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-line pt-1 pl-2 text-sm text-ink-muted">
          <span>
            <span className="font-numeric">{hiddenCount}</span> hidden
          </span>
          <Button variant="ghost" nested onClick={() => setEditing(true)} className="text-sm">
            Show
          </Button>
        </div>
      )}
    </div>
  );

  const panel = (
    <div className={cx(CARD, 'my-4 grid gap-3 p-4')}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={PANEL_TITLE}>Show</h3>
        <Button
          variant="ghost"
          onClick={() => {
            setHiddenSections(new Set());
            setHiddenUnits(new Set());
          }}
          className="text-sm"
        >
          Show all
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-4">
        {sections.map((section) => (
          <label key={section.key} className={CHOICE}>
            <input
              type="checkbox"
              checked={!hiddenSections.has(section.key)}
              onChange={() => setHiddenSections(toggle(hiddenSections, section.key))}
              className={CHECKBOX}
            />
            {section.label ?? 'Everyday'}
          </label>
        ))}
      </div>
      <h3 className={PANEL_TITLE}>Units</h3>
      <div className="grid grid-cols-2 gap-x-4">
        {rows.map((row) => (
          <label key={row.id} className={cx(CHOICE, 'min-w-0')}>
            <input
              type="checkbox"
              checked={!hiddenUnits.has(row.id)}
              disabled={row.inBox}
              onChange={() => setHiddenUnits(toggle(hiddenUnits, row.id))}
              className={CHECKBOX}
            />
            <span className="truncate">
              <span className={unitSymbol()}>{row.symbol}</span> {row.unit.plural}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
      <div className="grid content-start gap-6 lg:w-88">
        <Panel title="Filter">
          <Radios
            name={`${id}-concept`}
            options={CONCEPTS}
            value={concept}
            onChange={(next) => {
              // Each prototype starts with every unit shown, so they compare from the same place.
              setConcept(next);
              setHiddenSections(new Set());
              setHiddenUnits(new Set());
              setEditing(false);
              setPanelOpen(false);
            }}
          />
        </Panel>
        <Panel title="Section headings">
          <Radios
            name={`${id}-headings`}
            options={HEADING_STYLES}
            value={headings}
            onChange={setHeadings}
          />
          <label className={CHOICE}>
            <input
              type="checkbox"
              checked={shorten}
              onChange={(event) => setShorten(event.currentTarget.checked)}
              className={CHECKBOX}
            />
            Drop “(US)” and “(UK)” under a heading that names them
          </label>
          <label className="grid gap-1 text-sm">
            The last section is called
            <select
              value={specialist}
              onChange={(event) => setSpecialist(event.currentTarget.value)}
              className="min-h-11 rounded-md border-2 border-edge bg-surface px-3 text-ink"
            >
              {SPECIALIST_LABELS.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
        </Panel>
        <Panel title="Visitor and screen">
          <p className="text-sm text-ink-muted">Region</p>
          <div className="flex flex-wrap gap-x-4">
            {REGIONS.map((region) => (
              <label key={region.id} className={CHOICE}>
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
          <p className="text-sm text-ink-muted">Width</p>
          <div className="flex flex-wrap gap-x-4">
            {(['phone', 'wide'] as const).map((each) => (
              <label key={each} className={CHOICE}>
                <input
                  type="radio"
                  name={`${id}-width`}
                  checked={width === each}
                  onChange={() => setWidth(each)}
                  className={CHECKBOX}
                />
                {each === 'phone' ? 'Phone (iPhone 13)' : 'Wide'}
              </label>
            ))}
          </div>
          <div>
            <Button variant="secondary" onClick={startOver}>
              Start over
            </Button>
          </div>
        </Panel>
      </div>

      <div className={cx('w-full min-w-0', width === 'phone' ? 'max-w-90' : 'max-w-xl')}>
        <div className="mb-2 flex flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2">
          <CategoryMenu categories={categories} value={category} onChoose={choose} />
          {concept === 'panel' && (
            <Button
              variant="ghost"
              square
              on={panelOpen}
              aria-expanded={panelOpen}
              aria-label="Filter units"
              onClick={() => setPanelOpen(!panelOpen)}
            >
              <FilterIcon />
            </Button>
          )}
        </div>
        <div className={cx(LIST_CARD, FIELD_ROW)}>
          <label htmlFor={`${id}-number`} className="sr-only">
            Number
          </label>
          <input
            id={`${id}-number`}
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            className="min-w-0 flex-1 bg-transparent font-numeric text-3xl text-ink"
          />
          {chipUnit && (
            <UnitChip
              unit={chipUnit}
              compact={false}
              onOpen={() => undefined}
              onRemove={() => setUnit(null)}
            />
          )}
        </div>
        {concept === 'panel' && panelOpen && panel}
        <div className={cx(concept === 'panel' && panelOpen ? '' : 'mt-2')}>{table}</div>
      </div>
    </div>
  );
}
