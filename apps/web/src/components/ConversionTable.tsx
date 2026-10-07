import { useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent } from 'react';
import { CARD, cx } from '../lib/recipes';
import { Button } from './Button';
import { CopiedIcon, CopyIcon } from './icons';

/** One row as the table shows it; the converter maps its view onto these. */
export interface ConversionRow {
  /** The unit's id: the row's key, and what copying and moving name. */
  id: string;
  /** Singular or plural to agree with the value ("1 cup", "2.5 cups"). */
  name: string;
  /** The value at six significant digits, or "Too large" or "Too small". */
  text: string;
  symbol: string;
  /** False while the text is a message: there is nothing to copy or move. */
  hasValue: boolean;
  /** The unit in the box: marked, and not moved again. */
  inBox: boolean;
}

export interface ConversionTableProps {
  /**
   * Names the table for screen readers: the category, "Volume". On screen the category label
   * over the box names it (docs/UX-SPEC.md §1).
   */
  title: string;
  rows: readonly ConversionRow[];
  /** In place of the rows when the value has no answer: "Too large to convert". */
  message: string | null;
  /** The row whose copy button shows the check, by id. */
  copied: string | null;
  onUse: (row: ConversionRow) => void;
  onCopy: (row: ConversionRow) => void;
  /** More props for a row's copy button: the copy hook's pointer handlers. */
  copyProps?: (
    row: ConversionRow,
  ) => Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onPointerEnter' | 'onPointerLeave'>;
}

/**
 * A row reads "250 … mL milliliters": the value on the left, right-aligned in equal-width digits so
 * values line up at their last digit; past a column that takes the spare width, on the right, the
 * symbol right-aligned in its column and the name left-aligned in its own, meeting between them;
 * then the copy button. On a narrow screen the name shrinks first, wrapping and hyphenating.
 */
const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,max-content)_auto] gap-y-0.5';

/**
 * The table layout's rows (docs/UX-SPEC.md §1): a value in every unit of its category. A row is a
 * button that moves its unit into the box; its copy button sits beside it, never inside. The rows
 * are one Tab stop with the arrow keys between them (a roving tabindex), and Ctrl/⌘+C copies the
 * focused row, so the copy buttons stay out of the Tab order, as in the boxes. Columns line up
 * across rows through a subgrid (ROWS).
 */
export function ConversionTable({
  title,
  rows,
  message,
  copied,
  onUse,
  onCopy,
  copyProps,
}: ConversionTableProps) {
  const titleId = useId();
  const moveHintId = useId();
  const [focusIndex, setFocusIndex] = useState(0);
  const current = Math.min(focusIndex, Math.max(rows.length - 1, 0));
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const focusRow = (index: number) => {
    setFocusIndex(index);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = rows.length - 1;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      const row = rows[current];
      if (row?.hasValue) onCopy(row);
      return;
    }
    const next =
      event.key === 'ArrowDown'
        ? Math.min(current + 1, last)
        : event.key === 'ArrowUp'
          ? Math.max(current - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    focusRow(next);
  };

  return (
    <section aria-labelledby={titleId} className="mt-4">
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
          <ul className={ROWS}>
            {rows.map((row, index) => (
              <li
                key={row.id}
                className="col-span-5 grid grid-cols-subgrid items-center"
                data-row={row.id}
              >
                <button
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  type="button"
                  tabIndex={index === current ? 0 : -1}
                  aria-disabled={row.inBox || !row.hasValue || undefined}
                  aria-describedby={row.inBox || !row.hasValue ? undefined : moveHintId}
                  onFocus={() => setFocusIndex(index)}
                  onKeyDown={onKeyDown}
                  onClick={() => {
                    if (!row.inBox && row.hasValue) onUse(row);
                  }}
                  className={cx(
                    'col-span-4 grid min-h-11 grid-cols-subgrid items-center gap-x-2 rounded-nested px-2 text-left',
                    row.inBox ? 'cursor-default bg-accent-soft' : 'hover:bg-surface-raised',
                  )}
                >
                  <span
                    className={cx(
                      'text-right font-numeric whitespace-nowrap',
                      row.hasValue ? 'text-ink' : 'text-sm font-medium text-danger',
                    )}
                  >
                    {row.text}
                  </span>
                  <span className="col-start-3 text-right font-numeric font-semibold whitespace-nowrap text-ink-muted">
                    {row.symbol}
                  </span>
                  <span className="min-w-0 break-words hyphens-auto text-ink">
                    {row.name}
                    {row.inBox && <span className="sr-only">, in the box</span>}
                  </span>
                </button>
                {row.hasValue ? (
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
                  <span className="size-11" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
