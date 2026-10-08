import { useId, useRef, type ButtonHTMLAttributes } from 'react';
import { useColumnsFit } from '../lib/fit-step';
import { CARD, CURSOR_ROW, cx, NO_ANSWER, rowFill, unitSymbol } from '../lib/recipes';
import { Button } from './Button';
import { CopiedIcon, CopyIcon } from './icons';
import { FormattedNumber } from './NumberText';

/** One row as the table shows it; the converter maps its view onto these. */
export interface ConversionRow {
  /** The unit's id: the row's key, and what copying and moving name. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  /** The value at six significant digits, "Too large" or "Too small", or a dash. */
  text: string;
  symbol: string;
  /**
   * What the text is: a value; a dash, while there is no number or no unit to convert from; or a
   * message, in the danger color. Only a value has a copy button.
   */
  tone: 'value' | 'empty' | 'message';
  /** The unit in the box: marked in the accent's soft fill. */
  inBox: boolean;
}

export interface ConversionTableProps {
  /** The grid's id, which the field's combobox controls. */
  id: string;
  /**
   * Names the table for screen readers: the category, "Volume". On screen the category menu over
   * the box names it (docs/UX-SPEC.md §1).
   */
  title: string;
  rows: readonly ConversionRow[];
  /** In place of the rows when the value has no answer: "Too large to convert". */
  message: string | null;
  /** The row the field's cursor is on, by index, or -1. */
  cursor: number;
  /** The id of a row's unit cell, which the field points at while the cursor is on it. */
  itemId: (index: number) => string;
  /** The row whose copy button shows the check, by id. */
  copied: string | null;
  /** A row was clicked or tapped, by index. */
  onPick: (index: number) => void;
  onCopy: (row: ConversionRow) => void;
  /** More props for a row's copy button: the copy hook's pointer handlers. */
  copyProps?: (
    row: ConversionRow,
  ) => Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onPointerEnter' | 'onPointerLeave'>;
}

/**
 * A row reads "250 … mL milliliters": the value on the left, right-aligned in equal-width digits so
 * values line up at their last digit; past a column that takes the spare width, on the right, the
 * symbol right-aligned in its column, an exponent hanging after it in a narrow column of its own
 * (so "ha" ends where the "m" of "m²" does), and the name left-aligned in its own; then the copy
 * button. The names keep to one line: where one would not fit beside its value (a long value on a
 * phone), the names give way in every row (GIVE_WAY), the symbols standing alone. The unit's cell
 * has no column gap, since the symbol and its exponent touch: its parts space themselves (pr-2,
 * pl-2).
 */
const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)_auto_auto_minmax(0,max-content)_auto] gap-y-0.5';

/** The columns that give way when a row has no room for them, in that order (useColumnsFit). */
const GIVE_WAY = ['name'] as const;

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

/**
 * The table's units (docs/UX-SPEC.md §1): every unit of the category, with its value or a dash.
 * The field keeps focus and its cursor moves through the rows (aria-activedescendant on a grid,
 * ADR 0012), so the rows are no Tab stops; a click or tap on one is the field's to act on, and
 * focus stays in the field. Each row's copy button sits in a cell of its own beside it, out of
 * the Tab order like the box's own. Columns line up across rows through a subgrid (ROWS). A
 * value in exponent form sets its marker heavier, as the box does (FormattedNumber).
 * Screen readers hear the symbol whole ("km²") and the name, shown or not, from copies of their
 * own; the columns they are drawn in are hidden from them.
 */
export function ConversionTable({
  id,
  title,
  rows,
  message,
  cursor,
  itemId,
  copied,
  onPick,
  onCopy,
  copyProps,
}: ConversionTableProps) {
  const titleId = useId();
  const moveHintId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const namesHidden = useColumnsFit(gridRef, GIVE_WAY).includes('name');

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <p id={moveHintId} className="sr-only">
        Moves this unit into the box.
      </p>
      <div className={cx(CARD, 'p-2')}>
        {message ? (
          <p className="px-2 py-2.5 font-medium text-danger">{message}</p>
        ) : (
          <div ref={gridRef} id={id} role="grid" aria-labelledby={titleId} className={ROWS}>
            {rows.map((row, index) => {
              const [base, exponent] = splitExponent(row.symbol);
              return (
                <div
                  key={row.id}
                  role="row"
                  aria-selected={index === cursor}
                  data-row={row.id}
                  className="col-span-6 grid grid-cols-subgrid items-center"
                >
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take; a click keeps focus in the field */}
                  <div
                    id={itemId(index)}
                    role="gridcell"
                    tabIndex={-1}
                    aria-disabled={row.tone === 'message' || undefined}
                    aria-describedby={row.inBox || row.tone === 'message' ? undefined : moveHintId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onPick(index)}
                    className={cx(
                      CURSOR_ROW,
                      'col-span-5 grid grid-cols-subgrid items-center',
                      rowFill(row.inBox, index === cursor),
                    )}
                  >
                    <span
                      className={cx(
                        'pr-2 text-right font-numeric whitespace-nowrap',
                        TONE[row.tone],
                      )}
                    >
                      {row.tone === 'value' ? <FormattedNumber text={row.text} /> : row.text}
                      {row.tone === 'empty' && <span className="sr-only">no value</span>}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cx('col-start-3 pl-2 text-right whitespace-nowrap', unitSymbol())}
                      data-symbol
                    >
                      {base}
                    </span>
                    <span aria-hidden="true" className={cx('whitespace-nowrap', unitSymbol())}>
                      {exponent}
                    </span>
                    <span className="sr-only">{row.symbol}</span>
                    <span
                      aria-hidden="true"
                      hidden={namesHidden}
                      className="min-w-0 overflow-hidden pl-2 whitespace-nowrap text-ink"
                      data-name
                      data-column="name"
                    >
                      {row.name}
                    </span>
                    <span className="sr-only">
                      {row.name}
                      {row.inBox && ', in the box'}
                    </span>
                  </div>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
