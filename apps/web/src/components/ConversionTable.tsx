import {
  formatFraction,
  formatPair,
  formatPlaces,
  formatSignificant,
  localeSeparators,
  MINUS,
  NBSP,
  type FractionSize,
  type Rounded,
  type Rounding,
  type Unit,
} from '@bigsmall/core';
import { useId, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useColumnsFit } from '../lib/fit-step';
import { flash } from '../lib/flash';
import { panelKeys } from '../lib/panel-keys';
import { useKept } from '../lib/keeping';
import { DOUBLE_TAP_MS } from '../lib/timing';
import {
  CHOICE_FILL,
  COUNT,
  LABEL_WITH_COUNT,
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
import { ChevronDownIcon, CopiedIcon } from './icons';
import { FormattedNumber } from './NumberText';
import { Checkbox } from './Checkbox';
import { TriCheckbox } from './TriCheckbox';

/** One row as the table shows it; the converter maps its view onto these. */
interface ConversionRow {
  /** The unit's id: the row's key, and what copying and moving name. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  /** The value at six significant digits, "Too large" or "Too small", or a dash. */
  text: string;
  /**
   * The value at full precision, which the display writes to its places or fractions; null
   * without one. A row beyond its scale holds the scale's end (13.5), written the same way.
   */
  value: number | null;
  symbol: string;
  /**
   * What the text is: a value; a dash, while there is no number or no unit to convert from; a
   * message, in the danger color; or beyond, a value past the row's scale (ADR 0027), its text
   * the sign and where the scale ends ("> 13.5") in the muted ink, written in the value's columns
   * as a size is, the end in the display's form ("> 13 1/2" with Fraction), so it lines up with
   * the sizes. Only a value can be copied; a row beyond its scale is taken, as the layout decides.
   */
  tone: 'value' | 'empty' | 'message' | 'beyond';
  /** The unit in the box: marked in the accent's soft fill. */
  inBox: boolean;
  /**
   * A pace's value, its text minutes and seconds (5:30): it keeps that form whatever the display's
   * places or fractions, its colon lined up as a decimal point is, and copies as it shows.
   */
  clock?: boolean;
  /**
   * A size on a scale marked in steps (ADR 0027): its text is the step the conversion rounds to,
   * whatever the display's places; with Fraction its half is written as one (10 1/2), its scale's
   * own step whatever sizes are chosen, and with Both the decimal first and the fraction after it,
   * as every row is (Sean, 2026-10-20). It copies as it shows.
   */
  stepped?: boolean;
  /**
   * Not exact: converted through an ingredient's density (Cooking, ADR 0021), or rounded to a
   * scale's step (ADR 0027). It reads "≈" before its value, and "about" for screen readers.
   */
  approx?: boolean;
  /**
   * A pair (ADR 0026), the unit itself: its value is written as its parts by core's formatPair,
   * the total rounded to the display's step and then split ("5 ft 10.87 in", "5 ft 10 7/8 in"),
   * across the value's columns as a fraction is, and copies as it shows.
   */
  pair?: Unit | undefined;
  /**
   * A brand's row (ADR 0028), by the brand's id with the chart's line: its name is the brand's, in the names' column as a pair's is, sized as
   * if empty and cut short rather than widening the column.
   */
  brand?: { id: string; line: string } | undefined;
  /** Words after the name in the muted ink: a brand row's line and foot, or why it has no size. */
  detail?: string | undefined;
  /**
   * A brand's cell as printed (ADR 0028), a range ("9–9.5") or a third ("44 2/3"): its text
   * stands whatever the display's places or fractions, written across the value's columns, and
   * copies as it shows.
   */
  printed?: true | undefined;
}

/** A section of rows under its name ("US (customary)"). */
interface RowSection<T extends ConversionRow> {
  key: string;
  label: string;
  rows: readonly T[];
  /** Repeats units listed above in another form (Temperature's As a change): left out of Edit. */
  repeats?: true | undefined;
}

/** How values and names show (docs/UX-SPEC.md §7): the converter's Display settings. */
interface TableDisplay {
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
  /** The row whose value was just copied, by id: a check flashes over its end. */
  copied: string | null;
  /** A row was clicked or tapped, by index. */
  onPick: (index: number) => void;
  /**
   * A row was tapped or clicked a second time within the double-tap window (the ninety-ninth
   * pass): the converter copies what it shows (`copiedText`).
   */
  onCopy: (row: T) => void;
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
   * by the window's height, docs/UX-SPEC.md §1). The table's headings, and Edit's and Hidden's
   * with their checkboxes alike (Sean, 2026-10-18: one rule wherever a section's name heads a
   * list).
   */
  stickTop?: number | undefined;
}

/**
 * A row reads "250 … mL milliliters": the value on the left in equal-width digits, a decimal in two
 * columns, its whole part right-aligned and the rest left-aligned after it, so values line up on
 * the decimal point (96 beside 473.18), and a fraction split the same way at its fraction part, so
 * whole numbers line up (10 beside 10 1/2); with Both, its fraction beside it; past a column that takes
 * the spare width, on the right, the symbol right-aligned in its column, an exponent hanging after
 * it in a narrow column of its own (so "ha" ends where the "m" of "m²" does), and the name
 * left-aligned in its own; the copied check flashing over its end, a grid item laid on the
 * row's own area (never a positioned child: WebKit lays a nested subgrid out wrong under one,
 * docs/LEARNINGS.md, 2026-10-20). The names keep to one line: where one would not fit beside
 * its value (a long value on a phone), every name gives way first (GIVE_WAY), then Both's
 * fraction moves under the decimal, on a second line in the value's columns, the symbol and the
 * name centred beside both lines; a column comes back once a later one's going makes its room.
 * The single units size the columns and a pair reacts to the room they leave (Sean, 2026-10-20):
 * its symbol takes the spare width before the symbols and must fit there, the names going for it
 * as for a wide value, and its name is cut short in the names' column. The unit's cell has no
 * column gap, since the symbol and its exponent touch: its parts space themselves (pr-2, pl-2).
 * Seven columns, so a row spans col-span-7.
 */
const ROWS =
  'grid grid-cols-[auto_auto_minmax(0,max-content)_minmax(0,1fr)_auto_auto_minmax(0,max-content)] gap-y-0.5';

/**
 * The columns that give way when a row has no room for them, in that order (useColumnsFit): every
 * name, then Both's fraction; each comes back once a later one's going makes its room. A pair's
 * symbol never gives way: it must fit (`data-fits`) over the spare width before the symbols, and
 * the names go for it as for a wide value, so nothing of a pair drops before the single units'
 * equivalent would (Sean, 2026-10-20).
 */
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
  beyond: 'text-ink-muted',
};

