import {
  formatFraction,
  formatPlaces,
  type FractionSize,
  type Rounded,
  type Rounding,
} from '@bigsmall/core';
import { useId, useLayoutEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useColumnsFit } from '../lib/fit-step';
import {
  CURSOR_ROW,
  cx,
  LIST_CARD,
  NO_ANSWER,
  PANEL_TITLE,
  rowFill,
  unitSymbol,
} from '../lib/recipes';
import { Button } from './Button';
import { ChevronDownIcon, CopiedIcon, CopyIcon } from './icons';
import { FormattedNumber } from './NumberText';

/** One row as the table shows it; the converter maps its view onto these. */
export interface ConversionRow {
  /** The unit's id: the row's key, and what copying and moving name. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  /** The value at six significant digits, "Too large" or "Too small", or a dash. */
  text: string;
  /** The value at full precision, which the display writes to its places or fractions; null without one. */
  value: number | null;
  symbol: string;
  /**
   * What the text is: a value; a dash, while there is no number or no unit to convert from; or a
   * message, in the danger color. Only a value has a copy button.
   */
  tone: 'value' | 'empty' | 'message';
  /** The unit in the box: marked in the accent's soft fill. */
  inBox: boolean;
}

/** A section of rows under its name ("US (customary)"). */
export interface RowSection<T extends ConversionRow> {
  key: string;
  label: string;
  rows: readonly T[];
}

/** How values and names show (docs/UX-SPEC.md §7): the converter's Display settings. */
export interface TableDisplay {
  names: 'symbol' | 'both';
  copy: boolean;
  /** Both writes the decimal, then its fraction after it in the muted ink. */
  format: 'decimal' | 'fraction' | 'both';
  /** Decimal places, or null for the six significant digits. */
  places: number | null;
  fractions: ReadonlySet<FractionSize>;
  rounding: Rounding;
}

export interface ConversionTableProps<T extends ConversionRow> {
  /** The grid's id, which the field's combobox controls. */
  id: string;
  /**
   * Names the table for screen readers: the category, "Volume". On screen the category menu over
   * the box names it (docs/UX-SPEC.md §1).
   */
  title: string;
  /** The rows that show, in their sections; the cursor counts through them in this order. */
  sections: readonly RowSection<T>[];
  /** The rows the settings hide, in their sections, for the Hidden list at the foot. */
  hidden: readonly RowSection<T>[];
  /** Every row in its section, shown or hidden: Edit's list. */
  every: readonly RowSection<T>[];
  /** In place of the rows when the value has no answer: "Too large to convert". */
  message: string | null;
  display: TableDisplay;
  locale: string | undefined;
  /** The row the field's cursor is on, by index into the shown rows, or -1. */
  cursor: number;
  /** The id of a row's unit cell, which the field points at while the cursor is on it. */
  itemId: (index: number) => string;
  /** The row whose copy button shows the check, by id. */
  copied: string | null;
  /** A row was clicked or tapped, by index. */
  onPick: (index: number) => void;
  onCopy: (row: T) => void;
  /** More props for a row's copy button: the copy hook's pointer handlers. */
  copyProps?: (
    row: T,
  ) => Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onPointerEnter' | 'onPointerLeave'>;
  /** Edit: the table is a checklist of every unit. */
  editing: boolean;
  hiddenOpen: boolean;
  /** Whether a row shows, for Edit's and the Hidden list's checkboxes. */
  isShown: (row: T) => boolean;
  /** Rows shown or hidden on their own, from Edit or the Hidden list. */
  onChoose: (rows: readonly T[], show: boolean) => void;
  onEditing: (editing: boolean) => void;
  onHiddenOpen: (open: boolean) => void;
}

/**
 * A row reads "250 … mL milliliters": the value on the left, right-aligned in equal-width digits so
 * values line up at their last digit; with Both, its fraction beside it; past a column that takes
 * the spare width, on the right, the symbol right-aligned in its column, an exponent hanging after
 * it in a narrow column of its own (so "ha" ends where the "m" of "m²" does), and the name
 * left-aligned in its own; then the copy button, with copy buttons on. The names keep to one line:
 * where one would not fit beside its value (a long value on a phone), the names give way in every
 * row (GIVE_WAY), then Both's fraction. The unit's cell has no column gap, since the symbol and its
 * exponent touch: its parts space themselves (pr-2, pl-2). Seven columns, so a row spans
 * col-span-7.
 */
const ROWS =
  'grid grid-cols-[auto_minmax(0,max-content)_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';

/** The columns that give way when a row has no room for them, in that order (useColumnsFit). */
const GIVE_WAY = ['name', 'second'] as const;

/** A symbol's trailing exponent, set in a column of its own: "km²" is "km" and "²". */
const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;

