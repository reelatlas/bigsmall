import {
  formatFraction,
  formatPlaces,
  formatSignificant,
  localeSeparators,
  type FractionSize,
  type Rounded,
  type Rounding,
} from '@bigsmall/core';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { useColumnsFit } from '../lib/fit-step';
import { flash } from '../lib/flash';
import { panelKeys } from '../lib/panel-keys';
import {
  CHECKBOX,
  CHOICE_FILL,
  COUNT,
  CURSOR_ROW,
  cx,
  LIST_CARD,
  LIST_MESSAGE,
  NO_ANSWER,
  PANEL_TITLE,
  ROW_RULE,
  rowFill,
  STUCK_HEADING,
  unitName,
  unitSymbol,
} from '../lib/recipes';
import { Button } from './Button';
import { ChevronDownIcon, CopiedIcon, CopyIcon } from './icons';
import { FormattedNumber } from './NumberText';
import { TriCheckbox } from './TriCheckbox';

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
   * message, in the danger color. Only a value can be copied.
   */
  tone: 'value' | 'empty' | 'message';
  /** The unit in the box: marked in the accent's soft fill. */
  inBox: boolean;
  /**
   * A pace's value, its text minutes and seconds (5:30): it keeps that form whatever the display's
   * places or fractions, its colon lined up as a decimal point is, and copies as it shows.
   */
  clock?: boolean;
  /**
   * Measured rather than exact: converted through an ingredient's density (Cooking, ADR 0021). It
   * reads "≈" before its value, and "about" for screen readers.
   */
  approx?: boolean;
}

/** A section of rows under its name ("US (customary)"). */
export interface RowSection<T extends ConversionRow> {
  key: string;
  label: string;
  rows: readonly T[];
  /** Repeats units listed above in another form (Temperature's As a change): left out of Edit. */
  repeats?: true | undefined;
}

/** How values and names show (docs/UX-SPEC.md §7): the converter's Display settings. */
export interface TableDisplay {
  names: 'symbol' | 'both';
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
  /** Every row in its section, shown or hidden: what the columns are sized to. */
  every: readonly RowSection<T>[];
  /** In place of the rows when the value has no answer: "Too large to convert". */
  message: string | null;
  display: TableDisplay;
  /** Significant digits a value is written to with no decimal limit: the table's six. */
  significant: number;
  locale: string | undefined;
  /** The row the field's cursor is on, by index into the shown rows, or -1. */
  cursor: number;
  /** The id of a row's unit cell, which the field points at while the cursor is on it. */
  itemId: (index: number) => string;
  /** The row whose copy button shows the check, by id. */
  copied: string | null;
  /** A row was clicked or tapped, by index. */
  onPick: (index: number) => void;
  /** A row's copy button was pressed: the converter copies what it shows (`copiedText`). */
  onCopy: (row: T) => void;
  /** More props for a row's copy button: the copy hook's pointer handlers, its tooltip. */
  copyProps?: (
    row: T,
  ) => Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onPointerEnter' | 'onPointerLeave' | 'title'>;
  /** Edit: each shown row is a checkbox, the hidden units staying in Hidden. */
  editing: boolean;
  hiddenOpen: boolean;
  /** Whether a row shows, for Edit's and the Hidden list's checkboxes. */
  isShown: (row: T) => boolean;
  /** Rows shown or hidden on their own, from Edit or the Hidden list. */
  onChoose: (rows: readonly T[], show: boolean) => void;
  onEditing: (editing: boolean) => void;
  onHiddenOpen: (open: boolean) => void;
  /**
   * ↑ from the foot (-1) and ↓ past the table's last control (1), out of Edit: the foot carries on
   * from the box's rows (ADR 0014), so the layout puts focus back on them, or on the next plane.
   */
  onLeave?: (step: 1 | -1) => void;
  /**
   * Where a section's name sticks under the box while the table scrolls, in px from the window's
   * top, so the section being read is always named; none where nothing sticks (the layout decides
   * by the window's height, docs/UX-SPEC.md §1). The table's headings only: Edit's and Hidden's
   * carry a checkbox, and scroll with their lists.
   */
  stickTop?: number | undefined;
}

