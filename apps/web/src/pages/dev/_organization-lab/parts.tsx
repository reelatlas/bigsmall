import { getUnit } from '@bigsmall/core';
import { useId, type ReactNode } from 'react';
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

/**
 * A row's value, symbol, exponent, and name, in the converter's columns. `shown` is the value as
 * the display writes it (decimals to a place, a fraction), with "≈" where a fraction rounds.
 * Without names (symbols only) the name's column stays, empty, and nothing in it gives way. A
 * checkbox (Edit, the Hidden section) leads the value's cell, on the left under its heading's, so
 * no column at the right edge is kept for it and the other rows never move (Sean, 2026-10-10).
 */
export function RowCells({
  row,
  shown,
  namesHidden,
  withName,
  muted = false,
  check,
}: {
  row: TableRow;
  shown: { text: string; approx: boolean } | null;
  namesHidden: boolean;
  withName: boolean;
  /** A hidden unit's row: its value and name in the muted ink, which keeps the contrast fading would lose. */
  muted?: boolean;
  check?: ReactNode;
}) {
  const exponent = EXPONENT.exec(row.symbol)?.[0] ?? '';
  const value = shown ? (
    <>
      {shown.approx && <span className="text-ink-muted">≈ </span>}
      {shown.text}
    </>
  ) : row.tone === 'value' ? (
    <FormattedNumber text={row.text} />
  ) : (
    row.text
  );
  return (
    <>
      <span
        className={cx(
          'pr-2 font-numeric whitespace-nowrap',
          check ? 'flex items-center gap-3' : 'text-right',
          muted ? 'text-ink-muted' : TONE[row.tone],
        )}
      >
        {check}
        {check ? <span className="ml-auto">{value}</span> : value}
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

/**
 * A trial switch (the next round's proposal 3): one setting that takes effect at once. The whole
 * row is the control, so its tap is the row's; the track is drawn from the control edge, and the
 * accent once on. It moves to components/ and the gallery if Sean keeps it.
 */
export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-nested-md px-2 text-sm text-ink hover:bg-surface-raised"
    >
      {label}
      <span
        aria-hidden="true"
        className={cx(
          'flex h-6 w-10 shrink-0 items-center rounded-full border-2 p-0.5 transition-colors',
          checked ? 'border-accent bg-accent' : 'border-edge bg-surface',
        )}
      >
        <span
          className={cx(
            'size-4 rounded-full transition-transform',
            checked ? 'translate-x-4 bg-on-accent' : 'bg-ink-muted',
          )}
        />
      </span>
    </button>
  );
}

/** The two looks for a setting's choices, side by side in the lab (the next round's proposal 4). */
export type Look = 'pills' | 'segmented';

/**
 * Each choice's tap is 44 px however small its drawn shape (CLAUDE.md, accessibility): the label
 * is the target, and the shape inside it is drawn 32 px tall with less padding than the converter's
 * controls, the text kept at text-sm.
 */
const TARGET =
  'group flex min-h-11 min-w-11 cursor-pointer items-center has-disabled:cursor-not-allowed';
const SHAPE =
  'flex h-8 w-full items-center justify-center px-2.5 text-sm whitespace-nowrap text-ink peer-checked:bg-accent-soft peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus peer-disabled:text-ink-muted';
const DRAWN: Record<Look, string> = {
  /** A compact pill each, apart. */
  pills: cx(SHAPE, 'rounded-md border-2 border-edge peer-checked:border-transparent'),
  /** One strip: an edge around all, a line between each, at the controls' one weight. */
  segmented: cx(
    SHAPE,
    'border-y-2 border-r-2 border-edge group-first:rounded-l-md group-first:border-l-2 group-last:rounded-r-md',
  ),
};
const ROW: Record<Look, string> = { pills: 'flex flex-wrap gap-x-1', segmented: 'flex w-fit' };

/** One choice of a few, in either look; `name` ties rows of one choice together. */
export function ChoiceRow<T extends string | number>({
  look,
  name,
  options,
  value,
  onChange,
}: {
  look: Look;
  name: string;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className={ROW[look]}>
      {options.map((option) => (
        <label key={option.value} className={TARGET}>
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span className={DRAWN[look]}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