function splitExponent(symbol: string): [base: string, exponent: string] {
  const exponent = EXPONENT.exec(symbol)?.[0] ?? '';
  return [symbol.slice(0, symbol.length - exponent.length), exponent];
}

/** The value's look, by what it is: a value, a dash, or a message. */
const TONE: Record<ConversionRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

const VALUE_CELL = 'pr-2 font-numeric whitespace-nowrap';
const SECOND_CELL = 'min-w-0 overflow-hidden pr-2 pl-3 text-right font-numeric whitespace-nowrap';
const SYMBOL_CELL = cx('col-start-4 pl-2 text-right whitespace-nowrap', unitSymbol());
const NAME_CELL = 'min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap';
const HEADING = cx(PANEL_TITLE, 'px-2 pb-1');
const CHECKBOX = 'size-4 accent-accent';
const ROUNDINGS: readonly Rounding[] = ['nearest', 'up', 'down'];

/** The edge over a section: none over the first, a line over the rest. */
function sectionEdge(at: number): string {
  return at === 0 ? 'pt-1' : 'mt-1 border-t border-line pt-2';
}

/** A value as the display writes it first: its fraction with Fractions, else its decimal. */
function firstWritten(value: number, display: TableDisplay, locale: string | undefined) {
  if (display.format === 'fraction') {
    return formatFraction(value, { sizes: display.fractions, rounding: display.rounding, locale });
  }
  return display.places === null
    ? null
    : formatPlaces(value, { places: display.places, rounding: display.rounding, locale });
}

/** Both's fraction, after the decimal. */
function secondWritten(value: number, display: TableDisplay, locale: string | undefined) {
  if (display.format !== 'both') return null;
  return formatFraction(value, { sizes: display.fractions, rounding: display.rounding, locale });
}

/** A value as written, "≈" ahead of one that rounds; the row's own text where nothing is. */
function writtenText(row: ConversionRow, written: Rounded | null): ReactNode {
  if (written) {
    return (
      <>
        {written.approx && <span className="text-ink-muted">≈ </span>}
        {written.text}
      </>
    );
  }
  return row.tone === 'value' ? <FormattedNumber text={row.text} /> : row.text;
}