/**
 * A row reads "250 … mL milliliters": the value on the left in equal-width digits, a decimal in two
 * columns, its whole part right-aligned and the rest left-aligned after it, so values line up on
 * the decimal point (96 beside 473.18); with Both, its fraction beside it; past a column that takes
 * the spare width, on the right, the symbol right-aligned in its column, an exponent hanging after
 * it in a narrow column of its own (so "ha" ends where the "m" of "m²" does), and the name
 * left-aligned in its own; the active row's copy button laid over its end. The names keep to one
 * line: where one would not fit beside its value (a long value on a phone), the names give way in
 * every row (GIVE_WAY), then Both's fraction moves under the decimal, on a second line in the
 * value's columns, the symbol and the name centred beside both lines. The unit's cell has no column gap,
 * since the symbol and its exponent touch: its parts space themselves (pr-2, pl-2). Seven
 * columns, so a row spans col-span-7.
 */
const ROWS =
  'grid grid-cols-[auto_auto_minmax(0,max-content)_minmax(0,1fr)_auto_auto_minmax(0,max-content)] gap-y-0.5';

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

/** A decimal's whole part, and the rest from its decimal mark; a value written whole spans both. */
const WHOLE_CELL = 'text-right font-numeric whitespace-nowrap';
const DECIMALS_CELL = 'pr-2 font-numeric whitespace-nowrap';
const ACROSS_CELL = 'col-span-2 pr-2 font-numeric whitespace-nowrap';
const SECOND_CELL = 'min-w-0 overflow-hidden pr-2 pl-3 text-right font-numeric whitespace-nowrap';
/**
 * Both's fraction where its column has no room (a phone): on a second line under the value, a step
 * smaller so the row keeps its 44 px, lined up on the decimal point as the values are, its whole
 * number (and "≈") under the value's whole part and the rest after the point (Sean, 2026-10-15).
 */
const STACKED_WHOLE_CELL = 'col-start-1 text-right text-sm font-numeric whitespace-nowrap';
const STACKED_PART_CELL = 'col-start-2 pr-2 pl-1 text-sm font-numeric whitespace-nowrap';
const SYMBOL_CELL = cx('col-start-5 pl-2 text-right', unitSymbol());
const NAME_CELL = 'min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap';
const HEADING = cx(PANEL_TITLE, 'px-2 pb-1');
const ROUNDINGS: readonly Rounding[] = ['nearest', 'up', 'down'];

/**
 * The space over a section (docs/DESIGN-SYSTEM.md, "Sections and dividers, by what shows"; Sean,
 * 2026-10-15): a line between sections sits evenly between the last row's ink and the next
 * heading's, about 16 px each side, and the first heading sits as far under the card's top as a
 * panel's title does, about 20 px, never hugging it. A grid's heading is a short line of small
 * text; Edit's is a 44 px row whose text sits 12 px inside it, so each takes its own padding to
 * show the same space. A row that fills (hovered, focused) keeps 4 px between its fill and the
 * line, so the two never touch.
 */
function sectionEdge(at: number, kind: 'heading' | 'row'): string {
  if (kind === 'row') return at === 0 ? '' : cx('mt-1', ROW_RULE);
  return at === 0 ? 'pt-3' : 'mt-0.5 border-t border-line pt-3.5';
}

/**
 * The active row's copy button, laid over the row's end (Sean, 2026-10-15): no column is kept for
 * it, so names keep their room; a short fade of the row's own fill, then the fill behind the
 * button, its corners the row's.
 */
const COPY_CELL = 'absolute inset-y-0 right-0 flex';

/** The minus sign some locales write (U+2212), which a copy turns into a plain hyphen. */
const MINUS = String.fromCharCode(0x2212);

/** What shows behind the copy button: the row's fill, the accent's soft tint for the box's unit. */
function copyBehind(inBox: boolean): { fade: string; fill: string } {
  return inBox
    ? { fade: 'bg-linear-to-r from-transparent to-accent-soft', fill: 'bg-accent-soft' }
    : { fade: 'bg-linear-to-r from-transparent to-surface-raised', fill: 'bg-surface-raised' };
}

