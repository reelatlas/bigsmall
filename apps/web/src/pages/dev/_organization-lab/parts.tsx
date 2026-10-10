import { getUnit } from '@bigsmall/core';
import { useId, type ReactNode } from 'react';
import { Button } from '../../../components/Button';
import { CopyIcon } from '../../../components/icons';
import { FormattedNumber } from '../../../components/NumberText';
import { UnitChip } from '../../../components/UnitChip';
import type { TableRow } from '../../../features/converter/state';
import { cx, FIELD_ROW, LIST_CARD, NO_ANSWER, unitSymbol } from '../../../lib/recipes';
import type { Written } from './display';

// What the settings lab's tables draw, in the converter's columns.

export const CHECKBOX = 'size-4 accent-accent';

/**
 * The table's columns: the value, its second form beside it (Both's fraction), spare width, the symbol, its
 * exponent, the name, and a last cell (copy buttons). Seven, so a row spans all with col-span-7.
 */
export const ROWS =
  'grid grid-cols-[auto_minmax(0,max-content)_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';
/** What gives way on a narrow screen, in order: the names, then Both's second form. */
export const GIVE_WAY = ['name', 'second'] as const;

const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;

const TONE: Record<TableRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

const VALUE_CELL = 'pr-2 font-numeric whitespace-nowrap';
const SECOND_CELL = 'min-w-0 overflow-hidden pr-2 pl-3 text-right font-numeric whitespace-nowrap';
const SYMBOL_CELL = cx('col-start-4 pl-2 text-right whitespace-nowrap', unitSymbol());
const NAME_CELL = 'min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap';

/** A value as written, "≈" ahead of one that rounds; the table's own text where nothing is. */
export function writtenValue(row: TableRow, written: Written | null): ReactNode {
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

function splitSymbol(symbol: string): [string, string] {
  const exponent = EXPONENT.exec(symbol)?.[0] ?? '';
  return [symbol.slice(0, symbol.length - exponent.length), exponent];
}

/**
 * A row's value, its second form (Both), symbol, exponent, and name, in the converter's columns.
 * Without names (symbols only) the name's column stays, empty, and nothing in it gives way. A
 * checkbox (Edit) leads the value's cell on the left, set in under its heading's checkbox as a
 * tree's child is, so a section and its units read apart (Sean, 2026-10-10), and no column at the
 * right edge is kept for it.
 */
export function RowCells({
  row,
  value,
  second = null,
  namesHidden,
  secondHidden,
  withName,
  muted = false,
  check,
}: {
  row: TableRow;
  value: ReactNode;
  /** Both's fraction, in the muted ink after the decimal; null where it has none. */
  second?: ReactNode;
  namesHidden: boolean;
  secondHidden: boolean;
  withName: boolean;
  /** A hidden unit's row: its value and name in the muted ink, which keeps the contrast fading would lose. */
  muted?: boolean;
  check?: ReactNode;
}) {
  const [symbol, exponent] = splitSymbol(row.symbol);
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
        {check ? <span className="ml-auto">{value}</span> : value}
      </span>
      {second !== null && (
        <span
          hidden={secondHidden}
          className={cx(SECOND_CELL, 'text-ink-muted')}
          data-column="second"
        >
          {second}
        </span>
      )}
      <span className={SYMBOL_CELL}>{symbol}</span>
      <span className={cx('whitespace-nowrap', unitSymbol())}>{exponent}</span>
      {withName ? (
        <span
          hidden={namesHidden}
          className={cx(NAME_CELL, muted ? 'text-ink-muted' : 'text-ink')}
          data-column="name"
        >
          {row.name}
        </span>
      ) : (
        <span />
      )}
    </>
  );
}

/**
 * A row no one sees, as tall as nothing, holding every one of the category's values, second forms,
 * symbols, and names, shown or hidden: each column is then as wide as the widest it could ever
 * hold, so a preset, a switch, or a unit hidden never moves the rest (Sean, 2026-10-10). The
 * menus' sizer does the same for their widest label (`MENU_SIZER`). It gives way with the
 * columns it measures, and takes a row's side padding, which a subgrid adds to its edge columns.
 */
export function ColumnSizer({
  rows,
  value,
  second,
  namesHidden,
  secondHidden,
  withName,
}: {
  rows: readonly TableRow[];
  value: (row: TableRow) => ReactNode;
  second: ((row: TableRow) => ReactNode) | null;
  namesHidden: boolean;
  secondHidden: boolean;
  withName: boolean;
}) {
  const stack = (cell: (row: TableRow) => ReactNode) =>
    rows.map((row) => (
      <span key={row.id} className="block">
        {cell(row)}
      </span>
    ));
  return (
    <div
      aria-hidden="true"
      className="invisible col-span-7 grid h-0 grid-cols-subgrid overflow-hidden px-2"
    >
      <span className={cx(VALUE_CELL, 'col-start-1')}>{stack(value)}</span>
      {second && (
        <span hidden={secondHidden} className={cx(SECOND_CELL, 'col-start-2')} data-column="second">
          {stack(second)}
        </span>
      )}
      <span className={SYMBOL_CELL}>{stack((row) => splitSymbol(row.symbol)[0])}</span>
      <span className={cx('col-start-5 whitespace-nowrap', unitSymbol())}>
        {stack((row) => splitSymbol(row.symbol)[1])}
      </span>
      {withName && (
        <span hidden={namesHidden} className={cx(NAME_CELL, 'col-start-6')} data-column="name">
          {stack((row) => row.name)}
        </span>
      )}
    </div>
  );
}

/**
 * The box: its number or a unit being typed, and the chip of the unit in it. Display reaches it
 * as it reaches the table (Sean, 2026-10-10): with Symbol only the chip shows the symbol alone,
 * the name kept in its labels, and with copy buttons on, a copy button ends it whenever it holds a
 * number, out of the Tab order as the converter's is (Ctrl/⌘+C copies from the field).
 */
export function BoxField({
  text,
  unit,
  symbolOnly,
  value,
  onText,
  onRemove,
}: {
  text: string;
  unit: string | null;
  symbolOnly: boolean;
  /** The number to copy, or undefined for no copy button. */
  value: number | undefined;
  onText: (text: string) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const chipUnit = unit ? getUnit(unit) : undefined;
  return (
    <div className={cx(LIST_CARD, FIELD_ROW)}>
      <label htmlFor={`${id}-number`} className="sr-only">
        Number or unit
      </label>
      <input
        id={`${id}-number`}
        autoComplete="off"
        value={text}
        placeholder={chipUnit ? 'Number' : 'Number or unit'}
        onChange={(event) => onText(event.currentTarget.value)}
        className="min-w-0 flex-1 bg-transparent font-numeric text-3xl text-ink placeholder:text-ink-muted"
      />
      {chipUnit && (
        <UnitChip
          unit={chipUnit}
          compact={symbolOnly}
          onOpen={() => undefined}
          onRemove={onRemove}
        />
      )}
      {value !== undefined && (
        <Button
          variant="ghost"
          square
          nested
          tabIndex={-1}
          aria-label="Copy value"
          onClick={() => void navigator.clipboard?.writeText(String(value))}
        >
          <CopyIcon />
        </Button>
      )}
    </div>
  );
}
