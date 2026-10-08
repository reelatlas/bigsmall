import type { Category, CategoryId, Unit } from '@bigsmall/core';
import { useId } from 'react';
import { CARD, CURSOR_ROW, cx, rowFill, unitSymbol } from '../lib/recipes';
import { MatchedText } from './MatchedText';

/** A match as the list shows it: a unit, or a category whose name matched, to open. */
export type UnitMatch =
  | { kind: 'unit'; unit: Unit; category: Category; inBox: boolean }
  | { kind: 'category'; category: Category };

export interface UnitMatchesProps {
  /** The listbox's id, which the field's combobox controls. */
  id: string;
  /** The matches, each category's together, in the order they are listed. */
  matches: readonly UnitMatch[];
  /** How many units match, per category, for the headers. */
  counts: Partial<Record<CategoryId, number>>;
  /** The typed unit, whose matched letters are set heavier. */
  query: string;
  /** Shown in place of the list when nothing matches. */
  notFound: string;
  /** The match the field's cursor is on, by index, or -1. */
  cursor: number;
  /** The id of a match, which the field points at while the cursor is on it. */
  itemId: (index: number) => string;
  /** A match was clicked or tapped, by index. */
  onPick: (index: number) => void;
}

/** The columns of a match: the symbol, then the name, both left-aligned so they read down easily. */
const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3';

/**
 * The matches for a typed unit, in the table's place (docs/UX-SPEC.md §1): units from every
 * category, without values, under a header per category with its count; a category whose name
 * matched leads its group. A listbox of groups, the field's cursor moving through the matches
 * while the caret stays in the field, so the headers are passed over.
 */
export function UnitMatches({
  id,
  matches,
  counts,
  query,
  notFound,
  cursor,
  itemId,
  onPick,
}: UnitMatchesProps) {
  const groupId = useId();
  const groups: { category: Category; first: number; items: UnitMatch[] }[] = [];
  matches.forEach((match, index) => {
    const last = groups[groups.length - 1];
    if (last?.category.id === match.category.id) last.items.push(match);
    else groups.push({ category: match.category, first: index, items: [match] });
  });

  return (
    <div className={cx(CARD, 'p-2')}>
      {matches.length === 0 ? (
        <p className="px-2 py-2.5 text-sm text-ink-muted">{notFound}</p>
      ) : (
        <div id={id} role="listbox" aria-label="Matching units" className={ROWS}>
          {groups.map((group, groupIndex) => {
            const headerId = `${groupId}-${group.category.id}`;
            const count = counts[group.category.id] ?? 0;
            return (
              <div
                key={group.category.id}
                role="group"
                aria-labelledby={headerId}
                className="col-span-2 grid grid-cols-subgrid gap-y-0.5"
              >
                <div
                  id={headerId}
                  className={cx(
                    'col-span-2 flex items-baseline gap-1.5 px-2 pb-1 text-xs font-medium text-ink-muted',
                    groupIndex === 0 ? 'pt-1' : 'mt-1.5 border-t border-line pt-2',
                  )}
                >
                  <span className="text-ink">{group.category.name}</span>
                  {/* The group's name is its category alone; each option says its category too. */}
                  {count > 0 && (
                    <span aria-hidden="true" className="font-numeric">
                      {count}
                    </span>
                  )}
                </div>
                {group.items.map((match, offset) => {
                  const index = group.first + offset;
                  return (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take; a click keeps focus in the field
                    <div
                      key={match.kind === 'unit' ? match.unit.id : `#${match.category.id}`}
                      id={itemId(index)}
                      role="option"
                      tabIndex={-1}
                      aria-selected={index === cursor}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onPick(index)}
                      className={cx(
                        CURSOR_ROW,
                        'col-span-2 grid grid-cols-subgrid items-center',
                        rowFill(match.kind === 'unit' && match.inBox, index === cursor),
                      )}
                    >
                      {match.kind === 'unit' ? (
                        <>
                          <span className={cx('whitespace-nowrap', unitSymbol())}>
                            <MatchedText
                              text={match.unit.symbol}
                              query={query}
                              className="text-ink"
                            />
                          </span>
                          <span className="min-w-0 text-ink">
                            <MatchedText
                              text={match.unit.plural}
                              query={query}
                              className="font-semibold"
                            />
                            <span className="sr-only">, {match.category.name}</span>
                            {match.inBox && <span className="sr-only">, in the box</span>}
                          </span>
                        </>
                      ) : (
                        <span className="col-span-2 text-ink">
                          <MatchedText
                            text={match.category.name}
                            query={query}
                            className="font-bold"
                          />{' '}
                          <span className="text-xs text-ink-muted">all its units</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