/**
 * What a row's copy takes: its value as the row shows it (Sean, 2026-10-15), the decimal with
 * Both, without the "≈" of one that rounds, its minus a plain hyphen so it pastes as a number
 * anywhere (some locales write U+2212). Null for a dash or a message.
 */
export function copiedText(
  row: ConversionRow,
  display: TableDisplay,
  locale: string | undefined,
  significant: number,
): string | null {
  if (row.tone !== 'value') return null;
  const written =
    row.value === null || row.clock ? null : firstWritten(row.value, display, locale, significant);
  return (written?.text ?? row.text).replaceAll(MINUS, '-');
}

/**
 * A value as the display writes it first: its fraction with Fraction, else its decimal. With no
 * limit, the row's own text is already the nearest six significant digits; Up and Down take the
 * same cut their way (Sean, 2026-10-18: no limit is still a cut).
 */
function firstWritten(
  value: number,
  display: TableDisplay,
  locale: string | undefined,
  significant: number,
) {
  const { rounding } = display;
  if (display.format === 'fraction') {
    return formatFraction(value, { sizes: display.fractions, rounding, locale });
  }
  if (display.places !== null)
    return formatPlaces(value, { places: display.places, rounding, locale });
  if (rounding === 'nearest') return null;
  const text = formatSignificant(value, { digits: significant, rounding, locale });
  return text === null ? null : { text, approx: false };
}

/** Both's fraction, after the decimal. */
function secondWritten(value: number, display: TableDisplay, locale: string | undefined) {
  if (display.format !== 'both') return null;
  return formatFraction(value, { sizes: display.fractions, rounding: display.rounding, locale });
}

/**
 * Both's fraction in two, to sit under the decimal: its whole number, "≈" ahead of one that
 * rounds, and the fraction after it ("≈ 36" and "3/4"). A minus with no whole number stays with
 * the fraction.
 */
function splitFraction(written: Rounded): { whole: string; part: string } {
  const at = written.text.search(/\d+\/\d+$/);
  let whole = at < 0 ? written.text : written.text.slice(0, at).trimEnd();
  let part = at < 0 ? '' : written.text.slice(at);
  if (!/\p{Nd}/u.test(whole)) {
    part = whole + part;
    whole = '';
  }
  return { whole: (written.approx ? '≈ ' : '') + whole, part };
}

/** A value as written, "≈" ahead of one that rounds or is measured; the row's own text where nothing is. */
function writtenText(row: ConversionRow, written: Rounded | null): ReactNode {
  if (written) {
    return (
      <>
        {(written.approx || row.approx) && <span className="text-ink-muted">≈ </span>}
        {written.text}
      </>
    );
  }
  return row.tone === 'value' ? <FormattedNumber text={row.text} /> : row.text;
}

/**
 * A row's value as the first two columns draw it. A decimal splits at its decimal mark, or at the
 * exponent marker without one ("1E23"), so its whole part and the rest sit in two columns and every
 * decimal point lines up; screen readers hear it whole, from `text`. A fraction, whose parts are
 * not digits after a point, a dash, and a message are written whole across both, right-aligned.
 */
type ValueParts = { text: string; whole: string; decimals: string } | { across: ReactNode };

function valueParts(
  row: ConversionRow,
  display: TableDisplay,
  locale: string | undefined,
  mark: string,
  significant: number,
): ValueParts {
  if (row.tone !== 'value') return { across: row.text };
  const written =
    row.value === null || row.clock ? null : firstWritten(row.value, display, locale, significant);
  if (display.format === 'fraction' && !row.clock) return { across: writtenText(row, written) };
  const text = written?.text ?? row.text;
  let at = text.indexOf(mark);
  if (at < 0) at = text.indexOf('E');
  // A pace's colon lines up as a decimal point does: 5:30 over 10.91.
  if (at < 0) at = text.indexOf(':');
  if (at < 0) at = text.length;
  return { text, whole: text.slice(0, at), decimals: text.slice(at) };
}

/** Which of the two lists a unit's line is in: the shown units in Edit, or Hidden. */
type List = 'shown' | 'hidden';

