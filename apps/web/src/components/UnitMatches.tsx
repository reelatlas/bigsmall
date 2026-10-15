import type { Category, CategoryId, Unit } from '@bigsmall/core';
import { useId, useLayoutEffect, useRef } from 'react';
import { panelKeys } from '../lib/panel-keys';
import { CURSOR_ROW, cx, LIST_CARD, rowFill, unitSymbol } from '../lib/recipes';
import { Button } from './Button';
import { MatchedText } from './MatchedText';

/** A match as the list shows it: a unit, or a category whose name matched, to open. */
export type UnitMatch =
  | { kind: 'unit'; unit: Unit; category: Category; inBox: boolean }
  | { kind: 'category'; category: Category };

/** A unit that matches but the settings hide: offered apart, with its category and section. */
export interface HiddenUnitMatch {
  unit: Unit;
  category: Category;
  /** The section it would show in: "Specialty". */
  section: string;
}

export interface UnitMatchesProps {
  /** The listbox's id, which the field's combobox controls. */
  id: string;
  /** The hidden matches' listbox's id, under the line that offers them; the field controls it too while they show. */
  hiddenId: string;
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
  /** A match was clicked or tapped, by index; the hidden ones, once shown, count on after the rest. */
  onPick: (index: number) => void;
  /** The hidden units that match (docs/UX-SPEC.md §3). */
  hidden: readonly HiddenUnitMatch[];
  /** Whether they are shown, under the line that offers them. */
  revealed: boolean;
  onReveal: (revealed: boolean) => void;
  /** Symbol only: the names leave the screen, kept for screen readers (docs/UX-SPEC.md §7). */
  symbolOnly: boolean;
  /**
   * ↑ (-1) and ↓ (1) from the line's button, which sits between the matches and the hidden ones it
   * shows (ADR 0014): back to the last match, or on to the first hidden match, else nowhere.
   */
  onLeave?: (step: 1 | -1) => void;
}

/** The columns of a match: the symbol, then the name, both left-aligned so they read down easily. */
const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3';
/** A list in the columns' grid, so the matches and the hidden ones line up across the line between them. */
const LIST = 'col-span-2 grid grid-cols-subgrid';

/**
 * The matches for a typed unit, in the table's place (docs/UX-SPEC.md §1): units from every
 * category, without values, under a header per category with its count; a category whose name
 * matched leads its group. A listbox of groups, the field's cursor moving through the matches
 * while the caret stays in the field, so the headers are passed over. Hidden units that match are
 * offered by a line under the matches and listed under it once shown, as the table's Hidden lists
 * its units under the table's foot (Sean, 2026-10-15).
 */
export function UnitMatches({
  id,
  hiddenId,
  matches,
  counts,
  query,
  notFound,
  cursor,
  itemId,
  onPick,
  hidden,
  revealed,
  onReveal,
  symbolOnly,
  onLeave,
}: UnitMatchesProps) {
  const groupId = useId();
  const ref = useRef<HTMLDivElement>(null);

  // Native listeners: the card is not itself interactive. In a layout effect, so a key pressed
  // straight after another finds the latest onLeave.
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return undefined;
    const onKeyDown = panelKeys(card, undefined, onLeave);
    card.addEventListener('keydown', onKeyDown);
    return () => card.removeEventListener('keydown', onKeyDown);
  });
  const groups: { category: Category; first: number; items: UnitMatch[] }[] = [];
  matches.forEach((match, index) => {
    const last = groups[groups.length - 1];
    if (last?.category.id === match.category.id) last.items.push(match);
    else groups.push({ category: match.category, first: index, items: [match] });
  });

  /** The line's words, which name the hidden matches' list. */
  const lineId = `${groupId}-line`;
  /** A unit's symbol and name, as every match writes them; the name for screen readers alone with Symbol only. */
  const unitText = (unit: Unit) => (
    <>
      <span className={cx('whitespace-nowrap', unitSymbol())}>
        <MatchedText text={unit.symbol} query={query} className="text-ink" />
      </span>
      <span className={symbolOnly ? 'sr-only' : 'min-w-0 text-ink'}>
        <MatchedText text={unit.plural} query={query} className="font-semibold" />
      </span>
    </>
  );

  return (
    <div ref={ref} className={cx(LIST_CARD, 'p-2')}>
      {matches.length === 0 && hidden.length === 0 && (
        <p className="px-2 py-2.5 text-sm text-ink-muted">{notFound}</p>
      )}
      {(matches.length > 0 || hidden.length > 0) && (
        <div className={ROWS}>
          {matches.length > 0 && (
            <div id={id} role="listbox" aria-label="Matching units" className={LIST}>
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
                              {unitText(match.unit)}
                              <span className="sr-only">
                                , {match.category.name}
                                {match.inBox && ', in the box'}
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
          {/*
           * Hidden units that match leave the list; a line says so and offers them, so nothing
           * typed meets a bare "No unit matches" while a hidden unit matches (docs/UX-SPEC.md §3).
           * Outside both lists, between them: once shown, the hidden ones list under it.
           */}
          {hidden.length > 0 && (
            <div
              className={cx(
                'col-span-2 flex min-h-11 items-center justify-between gap-2',
                matches.length > 0 && 'mt-1.5 border-t border-line pt-1',
              )}
            >
              <span id={lineId} className="px-2 text-sm text-ink-muted">
                {matches.length === 0 ? (
                  'Only hidden units match'
                ) : (
                  <>
                    <span className="font-numeric">{hidden.length}</span> hidden{' '}
                    {hidden.length === 1 ? 'unit also matches' : 'units also match'}
                  </>
                )}
              </span>
              <Button
                variant="ghost"
                nested
                aria-expanded={revealed}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onReveal(!revealed)}
                // Its words keep one line; at 320 px the line's own words wrap beside it.
                className="text-sm whitespace-nowrap"
              >
                {revealed ? 'Hide them' : 'Show them'}
              </Button>
            </div>
          )}
          {hidden.length > 0 && revealed && (
            <div
              id={hiddenId}
              role="listbox"
              aria-labelledby={lineId}
              className={cx(LIST, 'gap-y-0.5 pt-1')}
            >
              {hidden.map((match, offset) => {
                const index = matches.length + offset;
                return (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys move and take; a click keeps focus in the field
                  <div
                    key={match.unit.id}
                    id={itemId(index)}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === cursor}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onPick(index)}
                    className={cx(
                      CURSOR_ROW,
                      'col-span-2 grid grid-cols-subgrid items-center',
                      rowFill(false, index === cursor),
                    )}
                  >
                    <span className={cx('whitespace-nowrap', unitSymbol())}>
                      <MatchedText text={match.unit.symbol} query={query} className="text-ink" />
                    </span>
                    {/* Where the name and its category share no line, the category goes under
                        it: the name is never cut short. */}
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span className={symbolOnly ? 'sr-only' : 'min-w-0 text-ink'}>
                        <MatchedText
                          text={match.unit.plural}
                          query={query}
                          className="font-semibold"
                        />
                      </span>
                      <span className="sr-only">, hidden, {match.category.name}</span>
                      <span
                        aria-hidden="true"
                        className="ml-auto text-xs whitespace-nowrap text-ink-muted"
                      >
                        {match.category.name} · {match.section}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
