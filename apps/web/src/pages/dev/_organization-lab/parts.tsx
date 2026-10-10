import { getUnit } from '@bigsmall/core';
import { useId, type ReactNode } from 'react';
import { FormattedNumber } from '../../../components/NumberText';
import { UnitChip } from '../../../components/UnitChip';
import type { TableRow } from '../../../features/converter/state';
import { cx, FIELD_ROW, LIST_CARD, NO_ANSWER, unitSymbol } from '../../../lib/recipes';
import type { Written } from './display';

// What the settings lab's tables draw, in the converter's columns.

export const CHECKBOX = 'size-4 accent-accent';

/**
 * The table's columns: the value, its decimal beside it (Both), spare width, the symbol, its
 * exponent, the name, and a last cell (copy buttons). Seven, so a row spans all with col-span-7.
 */
export const ROWS =
  'grid grid-cols-[auto_minmax(0,max-content)_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';
/** What gives way on a narrow screen, in order: the names, then Both's decimal. */
export const GIVE_WAY = ['name', 'decimal'] as const;

const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;

const TONE: Record<TableRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

const VALUE_CELL = 'pr-2 font-numeric whitespace-nowrap';
const DECIMAL_CELL = 'min-w-0 overflow-hidden pr-2 pl-3 text-right font-numeric whitespace-nowrap';
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
 * A row's value, its decimal (Both), symbol, exponent, and name, in the converter's columns.
 * Without names (symbols only) the name's column stays, empty, and nothing in it gives way. A
 * checkbox (Edit) leads the value's cell, on the left under its heading's, so no column at the
 * right edge is kept for it (Sean, 2026-10-10).
 */
export function RowCells({
  row,
  value,
  decimal = null,
  namesHidden,
  decimalHidden,
  withName,
  muted = false,
  check,
}: {
  row: TableRow;
  value: ReactNode;
  /** Both's decimal, in the muted ink after the fraction; null where it has none. */
  decimal?: ReactNode;
  namesHidden: boolean;
  decimalHidden: boolean;
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
        {check}
        {check ? <span className="ml-auto">{value}</span> : value}
      </span>
      {decimal !== null && (
        <span
          hidden={decimalHidden}
          className={cx(DECIMAL_CELL, 'text-ink-muted')}
          data-column="decimal"
        >
          {decimal}
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
 * A row no one sees, as tall as nothing, holding every one of the category's values, decimals,
 * symbols, and names, shown or hidden: each column is then as wide as the widest it could ever
 * hold, so a preset, a switch, or a unit hidden never moves the rest (Sean, 2026-10-10). The
 * menus' sizer does the same for their widest label (`MENU_SIZER`). It gives way with the
 * columns it measures, and takes a row's side padding, which a subgrid adds to its edge columns.
 */
export function ColumnSizer({
  rows,
  value,
  decimal,
  namesHidden,
  decimalHidden,
  withName,
}: {
  rows: readonly TableRow[];
  value: (row: TableRow) => ReactNode;
  decimal: ((row: TableRow) => ReactNode) | null;
  namesHidden: boolean;
  decimalHidden: boolean;
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
      {decimal && (
        <span
          hidden={decimalHidden}
          className={cx(DECIMAL_CELL, 'col-start-2')}
          data-column="decimal"
        >
          {stack(decimal)}
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

/** The box: its number or a unit being typed, and the chip of the unit in it. */
export function BoxField({
  text,
  unit,
  onText,
  onRemove,
}: {
  text: string;
  unit: string | null;
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
        <UnitChip unit={chipUnit} compact={false} onOpen={() => undefined} onRemove={onRemove} />
      )}
    </div>
  );
}