/** A decimal's whole part, and the rest from its decimal mark; a value written whole spans both. */
const WHOLE_CELL = 'text-right font-numeric whitespace-nowrap';
const DECIMALS_CELL = 'pr-2 font-numeric whitespace-nowrap';
const ACROSS_CELL = 'col-span-2 pr-2 font-numeric whitespace-nowrap';
const SECOND_CELL = 'min-w-0 overflow-hidden pr-2 pl-3 text-right font-numeric whitespace-nowrap';
/**
 * Both's fraction where its column has no room (a phone): on a second line under the value, a step
 * smaller so the row keeps its 44 px, lined up on the decimal point as the values are, its whole
 * number (and "≈") under the value's whole part and the fraction after the point (Sean,
 * 2026-10-15), split as every fraction is (splitAtFraction), the space between them in the text.
 */
const STACKED_WHOLE_CELL = 'col-start-1 text-right text-sm font-numeric whitespace-nowrap';
const STACKED_PART_CELL = 'col-start-2 pr-2 text-sm font-numeric whitespace-nowrap';
const SYMBOL_CELL = cx('col-start-5 pl-2 text-right', unitSymbol());
/**
 * A pair's symbol, wider than any single unit's (h:m:s): right-aligned with the symbols, it takes
 * the spare width before them rather than widening their column, and must fit there: where it
 * lacks the room, the names give way for it, as for a wide value, and it never goes itself (Sean,
 * 2026-10-20: the single units size the columns, a pair reacts, and a symbol is every row's).
 */
