import { getUnit } from '@bigsmall/core';
import { useId } from 'react';
import { FormattedNumber } from '../../../components/NumberText';
import { UnitChip } from '../../../components/UnitChip';
import type { TableRow } from '../../../features/converter/state';
import { cx, FIELD_ROW, LIST_CARD, NO_ANSWER, unitSymbol } from '../../../lib/recipes';
import type { Section } from './sections';

// What both of the organization lab's tables draw, whichever way they filter.

export const CHOICE = 'flex min-h-11 items-center gap-2 text-sm';
export const CHECKBOX = 'size-4 accent-accent';

/** The converter's table columns: value, spare width, symbol, its exponent, name, and a last cell. */
export const ROWS =
  'grid grid-cols-[auto_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';
export const GIVE_WAY = ['name'] as const;

const EXPONENT = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/u;
const REGION_MARK = / \((?:US|UK)\)$/;

const TONE: Record<TableRow['tone'], string> = {
  value: 'text-ink',
  empty: 'text-ink-muted',
  message: NO_ANSWER,
};

export function toggleSet<T extends string>(set: ReadonlySet<T>, key: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/**
 * The symbols a section shows. A heading that names the region can drop "(US)" and "(UK)"; the
 * fixed names leave every unit as it is (Sean, 2026-10-10).
 */
export function sectionSymbols(section: Section<TableRow>, shorten: boolean): Map<string, string> {
  const namesRegion = shorten && section.label !== null && /US|UK|Imperial/i.test(section.label);
  const short = section.rows.map((row) => row.symbol.replace(REGION_MARK, ''));
  const unique = new Set(short).size === short.length;
  return new Map(
    section.rows.map((row, at) => [row.id, namesRegion && unique ? short[at]! : row.symbol]),
  );
}

/**
 * A row's value, symbol, exponent, and name, in the converter's columns. Without names (a view
 * that shows symbols only) the name's column stays, empty, and nothing in it gives way.
 */
export function RowCells({
  row,
  symbol,
  namesHidden,
  withName = true,
}: {
  row: TableRow;
  symbol: string;
  namesHidden: boolean;
  withName?: boolean;
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
      {withName ? (
        <span
          hidden={namesHidden}
          className="min-w-0 overflow-hidden pl-2 text-left whitespace-nowrap text-ink"
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

/** The box: its number, and the chip of the unit in it. */
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
    <div className={cx(LIST_CARD, FIELD_ROW, 'mt-2')}>
      <label htmlFor={`${id}-number`} className="sr-only">
        Number
      </label>
      <input
        id={`${id}-number`}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => onText(event.currentTarget.value)}
        className="min-w-0 flex-1 bg-transparent font-numeric text-3xl text-ink"
      />
      {chipUnit && (
        <UnitChip unit={chipUnit} compact={false} onOpen={() => undefined} onRemove={onRemove} />
      )}
    </div>
  );
}