/**
 * The table's units (docs/UX-SPEC.md §1, §3): those the settings show, in their sections, each
 * headed; those they hide in a Hidden list at the foot, under their sections' names; and Edit,
 * which lists the shown units as Hidden lists its own, a checkbox, the symbol, and the name, with
 * no values, the hidden units staying in Hidden below, so a checkbox moves a unit between the two
 * (Sean, 2026-10-15). The table's controls (its foot, Edit, Hidden) take the arrows as a panel
 * does, out of Edit carrying on from the box's rows (ADR 0014); Escape ends Edit, then folds an
 * open Hidden; and after a unit moves focus stays where it was, on the line that took its place.
 * The field keeps focus and its cursor moves through the shown rows (aria-activedescendant on a
 * grid, ADR 0012), so the rows are no Tab stops; a click or tap on one is the field's to act on,
 * and focus stays in the field. One copy button shows at a time, laid over the active row's end in
 * a cell of its own: the row under the mouse, else the row the cursor is on, else the box's unit's
 * (the row a tap took in), out of the Tab order since Ctrl/⌘+C copies the cursor's row; the others
 * stay for screen readers, unseen and out of the pointer's way. Columns line up across rows
 * through a subgrid (ROWS), each as wide as the widest it could hold across every row and every
 * rounding (a sizer row no one sees), so a setting that changes what shows never moves the rest.
 * Screen readers hear the symbol whole ("km²") and the name, shown or not, from copies of their
 * own; the columns they are drawn in are hidden from them.
 */