const PAIR_SYMBOL_CELL = cx(
  'col-start-4 col-end-6 min-w-0 overflow-hidden pl-2 text-right',
  unitSymbol(),
);
const NAME_CELL = 'min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap';
/**
 * A pair's name in the names' column, which the single units' names size: sized as if empty
 * (`contain: inline-size`, the platform's size containment), it never widens the column, and what
 * does not fit is cut short with an ellipsis, the symbol beside it saying the rest (Sean,
 * 2026-10-20: a label cut short with the sign of more, never hidden while the row has a symbol).
 */
const PAIR_NAME_CELL = cx(NAME_CELL, 'truncate [contain:inline-size]');
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
 * The copied check, laid over the row's end for a moment after a second tap or click copied it
 * (Sean, 2026-10-19; a copy button sat here, on the active row, from 2026-10-15): no column is
 * kept for it, so names keep their room; a short fade of the row's own fill, then the fill behind
 * the check, its corners the row's. Nothing sits in a row at rest. A grid item on the row's own
 * area, the cell named to the same area (an auto-placed item would take the row under it),
 * painting over the cell by document order, taps going through it; never a positioned child,
 * which WebKit's nested subgrid laid out wrong, the value and the symbol drifting apart
 * (docs/LEARNINGS.md, 2026-10-20).
 */
const COPY_CELL =
  'pointer-events-none col-start-1 col-end-8 row-start-1 flex self-stretch justify-self-end';

/**
 * What shows behind the copied check: the row's fill, the accent's soft tint for the box's unit.
 */
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
    row.value === null || row.clock ? null : firstWritten(row, display, locale, significant);
  return (written?.text ?? row.text).replaceAll(MINUS, '-');
}

/** A size's own step as a fraction: a half (ADR 0027). */
const HALVES: ReadonlySet<FractionSize> = new Set([2]);

/**
 * How a pair is written under the display: the last part to its places or sizes, else the
 * significant digits.
 */
function pairOptions(
  display: TableDisplay,
  locale: string | undefined,
  significant: number,
  fraction: boolean,
) {
  const { rounding } = display;
  if (fraction) return { locale, rounding, sizes: display.fractions };
  if (display.places !== null) return { locale, rounding, places: display.places };
  return { locale, rounding, significant };
}

/**
 * A value as the display writes it first: its fraction with Fraction, else its decimal. With no
 * limit, the row's own text is already the nearest six significant digits; Up and Down take the
 * same cut their way (Sean, 2026-10-18: no limit is still a cut), and so does a value past what
 * places mean (1e15), which falls through to those six digits.
 */
function firstWritten(
  row: ConversionRow,
  display: TableDisplay,
  locale: string | undefined,
  significant: number,
) {
  const value = row.value;
  if (value === null) return null;
  // A brand's cell as printed stands as its text (ADR 0028).
  if (row.printed) return null;
  // A size (ADR 0027) takes no places: its decimal is the row's own text (10.5), and in Fraction
  // its half is written as one (10 1/2), its scale's own step whatever sizes are chosen.
  if (row.stepped) {
    return display.format === 'fraction'
      ? formatFraction(value, { sizes: HALVES, rounding: 'nearest', locale })
      : null;
  }
  if (row.pair) {
    return formatPair(
      value,
      row.pair,
      pairOptions(display, locale, significant, display.format === 'fraction'),
    );
  }
  const { rounding } = display;
  if (display.format === 'fraction') {
    return formatFraction(value, { sizes: display.fractions, rounding, locale });
  }
  if (display.places !== null) {
    const written = formatPlaces(value, { places: display.places, rounding, locale });
    if (written !== null || rounding === 'nearest') return written;
  }
  if (rounding === 'nearest') return null;
  const text = formatSignificant(value, { digits: significant, rounding, locale });
  return text === null ? null : { text, approx: false };
}