/** A checkbox for a section: checked for all its units, a dash for some, clear for none. */
function SectionCheckbox({
  state,
  onChange,
}: {
  state: 'all' | 'some' | 'none';
  onChange: () => void;
}) {
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

/**
 * The table's units (docs/UX-SPEC.md §1, §3): those the settings show, in their sections, each
 * headed; those they hide in a Hidden list at the foot, under their sections' names; and Edit,
 * which makes the table a checklist of every unit. The field keeps focus and its cursor moves
 * through the shown rows (aria-activedescendant on a grid, ADR 0012), so the rows are no Tab
 * stops; a click or tap on one is the field's to act on, and focus stays in the field. With copy
 * buttons on, each row's sits in a cell of its own beside it, out of the Tab order like the box's
 * own. Columns line up across rows through a subgrid (ROWS), each as wide as the widest it could
 * hold across every row and every rounding (a sizer row no one sees), so a setting that changes
 * what shows never moves the rest. Screen readers hear the symbol whole ("km²") and the name,
 * shown or not, from copies of their own; the columns they are drawn in are hidden from them.
 */
export function ConversionTable<T extends ConversionRow>({
  id,
  title,
  sections,
  hidden,
  every,
  message,
  display,
  locale,
  cursor,
  itemId,
  copied,
  onPick,
  onCopy,
  copyProps,
  editing,
  hiddenOpen,
  isShown,
  onChoose,
  onEditing,
  onHiddenOpen,
}: ConversionTableProps<T>) {
  const titleId = useId();
  const moveHintId = useId();
  const checkId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const fitted = useColumnsFit(gridRef, GIVE_WAY);
  const namesHidden = fitted.includes('name');
  const secondHidden = fitted.includes('second');
  const withNames = display.names === 'both';
  const both = display.format === 'both';
  const hiddenCount = hidden.reduce((sum, section) => sum + section.rows.length, 0);
  const allRows = every.flatMap((section) => section.rows);

  const first = (row: T, under: TableDisplay = display) =>
    writtenText(
      row,
      row.tone === 'value' && row.value !== null ? firstWritten(row.value, under, locale) : null,
    );
  const second = (row: T, under: TableDisplay = display): ReactNode => {
    if (row.tone !== 'value' || row.value === null) return null;
    const fraction = secondWritten(row.value, under, locale);
    return fraction ? writtenText(row, fraction) : null;
  };

  /** A row's drawn cells: value, Both's fraction, symbol, exponent, and name. */
  const cells = (row: T, muted = false, check?: ReactNode) => {
    const [base, exponent] = splitExponent(row.symbol);
    const fraction = both ? second(row) : null;
    return (
      <>
        <span
          className={cx(
            VALUE_CELL,
            check ? 'flex items-center gap-3' : 'text-right',
            muted ? 'text-ink-muted' : TONE[row.tone],
          )}
        >
          {check && <span className="pl-6">{check}</span>}
          {check ? <span className="ml-auto">{first(row)}</span> : first(row)}
          {row.tone === 'empty' && <span className="sr-only">no value</span>}
        </span>
        {both && (
          <span
            hidden={secondHidden}
            className={cx(SECOND_CELL, 'text-ink-muted')}
            data-column="second"
          >
            {fraction}
          </span>
        )}
        <span aria-hidden="true" className={SYMBOL_CELL} data-symbol>
          {base}
        </span>
        <span aria-hidden="true" className={cx('whitespace-nowrap', unitSymbol())}>
          {exponent}
        </span>
        <span className="sr-only">{row.symbol}</span>
        {withNames ? (
          <span
            aria-hidden="true"
            hidden={namesHidden}
            className={cx(NAME_CELL, muted ? 'text-ink-muted' : 'text-ink')}
            data-name
            data-column="name"
          >
            {row.name}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="sr-only">
          {row.name}
          {row.inBox && ', in the box'}
        </span>
      </>
    );
  };

  /**
   * The sizer: every row's value under every rounding, its fraction, symbol, and name, in a row as
   * tall as nothing, with a row's side padding (a subgrid adds it to the edge columns). Hidden from
   * everyone; it gives way with the columns it measures.
   */
  const stack = (cell: (row: T) => ReactNode) =>
    allRows.map((row) => (
      <span key={row.id} className="block">
        {cell(row)}
      </span>
    ));
  const everyRounding = (cell: (row: T, under: TableDisplay) => ReactNode) => (row: T) =>
    ROUNDINGS.map((rounding) => (
      <span key={rounding} className="block">
        {cell(row, { ...display, rounding })}
      </span>
    ));
  const sizer = (
    <div
      aria-hidden="true"
      className="invisible col-span-7 grid h-0 grid-cols-subgrid overflow-hidden px-2"
    >
      <span className={cx(VALUE_CELL, 'col-start-1')}>{stack(everyRounding(first))}</span>
      {both && (
        <span hidden={secondHidden} className={cx(SECOND_CELL, 'col-start-2')} data-column="second">
          {stack(everyRounding(second))}
        </span>
      )}
      <span className={SYMBOL_CELL}>{stack((row) => splitExponent(row.symbol)[0])}</span>
      <span className={cx('col-start-5 whitespace-nowrap', unitSymbol())}>
        {stack((row) => splitExponent(row.symbol)[1])}
      </span>
      {withNames && (
        <span hidden={namesHidden} className={cx(NAME_CELL, 'col-start-6')} data-column="name">
          {stack((row) => row.name)}
        </span>
      )}
    </div>
  );

  const checkbox = (row: T, on: boolean) => (
    <input
      id={`${checkId}-${row.id}`}
      type="checkbox"
      checked={on}
      // The unit in the box always shows.
      disabled={row.inBox}
      onChange={() => onChoose([row], !on)}
      className={CHECKBOX}
    />
  );

  /** A section's heading with its three-state checkbox, in Edit and the Hidden list. */
  const headedCheck = (label: string, rows: readonly T[], edge: string) => {
    const shownCount = rows.filter(isShown).length;
    const state = shownCount === rows.length ? 'all' : shownCount === 0 ? 'none' : 'some';
    const movable = rows.filter((row) => !row.inBox);
    return (
      <h3 className={edge}>
        <label className={cx(PANEL_TITLE, 'flex min-h-11 items-center gap-2 px-2')}>
          <SectionCheckbox state={state} onChange={() => onChoose(movable, state !== 'all')} />
          {label}
        </label>
      </h3>
    );
  };

  /** Where each section's rows start in the cursor's count. */
  const starts = sections.map((_, at) =>
    sections.slice(0, at).reduce((sum, section) => sum + section.rows.length, 0),
  );
  const grid = (
    <div ref={gridRef} id={id} role="grid" aria-labelledby={titleId} className={ROWS}>
      {sections.map((section, at) => (
        <div
          key={section.key}
          role="rowgroup"
          className="col-span-7 grid grid-cols-subgrid gap-y-0.5"
        >
          <div role="row" className={cx('col-span-7', sectionEdge(at))}>
            <span role="columnheader" className={cx('block', HEADING)}>
              {section.label}
            </span>
          </div>
          {section.rows.map((row, offset) => {
            const rowIndex = (starts[at] ?? 0) + offset;
            return (
              <div
                key={row.id}
                role="row"
                aria-selected={rowIndex === cursor}
                data-row={row.id}
                className="col-span-7 grid grid-cols-subgrid items-center"
              >
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take; a click keeps focus in the field */}
                <div
                  id={itemId(rowIndex)}
                  role="gridcell"
                  tabIndex={-1}
                  aria-disabled={row.tone === 'message' || undefined}
                  aria-describedby={row.inBox || row.tone === 'message' ? undefined : moveHintId}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPick(rowIndex)}
                  className={cx(
                    CURSOR_ROW,
                    'grid grid-cols-subgrid items-center',
                    // Without copy buttons the row runs to the card's edge: no column is kept for them.
                    display.copy ? 'col-span-6' : 'col-span-7',
                    rowFill(row.inBox, rowIndex === cursor),
                  )}
                >
                  {cells(row)}
                </div>
                {display.copy && (
                  <div role="gridcell">
                    {row.tone === 'value' ? (
                      <Button
                        variant="ghost"
                        square
                        nested
                        tabIndex={-1}
                        aria-label={`Copy ${row.name}`}
                        onClick={() => onCopy(row)}
                        {...copyProps?.(row)}
                      >
                        {copied === row.id ? <CopiedIcon /> : <CopyIcon />}
                      </Button>
                    ) : (
                      <span className="block size-11" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {sizer}
    </div>
  );

  /** Edit: every unit in its section, each a checkbox set in under its section's, as a tree's child. */
  const checklist = (
    <div ref={gridRef} className={ROWS}>
      {every.map((section, at) => (
        <div
          key={section.key}
          role="group"
          aria-label={section.label}
          className="col-span-7 grid grid-cols-subgrid gap-y-0.5"
        >
          <div className="col-span-7">
            {headedCheck(section.label, section.rows, sectionEdge(at))}
          </div>
          {section.rows.map((row) => {
            const on = isShown(row);
            return (
              <label
                key={row.id}
                htmlFor={`${checkId}-${row.id}`}
                className={cx(
                  CURSOR_ROW,
                  'col-span-7 grid grid-cols-subgrid items-center',
                  rowFill(row.inBox, false),
                )}
              >
                {cells(row, !on, checkbox(row, on))}
              </label>
            );
          })}
        </div>
      ))}
      {sizer}
    </div>
  );

  let body: ReactNode;
  if (message) body = <p className="px-2 py-2.5 font-medium text-danger">{message}</p>;
  else body = editing ? checklist : grid;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <p id={moveHintId} className="sr-only">
        Moves this unit into the box.
      </p>
      <div className={cx(LIST_CARD, 'p-2')}>
        {editing && (
          <div className="flex items-center justify-between gap-2 pb-1 pl-2">
            <span className={PANEL_TITLE}>Choose the units to show</span>
            {/* Done closes Hidden too: whoever just chose what to hide should not have to fold it. */}
            <Button
              variant="ghost"
              nested
              onClick={() => {
                onEditing(false);
                onHiddenOpen(false);
              }}
              className="text-sm"
            >
              Done
            </Button>
          </div>
        )}
        {body}
        {!editing && !message && (
          <div className="mt-1 flex min-h-11 items-center justify-between gap-2 border-t border-line pt-1">
            {hiddenCount > 0 ? (
              <button
                type="button"
                aria-expanded={hiddenOpen}
                onClick={() => onHiddenOpen(!hiddenOpen)}
                className={cx(
                  PANEL_TITLE,
                  'flex min-h-11 items-center gap-2 rounded-nested px-2 hover:bg-surface-raised',
                )}
              >
                <ChevronDownIcon
                  width="16"
                  height="16"
                  className={cx('transition-transform', !hiddenOpen && '-rotate-90')}
                />
                {/* The word and its count on one baseline, as the matches' headers; the icon centred. */}
                <span className="flex items-baseline gap-1.5">
                  Hidden
                  <span className="font-numeric font-normal">{hiddenCount}</span>
                </span>
              </button>
            ) : (
              <span className="px-2 text-sm text-ink-muted">Every unit shown</span>
            )}
            <Button variant="ghost" nested onClick={() => onEditing(true)} className="text-sm">
              Edit
            </Button>
          </div>
        )}
        {/* The Hidden list names its units, without values: it is for bringing them back. */}
        {!editing &&
          !message &&
          hiddenOpen &&
          hidden.map((section) => (
            <div key={section.key} role="group" aria-label={`Hidden, ${section.label}`}>
              {headedCheck(section.label, section.rows, 'pt-1')}
              {section.rows.map((row) => (
                <label
                  key={row.id}
                  htmlFor={`${checkId}-${row.id}`}
                  className={cx(CURSOR_ROW, 'flex items-center gap-2 pl-8 hover:bg-surface-raised')}
                >
                  {checkbox(row, false)}
                  <span className={unitSymbol()}>{row.symbol}</span>
                  <span className={withNames ? 'truncate text-ink' : 'sr-only'}>{row.name}</span>
                </label>
              ))}
            </div>
          ))}
      </div>
    </section>
  );
}