export function ConversionTable<T extends ConversionRow>({
  id,
  title,
  sections,
  hidden,
  every,
  message,
  display,
  significant,
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
  onLeave,
  stickTop,
}: ConversionTableProps<T>) {
  // A section's name stuck under the box while the table scrolls, where the layout says so.
  const stuck = stickTop !== undefined && STUCK_HEADING;
  const stickStyle = stickTop !== undefined ? { top: stickTop } : undefined;
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
  const mark = useMemo(() => localeSeparators(locale).decimal, [locale]);
  const cardRef = useRef<HTMLDivElement>(null);
  const hiddenToggleRef = useRef<HTMLButtonElement>(null);
  /** The row the mouse is over, whose copy button shows before any other's. */
  const [pointed, setPointed] = useState<string | null>(null);
  const shownRows = sections.flatMap((section) => section.rows);
  const active = pointed ?? shownRows[cursor]?.id ?? shownRows.find((row) => row.inBox)?.id ?? null;

  /**
   * What showed after the last change, so the next one can mark what moved (docs/UX-SPEC.md §3,
   * Sean 2026-10-15): a unit that arrives among the rows, or in the open Hidden list, flashes the
   * accent's soft tint, and so does Hidden when units go into it. Within one category only; a
   * change that brings every row is a new table, not units arriving.
   */
  const seen = useRef<{
    title: string;
    shown: ReadonlySet<string>;
    lines: ReadonlySet<string> | null;
    hidden: number;
  } | null>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    const shown = new Set(sections.flatMap((section) => section.rows.map((row) => row.id)));
    const lines =
      hiddenOpen && !message
        ? new Set(hidden.flatMap((section) => section.rows.map((row) => row.id)))
        : null;
    const before = seen.current;
    seen.current = { title, shown, lines, hidden: hiddenCount };
    if (!card || !before || before.title !== title || message) return;
    const arrived = [...shown].filter((id) => !before.shown.has(id));
    if (arrived.length < shown.size) {
      for (const id of arrived) {
        flash(
          card.querySelector(`[data-row="${id}"] > [role="gridcell"], label[data-unit="${id}"]`),
        );
      }
    }
    if (before.lines && lines) {
      for (const id of lines) {
        if (!before.lines.has(id)) flash(card.querySelector(`label[data-unit="${id}"]`));
      }
    }
    if (hiddenCount > before.hidden) flash(hiddenToggleRef.current);
  });

  const parts = (row: T, under: TableDisplay = display) =>
    valueParts(row, under, locale, mark, significant);
  const secondOf = (row: T, under: TableDisplay = display) =>
    row.tone !== 'value' || row.value === null || row.clock
      ? null
      : secondWritten(row.value, under, locale);
  const second = (row: T, under: TableDisplay = display): ReactNode => {
    const fraction = secondOf(row, under);
    return fraction ? writtenText(row, fraction) : null;
  };
  /** Both's fraction under the decimal, one of its two parts, under a rounding. */
  const stackedPart = (pick: 'whole' | 'part') => (row: T, under: TableDisplay) => {
    const fraction = secondOf(row, under);
    return fraction ? splitFraction(fraction)[pick] : null;
  };

  /** A row's drawn cells: the value in its two columns, Both's fraction, symbol, exponent, and name. */
  const cells = (row: T) => {
    const [base, exponent] = splitExponent(row.symbol);
    const written = both ? secondOf(row) : null;
    const fraction = written ? writtenText(row, written) : null;
    const stacked = written ? splitFraction(written) : null;
    const value = parts(row);
    const tone = TONE[row.tone];
    // With Both's fraction under the value, the unit's columns span both lines, centred.
    const tall = stacked !== null && secondHidden && 'row-span-2';
    return (
      <>
        {'across' in value ? (
          <span className={cx(ACROSS_CELL, 'text-right', tone)}>
            {value.across}
            {row.tone === 'empty' && <span className="sr-only">no value</span>}
          </span>
        ) : (
          <>
            <span className={cx(WHOLE_CELL, tone)}>
              <span aria-hidden="true" data-whole>
                {row.approx && <span className="text-ink-muted">≈ </span>}
                <FormattedNumber text={value.whole} />
              </span>
            </span>
            <span aria-hidden="true" className={cx(DECIMALS_CELL, tone)}>
              <FormattedNumber text={value.decimals} />
            </span>
            <span className="sr-only">
              {row.approx && 'about '}
              {value.text}
            </span>
          </>
        )}
        {both && (
          <span
            hidden={secondHidden}
            className={cx(SECOND_CELL, 'text-ink-muted')}
            data-column="second"
          >
            {fraction}
          </span>
        )}
        {written && stacked && (
          <>
            <span
              hidden={!secondHidden}
              className={cx(STACKED_WHOLE_CELL, 'row-start-2 text-ink-muted')}
              data-instead="second"
            >
              <span aria-hidden="true">{stacked.whole}</span>
              <span className="sr-only">{fraction}</span>
            </span>
            <span
              hidden={!secondHidden}
              aria-hidden="true"
              className={cx(STACKED_PART_CELL, 'row-start-2 text-ink-muted')}
              data-instead="second"
            >
              {stacked.part}
            </span>
          </>
        )}
        <span aria-hidden="true" className={cx(SYMBOL_CELL, tall)} data-symbol>
          {base}
        </span>
        <span aria-hidden="true" className={cx(unitSymbol(), tall)}>
          {exponent}
        </span>
        <span className="sr-only">{row.symbol}</span>
        {withNames ? (
          <span
            aria-hidden="true"
            hidden={namesHidden}
            className={cx(NAME_CELL, 'text-ink', tall)}
            data-name
            data-column="name"
          >
            {row.name}
          </span>
        ) : (
          <span aria-hidden="true" className={tall || undefined} />
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
  /** One part of a row's value as drawn, under a rounding: its whole part, the rest, or all of it across. */
  const part = (pick: 'whole' | 'decimals' | 'across') => (row: T, under: TableDisplay) => {
    const value = parts(row, under);
    if ('across' in value) return pick === 'across' ? value.across : null;
    return pick === 'across' ? null : <FormattedNumber text={value[pick]} />;
  };
  const sizer = (
    <div
      aria-hidden="true"
      className="invisible col-span-7 grid h-0 grid-cols-subgrid overflow-hidden px-2"
    >
      <span className={cx(WHOLE_CELL, 'col-start-1 row-start-1')}>
        {stack(everyRounding(part('whole')))}
      </span>
      <span className={cx(DECIMALS_CELL, 'col-start-2 row-start-1')}>
        {stack(everyRounding(part('decimals')))}
      </span>
      <span className={cx(ACROSS_CELL, 'col-start-1 row-start-1')}>
        {stack(everyRounding(part('across')))}
      </span>
      {both && (
        <span
          hidden={secondHidden}
          className={cx(SECOND_CELL, 'col-start-3 row-start-1')}
          data-column="second"
        >
          {stack(everyRounding(second))}
        </span>
      )}
      {both && (
        <>
          <span
            hidden={!secondHidden}
            className={cx(STACKED_WHOLE_CELL, 'row-start-1')}
            data-instead="second"
          >
            {stack(everyRounding(stackedPart('whole')))}
          </span>
          <span
            hidden={!secondHidden}
            className={cx(STACKED_PART_CELL, 'row-start-1')}
            data-instead="second"
          >
            {stack(everyRounding(stackedPart('part')))}
          </span>
        </>
      )}
      <span className={cx(SYMBOL_CELL, 'row-start-1')}>
        {stack((row) => splitExponent(row.symbol)[0])}
      </span>
      <span className={cx('col-start-6 row-start-1', unitSymbol())}>
        {stack((row) => splitExponent(row.symbol)[1])}
      </span>
      {withNames && (
        <span
          hidden={namesHidden}
          className={cx(NAME_CELL, 'col-start-7 row-start-1')}
          data-column="name"
        >
          {stack((row) => row.name)}
        </span>
      )}
    </div>
  );

  /** Edit's sections: the units themselves, never a section that repeats them (As a change). */
  const editable = sections.filter((section) => !section.repeats);

  /**
   * Units moved from one list to the other by a checkbox. If focus was on it, it comes back to the
   * line that takes the moved one's place in its list (the next, or else the one before), so
   * Enter or Space can go down a list unit by unit; the effect below puts it there once drawn.
   */
  const focusNext = useRef<{ list: List; spot: string } | null>(null);
  const move = (list: List, rows: readonly T[], show: boolean, from: string) => {
    if (cardRef.current?.contains(document.activeElement)) {
      const leaving = new Set(rows.map((row) => row.id));
      const groups = list === 'shown' ? editable : hidden;
      const spots = groups.flatMap((section) => [
        `section:${section.key}`,
        ...section.rows.map((row) => row.id),
      ]);
      // Where focus can land: a heading that keeps a unit, and units that stay, but never the
      // box's unit, whose checkbox is fixed.
      const staying = new Set(
        groups.flatMap((section) => {
          const left = section.rows.filter((row) => !leaving.has(row.id));
          const open = left.filter((row) => !row.inBox).map((row) => row.id);
          return left.length ? [`section:${section.key}`, ...open] : [];
        }),
      );
      const at = spots.indexOf(from);
      const next = staying.has(from)
        ? from
        : (spots.slice(at + 1).find((spot) => staying.has(spot)) ??
          spots
            .slice(0, at)
            .reverse()
            .find((spot) => staying.has(spot)));
      focusNext.current = { list, spot: next ?? '' };
    }
    onChoose(rows, show);
  };
  useLayoutEffect(() => {
    const pending = focusNext.current;
    const card = cardRef.current;
    if (!pending || !card) return;
    focusNext.current = null;
    const there = pending.spot
      ? card.querySelector<HTMLElement>(
          `[data-list="${pending.list}"] [data-spot="${pending.spot}"]`,
        )
      : null;
    (there ?? card.querySelector<HTMLElement>('[data-edit]'))?.focus({ preventScroll: true });
  });

  /**
   * Where the card's top sat on the screen as Edit started or ended, so it stays there: nothing
   * over the list moves. WebKit (Safari) otherwise scrolls the page to its top as Edit's list
   * takes the rows' place (docs/LEARNINGS.md, "Safari scrolls to the top as a list is swapped").
   */
  const editAnchor = useRef<number | null>(null);
  const holdCard = () => {
    editAnchor.current = cardRef.current?.getBoundingClientRect().top ?? null;
  };
  useLayoutEffect(() => {
    const was = editAnchor.current;
    const card = cardRef.current;
    editAnchor.current = null;
    if (was === null || !card) return;
    const moved = card.getBoundingClientRect().top - was;
    if (Math.abs(moved) >= 1) window.scrollBy(0, moved);
  }, [editing]);

  /** Ends Edit, as Done does, folding Hidden, with focus back on the button that reads Edit again. */
  const endEdit = () => {
    holdCard();
    onEditing(false);
    onHiddenOpen(false);
    cardRef.current?.querySelector<HTMLElement>('[data-edit]')?.focus();
  };

  /** Folds Hidden, focus on its button: Escape's first step while it is open (Sean, 2026-10-15). */
  const foldHidden = () => {
    onHiddenOpen(false);
    hiddenToggleRef.current?.focus();
  };

  // The table's own controls take the arrows as a panel's do. Out of Edit they carry on the box's
  // plane, ↑ from the foot back to the rows and ↓ past the last on to the next plane. Escape closes
  // the innermost thing open, one step at a time: Edit, ending it; else an open Hidden, folding it;
  // else it is the layout's (back to the box). Edit keeps every arrow.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const escape = editing ? endEdit : hiddenOpen ? foldHidden : undefined;
    const onKeyDown = panelKeys(card, escape, editing ? undefined : onLeave);
    card.addEventListener('keydown', onKeyDown);
    return () => card.removeEventListener('keydown', onKeyDown);
  });

  const checkbox = (row: T, on: boolean, list: List) => (
    <input
      id={`${checkId}-${row.id}`}
      type="checkbox"
      checked={on}
      // The unit in the box always shows.
      disabled={row.inBox}
      onChange={() => move(list, [row], !on, row.id)}
      className={CHECKBOX}
      data-spot={row.id}
    />
  );

  /** A section's heading with its three-state checkbox, acting on the units listed under it. */
  const headedCheck = (section: RowSection<T>, list: List, edge: string) => {
    const shownCount = section.rows.filter(isShown).length;
    const state = shownCount === section.rows.length ? 'all' : shownCount === 0 ? 'none' : 'some';
    const movable = section.rows.filter((row) => !row.inBox);
    const marker =
      list === 'shown' ? { 'data-section': section.key } : { 'data-hidden-section': section.key };
    const spot = `section:${section.key}`;
    // Not stuck: this heading carries a control, and stuck under the box its checkbox would sit a
    // few pixels from the field (a target-size finding); Edit and Hidden scroll with their lists.
    return (
      <h3 className={edge} {...marker}>
        <label className={cx(PANEL_TITLE, CURSOR_ROW, 'flex items-center gap-2', CHOICE_FILL)}>
          <TriCheckbox
            state={state}
            data-spot={spot}
            onChange={() => move(list, movable, state !== 'all', spot)}
          />
          {section.label}
        </label>
      </h3>
    );
  };

  /**
   * A unit as a line of a list, in Edit and in Hidden alike: its checkbox, set in under its
   * section's as a tree's child, the symbol, and the name where names show; no values, since the
   * lists are for choosing units. The box's unit keeps its fill, checked and fixed.
   */
  const line = (row: T, list: List) => (
    <label
      key={row.id}
      htmlFor={`${checkId}-${row.id}`}
      data-unit={row.id}
      className={cx(
        CURSOR_ROW,
        'flex items-center gap-2 pl-8',
        row.inBox ? rowFill(true, false) : CHOICE_FILL,
      )}
    >
      {checkbox(row, list === 'shown', list)}
      {/* The symbol on one line and a long name wrapping, as the matches write them, never cut short. */}
      <span className={unitSymbol()}>{row.symbol}</span>
      <span className={unitName(withNames)}>{row.name}</span>
    </label>
  );

  /** Where each section's rows start in the cursor's count. */
  const starts = sections.map((_, at) =>
    sections.slice(0, at).reduce((sum, section) => sum + section.rows.length, 0),
  );
  const grid = (
    <div
      ref={gridRef}
      id={id}
      role="grid"
      aria-labelledby={titleId}
      className={ROWS}
      // The mouse's row shows its copy button; a touch never leaves a row pointed at.
      onPointerOver={(event) => {
        if (event.pointerType !== 'mouse') return;
        const row = (event.target as Element).closest<HTMLElement>('[data-row]');
        setPointed(row?.dataset.row ?? null);
      }}
      onPointerLeave={() => setPointed(null)}
    >
      {sections.map((section, at) => (
        <div
          key={section.key}
          role="rowgroup"
          className="col-span-7 grid grid-cols-subgrid gap-y-0.5"
        >
          <div
            role="row"
            className={cx('col-span-7', sectionEdge(at, 'heading'), stuck)}
            style={stickStyle}
            data-section={section.key}
          >
            <span role="columnheader" className={cx('block', HEADING)}>
              {section.label}
            </span>
          </div>
          {section.rows.map((row, offset) => {
            const rowIndex = (starts[at] ?? 0) + offset;
            const behind = copyBehind(row.inBox);
            return (
              <div
                key={row.id}
                role="row"
                aria-selected={rowIndex === cursor}
                data-row={row.id}
                className="relative col-span-7 grid grid-cols-subgrid items-center"
              >
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys act; a click keeps focus there */}
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
                    'col-span-7 grid grid-cols-subgrid items-center',
                    rowFill(row.inBox, rowIndex === cursor),
                  )}
                >
                  {cells(row)}
                </div>
                {row.tone === 'value' && (
                  <div
                    role="gridcell"
                    className={cx(COPY_CELL, row.id !== active && 'pointer-events-none opacity-0')}
                    data-copy-cell
                  >
                    <span aria-hidden="true" className={cx('w-4', behind.fade)} />
                    <span className={cx('flex items-center rounded-r-nested', behind.fill)}>
                      <Button
                        variant="ghost"
                        square
                        nested
                        tabIndex={-1}
                        aria-label={`Copy ${row.name}`}
                        aria-keyshortcuts="Control+C Meta+C"
                        // A click never takes focus from the field, as a row's doesn't: the
                        // arrows go on through the rows after a copy (Sean, 2026-10-15).
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onCopy(row)}
                        {...copyProps?.(row)}
                      >
                        {copied === row.id ? <CopiedIcon /> : <CopyIcon />}
                      </Button>
                    </span>
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

  /** Edit: the shown units in their sections, as Hidden lists its own. */
  const shownList = (
    <div data-list="shown">
      {editable.map((section, at) => (
        <div key={section.key} role="group" aria-label={section.label}>
          {headedCheck(section, 'shown', sectionEdge(at, 'row'))}
          {section.rows.map((row) => line(row, 'shown'))}
        </div>
      ))}
    </div>
  );

  let body: ReactNode;
  if (message) body = <p className={cx(LIST_MESSAGE, 'font-medium text-danger')}>{message}</p>;
  else body = editing ? shownList : grid;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <p id={moveHintId} className="sr-only">
        Moves this unit into the box.
      </p>
      <div
        ref={cardRef}
        // In Edit the card is where the keys go, its edge the accent while focus is in it.
        className={cx(
          LIST_CARD,
          'p-2',
          editing && 'transition-[border-color] focus-within:border-accent',
        )}
        data-table-card
      >
        {body}
        {/* The foot keeps its place in Edit, nothing over the list moving: Edit reads Done where it
            was, and Hidden stays. Over a long list the foot stays at the screen's bottom edge, Done
            in reach, as wide as the rows it covers. One row to the arrows, ← → between Hidden and
            Edit (a strip). */}
        {!message && (
          <div
            className={cx(
              ROW_RULE,
              'mt-1 flex min-h-11 items-center justify-between gap-2',
              editing && 'sticky bottom-0 bg-surface',
            )}
            data-table-foot
            data-strip
          >
            {hiddenCount > 0 ? (
              <button
                ref={hiddenToggleRef}
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
                  <span className={COUNT}>{hiddenCount}</span>
                </span>
              </button>
            ) : (
              <span className="px-2 text-sm text-ink-muted">Every unit shown</span>
            )}
            {/* Done, switched on to show Edit is, folds Hidden too: whoever just chose what to hide
                should not have to fold it. */}
            <Button
              variant="ghost"
              nested
              on={editing}
              onClick={() => {
                if (editing) endEdit();
                else {
                  holdCard();
                  onEditing(true);
                }
              }}
              className="text-sm"
              data-edit
            >
              {editing ? 'Done' : 'Edit'}
            </Button>
          </div>
        )}
        {/* The Hidden list names its units, without values: it is for bringing them back. */}
        {!message && hiddenOpen && (
          <div data-list="hidden">
            {hidden.map((section) => (
              <div key={section.key} role="group" aria-label={`Hidden, ${section.label}`}>
                {headedCheck(section, 'hidden', 'pt-1')}
                {section.rows.map((row) => line(row, 'hidden'))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
