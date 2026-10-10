import { getUnit } from '@bigsmall/core';
import { useId } from 'react';
import { FormattedNumber } from '../../../components/NumberText';
import { UnitChip } from '../../../components/UnitChip';
import type { TableRow } from '../../../features/converter/state';
import { cx, FIELD_ROW, LIST_CARD, NO_ANSWER, unitSymbol } from '../../../lib/recipes';

// What the settings lab's tables draw, in the converter's columns.

export const CHECKBOX = 'size-4 accent-accent';

/** The converter's table columns: value, spare width, symbol, its exponent, name, and a last cell. */
export const ROWS =
  'grid grid-cols-[auto_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';
export const GIVE_WAY = ['name'] as const;

const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;

const TONE: Record<TableRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

export function toggleSet<T>(set: ReadonlySet<T>, key: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/**
 * A row's value, symbol, exponent, and name, in the converter's columns. `shown` is the value as
 * the display writes it (decimals to a place, a fraction), with "≈" where a fraction rounds.
 * Without names (symbols only) the name's column stays, empty, and nothing in it gives way.
 */
export function RowCells({
  row,
  shown,
  namesHidden,
  withName,
  muted = false,
}: {
  row: TableRow;
  shown: { text: string; approx: boolean } | null;
  namesHidden: boolean;
  withName: boolean;
  /** A hidden unit's row: its value and name in the muted ink, which keeps the contrast fading would lose. */
  muted?: boolean;
}) {
  const exponent = EXPONENT.exec(row.symbol)?.[0] ?? '';
  return (
    <>
      <span
        className={cx(
          'pr-2 text-right font-numeric whitespace-nowrap',
          muted ? 'text-ink-muted' : TONE[row.tone],
        )}
      >
        {shown ? (
          <>
            {shown.approx && <span className="text-ink-muted">≈ </span>}
            {shown.text}
          </>
        ) : row.tone === 'value' ? (
          <FormattedNumber text={row.text} />
        ) : (
          row.text
        )}
      </span>
      <span className={cx('col-start-3 pl-2 text-right whitespace-nowrap', unitSymbol())}>
        {row.symbol.slice(0, row.symbol.length - exponent.length)}
      </span>
      <span className={cx('whitespace-nowrap', unitSymbol())}>{exponent}</span>
      {withName ? (
        <span
          hidden={namesHidden}
          className={cx(
            'min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap',
            muted ? 'text-ink-muted' : 'text-ink',
          )}
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