/** Both's fraction, after the decimal; a pair's whole, its last part the fraction. */
function secondWritten(row: ConversionRow, display: TableDisplay, locale: string | undefined) {
  if (display.format !== 'both' || row.value === null || row.printed) return null;
  if (row.pair) return formatPair(row.value, row.pair, pairOptions(display, locale, 0, true));
  if (row.stepped) return formatFraction(row.value, { sizes: HALVES, rounding: 'nearest', locale });
  return formatFraction(row.value, {
    sizes: display.fractions,
    rounding: display.rounding,
    locale,
  });
}

/**
 * Both's fraction in two, to sit under the decimal: its whole number, "≈" ahead of one that
 * rounds, and the fraction after it ("≈ 36" and "3/4"), split as the Fraction display splits
 * every value (splitAtFraction).
 */
function splitFraction(written: Rounded): { whole: string; part: string } {
  const split = splitAtFraction(written.text, written.approx);
  return { whole: (split.approx ? '≈ ' : '') + split.whole, part: split.decimals };
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
 * decimal point lines up; a fraction splits at its fraction part the same way, so every whole
 * number lines up and the fractions hang in a column after them (10 beside 10 1/2; Sean,
 * 2026-10-20: right-aligned across, a whole number sat under the fraction of the row above and
 * the signs scattered); screen readers hear it whole, from `text`, "about" ahead of one that
 * rounds. A pair, in its own notation, a dash, and a message are written whole across both,
 * right-aligned.
 */
interface SplitValue {
  text: string;
  whole: string;
  decimals: string;
  /** Rounds: "≈" is drawn ahead of the whole part, and "about" read. */
  approx: boolean;
}

type ValueParts = SplitValue | { across: ReactNode; spoken?: string | undefined };

function valueParts(
  row: ConversionRow,
  display: TableDisplay,
  locale: string | undefined,
  mark: string,
  significant: number,
): ValueParts {
  // A dash and a message are written across both columns.
  if (row.tone === 'empty' || row.tone === 'message') return { across: row.text };
  const fraction = display.format === 'fraction';
  // A row beyond its scale (ADR 0027) is written as a size is: its sign, then the scale's end in
  // the display's form, "> 13" in the whole column and ".5" after the mark, or "> 13" and "1/2"
  // with Fraction, so it lines up with the sizes (Sean, 2026-10-20: written across, it sat past
  // them, and in Fraction its decimal sat among their halves).
  if (row.tone === 'beyond') {
    const end =
      fraction && row.value !== null
        ? formatFraction(row.value, { sizes: HALVES, rounding: 'nearest', locale })
        : null;
    const text = end ? `${row.text.slice(0, 1)} ${end.text}` : row.text;
    return fraction ? splitAtFraction(text, false) : splitAtMark(text, mark, false);
  }
  // A brand's cell as printed (ADR 0028), a range or a third: its text stands, written across.
  if (row.printed) {
    return {
      across: (
        <>
          {row.approx && <span className="text-ink-muted">≈ </span>}
          <FormattedNumber text={row.text} />
        </>
      ),
      spoken: `${row.approx ? 'about ' : ''}${row.text}`,
    };
  }
  const written =
    row.value === null || row.clock ? null : firstWritten(row, display, locale, significant);
  // A pair has no decimal point to line up on: written whole, right-aligned, in its own notation
  // (5′ 11″), and in its parts' words for screen readers.
  if (row.pair && row.value !== null) {
    const spoken = formatPair(row.value, row.pair, {
      ...pairOptions(display, locale, significant, fraction),
      words: true,
    });
    return { across: writtenText(row, written), spoken: spoken?.text };
  }
  if (fraction && !row.clock && written) {
    return splitAtFraction(written.text, written.approx || row.approx === true);
  }
  return splitAtMark(written?.text ?? row.text, mark, row.approx === true);
}

/** A value in two, at its decimal mark, or at the exponent marker without one ("1E23"). */
function splitAtMark(text: string, mark: string, approx: boolean): SplitValue {
  let at = text.indexOf(mark);
  if (at < 0) at = text.indexOf('E');
  // A pace's colon lines up as a decimal point does: 5:30 over 10.91.
  if (at < 0) at = text.indexOf(':');
  if (at < 0) at = text.length;
  return { text, whole: text.slice(0, at), decimals: text.slice(at), approx };
}

/**
 * A fraction in two, at its fraction part: the whole number with its sign ("−", "<", "> 13") in
 * the whole column, and the fraction after it a space off, as "10 1/2" is written, the space a
 * no-break one, since a cell's first space is stripped (docs/LEARNINGS.md, 2026-10-20). A
 * fraction with no whole number ("3/4", "< 1/8") has its sign alone before it, if any, and a whole
 * number alone ("≈ 1,043,262") nothing after.
 */
function splitAtFraction(text: string, approx: boolean): SplitValue {
  const at = text.search(/\d+\/\d+$/);
  if (at < 0) return { text, whole: text, decimals: '', approx };
  return { text, whole: text.slice(0, at).trimEnd(), decimals: NBSP + text.slice(at), approx };
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
 * and focus stays in the field. A row's value is copied by a second tap or click on it within the
 * double-tap window, the first having taken the row into the box (the ninety-ninth pass), or by
 * Ctrl/⌘+C on the cursor's row: a check flashes over the row's end for a moment, and no button
 * sits in the rows, so nothing covers a name (a hover button did, 2026-10-15 to 2026-10-19).
 * Columns line up across rows through a subgrid (ROWS), each as wide as the widest it could hold
 * across every row and every rounding (a sizer row no one sees), so a setting that changes what
 * shows never moves the rest. Screen readers hear the symbol whole ("km²") and the name, shown or
 * not, from copies of their own; the columns they are drawn in are hidden from them.
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
  /** The last row tapped or clicked, and when: a second within the window copies it. */
  const lastTap = useRef<{ id: string; at: number } | null>(null);

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
      : secondWritten(row, under, locale);
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
    // A pair's row is every row's: its symbol (ft in) beside its value in the marks, then its
    // name (ADR 0026; Sean, 2026-10-20: the units in the table, as everywhere else).
    const [base, exponent] = splitExponent(row.symbol);
    const written = both ? secondOf(row) : null;
    const fraction = written ? writtenText(row, written) : null;
    const stacked = written ? splitFraction(written) : null;
    const value = parts(row);
    const tone = TONE[row.tone];
    // A brand's row reacts to the columns the units size, as a pair's does (ADR 0026, ADR 0028).
    const reacts = row.pair !== undefined || row.brand !== undefined;
    // With Both's fraction under the value, the unit's columns span both lines, centred.
    const tall = stacked !== null && secondHidden && 'row-span-2';
    return (
      <>
        {'across' in value ? (
          <span className={cx(ACROSS_CELL, 'text-right', tone)}>
            {value.spoken !== undefined ? (
              <>
                <span aria-hidden="true">{value.across}</span>
                <span className="sr-only">{value.spoken}</span>
              </>
            ) : (
              value.across
            )}
            {row.tone === 'empty' && <span className="sr-only">no value</span>}
          </span>
        ) : (
          <>
            <span className={cx(WHOLE_CELL, tone)}>
              <span aria-hidden="true" data-whole>
                {value.approx && <span className="text-ink-muted">≈ </span>}
                <FormattedNumber text={value.whole} />
              </span>
            </span>
            <span aria-hidden="true" className={cx(DECIMALS_CELL, tone)}>
              <FormattedNumber text={value.decimals} />
            </span>
            <span className="sr-only">
              {value.approx && 'about '}
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
        {/* A pair's symbol takes the spare width before the symbols and must fit there: the names
            give way for it, as for a wide value, and it never goes itself (Sean, 2026-10-20). */}
        <span
          aria-hidden="true"
          className={cx(row.pair ? PAIR_SYMBOL_CELL : SYMBOL_CELL, tall)}
          data-symbol
          data-fits={row.pair ? '' : undefined}
        >
          {base}
        </span>
        <span aria-hidden="true" className={cx('col-start-6', unitSymbol(), tall)}>
          {exponent}
        </span>
        {!row.pair && <span className="sr-only">{row.symbol}</span>}
        {/* A pair's name sits in the names' column as every row's does, the table's longest: it
            never sizes the column, and is cut short where the single units' names leave it less
            room, the symbol beside it saying the rest; it goes with the names (ADR 0026; Sean,
            2026-10-19 and 2026-10-20). */}
        {withNames ? (
          <span
            aria-hidden="true"
            hidden={namesHidden}
            className={cx(reacts ? PAIR_NAME_CELL : NAME_CELL, 'col-start-7 text-ink', tall)}
            data-name
            data-column={reacts ? undefined : 'name'}
          >
            {row.name}
            {row.detail && <span className="text-sm text-ink-muted"> · {row.detail}</span>}
          </span>
        ) : (
          <span aria-hidden="true" className={tall || undefined} />
        )}
        <span className="sr-only">
          {row.name}
          {row.detail && `, ${row.detail}`}
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
  /**
   * One part of a row's value as drawn, under a rounding: its whole part, "≈" ahead of it where
   * it rounds, the rest, or all of it across.
   */
  const part = (pick: 'whole' | 'decimals' | 'across') => (row: T, under: TableDisplay) => {
    const value = parts(row, under);
    if ('across' in value) return pick === 'across' ? value.across : null;
    if (pick === 'across') return null;
    return (
      <>
        {pick === 'whole' && value.approx && '≈ '}
        <FormattedNumber text={value[pick]} />
      </>
    );
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
        {stack((row) => splitExponent(row.pair ? '' : row.symbol)[0])}
      </span>
      {/* The pairs' symbols over the spare width and the symbols' column, never widening the
          latter and never hidden: they must fit, the names giving way for them. */}
      <span className={cx(PAIR_SYMBOL_CELL, 'row-start-1')} data-fits>
        {stack((row) => (row.pair ? splitExponent(row.symbol)[0] : ''))}
      </span>
      <span className={cx('col-start-6 row-start-1', unitSymbol())}>
        {stack((row) => splitExponent(row.symbol)[1])}
      </span>
      {/* The single units' names alone: a pair's or a brand's never sizes the column (PAIR_NAME_CELL). */}
      {withNames && (
        <span
          hidden={namesHidden}
          className={cx(NAME_CELL, 'col-start-7 row-start-1')}
          data-column="name"
        >
          {stack((row) => (row.pair || row.brand !== undefined ? '' : row.name))}
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
   * The card stays where it sat on the screen as Edit starts or ends, held before the change
   * (useKept): nothing over the list moves. WebKit (Safari) otherwise scrolls the page to its top
   * as Edit's list takes the rows' place (docs/LEARNINGS.md, "Safari scrolls to the top as a
   * list is swapped").
   */
  const holdCard = useKept(cardRef);

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
    // A pressed button or checkbox takes focus, as in Chromium: Safari leaves a clicked control
    // without it (SidePanel gives it the same way), so the keys reach the card after a click and
    // the button that reads Edit keeps focus as it turns into Done (docs/LEARNINGS.md,
    // 2026-10-18). The press's default is prevented first, since Safari drops a focus given on
    // the press otherwise. A control that keeps focus elsewhere on purpose, preventing its
    // press's default itself (a copy button), is left alone.
    const onMouseDown = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const control = (event.target as Element).closest<HTMLElement>('button, input');
      if (control && !control.matches(':disabled')) {
        event.preventDefault();
        control.focus({ preventScroll: true });
      }
    };
    card.addEventListener('keydown', onKeyDown);
    card.addEventListener('mousedown', onMouseDown);
    return () => {
      card.removeEventListener('keydown', onKeyDown);
      card.removeEventListener('mousedown', onMouseDown);
    };
  });

  const checkbox = (row: T, on: boolean, list: List) => (
    <Checkbox
      id={`${checkId}-${row.id}`}
      checked={on}
      // The unit in the box always shows.
      disabled={row.inBox}
      onChange={() => move(list, [row], !on, row.id)}
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
    // Stuck under the box as the table's headings are, so the section being read stays named in
    // Edit and in Hidden too (docs/UX-SPEC.md §1); its group ends where the next one's heading
    // pushes it up.
    return (
      <h3 className={cx(edge, stuck)} style={stickStyle} {...marker}>
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
      {/* The symbol on one line and a long name wrapping, as the matches write them, never cut
          short; a pair's too (ADR 0026; the tidy of 2026-10-20: the ninety-eighth pass's
          exception had left a pair's line blank with Symbol only, its name being for screen
          readers alone). */}
      <span className={unitSymbol()} data-symbol>
        {row.symbol}
      </span>
      <span className={unitName(withNames)} data-name>
        {row.name}
      </span>
    </label>
  );

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
                className="col-span-7 grid grid-cols-subgrid items-center"
              >
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys act; a click keeps focus there */}
                <div
                  id={itemId(rowIndex)}
                  role="gridcell"
                  tabIndex={-1}
                  aria-disabled={row.tone === 'message' || undefined}
                  aria-describedby={row.inBox || row.tone === 'message' ? undefined : moveHintId}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick(rowIndex);
                    // A second tap or click on the same row within the window copies it, the
                    // first having taken it into the box; a tap's action never waits for a
                    // second, which would lag every tap (Sean, 2026-10-19).
                    const now = performance.now();
                    const last = lastTap.current;
                    lastTap.current = { id: row.id, at: now };
                    if (
                      last?.id === row.id &&
                      now - last.at <= DOUBLE_TAP_MS &&
                      row.tone === 'value'
                    ) {
                      onCopy(row);
                    }
                  }}
                  // No double-tap zoom on a row, so the second tap reaches it, and no word selected
                  // by it, as a double-tap selects one where the zoom is off; pinch zoom stays.
                  className={cx(
                    CURSOR_ROW,
                    'col-span-7 col-start-1 row-start-1 grid touch-manipulation grid-cols-subgrid items-center select-none',
                    rowFill(row.inBox, rowIndex === cursor),
                  )}
                >
                  {cells(row)}
                </div>
                {row.tone === 'value' && copied === row.id && (
                  <div aria-hidden="true" className={COPY_CELL} data-copy-cell>
                    <span className={cx('w-4', behind.fade)} />
                    <span className={cx('flex items-center rounded-r-nested px-3', behind.fill)}>
                      <CopiedIcon />
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
        Moves this unit into the box; a second press copies its value.
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
                  CURSOR_ROW,
                  'flex items-center gap-2 hover:bg-surface-raised',
                )}
              >
                <ChevronDownIcon
                  width="16"
                  height="16"
                  className={cx('transition-transform', !hiddenOpen && '-rotate-90')}
                />
                {/* The word and its count on one baseline, as the matches' headers; the icon centred. */}
                <span className={LABEL_WITH_COUNT}>
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
