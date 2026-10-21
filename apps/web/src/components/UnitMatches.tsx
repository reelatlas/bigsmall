import type { Category, CategoryId, Ingredient, ShoeBrand, Unit } from '@bigsmall/core';
import { useId, useLayoutEffect, useRef } from 'react';
import { panelKeys } from '../lib/panel-keys';
import {
  COUNT,
  LABEL_WITH_COUNT,
  CURSOR_ROW,
  cx,
  GROUP_TITLE,
  LIST_CARD,
  LIST_FOOT,
  LIST_LINE,
  LIST_MESSAGE,
  ROW_RULE,
  rowFill,
  STUCK_HEADING,
  unitName,
  unitSymbol,
} from '../lib/recipes';
import { Button } from './Button';
import { MatchedText } from './MatchedText';

/**
 * A match as the list shows it: a unit, a category whose name matched, to open, or an ingredient,
 * under Cooking, with the unit typed before it when there was one (ADR 0021), or, in Cooking's
 * list with no ingredient, under its kind's heading (`group`).
 */
type UnitMatch =
  | { kind: 'unit'; unit: Unit; category: Category; inBox: boolean }
  | { kind: 'category'; category: Category }
  | {
      kind: 'ingredient';
      ingredient: Ingredient;
      unit: Unit | null;
      category: Category;
      inBox: boolean;
      group?: string | undefined;
    }
  /** A brand, under Shoe size, with the scale typed beside it when there was one (ADR 0028). */
  | {
      kind: 'brand';
      brand: ShoeBrand;
      unit: Unit | null;
      category: Category;
      inBox: boolean;
      group?: string | undefined;
    };

/** The heading a match is listed under: its kind's, where it has one, else its category's. */
function headingOf(match: UnitMatch): string {
  return (
    ((match.kind === 'ingredient' || match.kind === 'brand') && match.group) || match.category.name
  );
}

/** A match's key among its siblings. */
function matchKey(match: UnitMatch): string {
  if (match.kind === 'unit') return match.unit.id;
  if (match.kind === 'category') return `#${match.category.id}`;
  if (match.kind === 'brand') return `brand:${match.brand.id}:${match.unit?.id ?? ''}`;
  return `${match.ingredient.id}:${match.unit?.id ?? ''}`;
}

/** A unit that matches but the settings hide: offered apart, with its category and section. */
interface HiddenUnitMatch {
  unit: Unit;
  category: Category;
  /** The section it would show in: "Specialty". */
  section: string;
}

interface UnitMatchesProps {
  /** The listbox's id, which the field's combobox controls. */
  id: string;
  /**
   * The hidden matches' listbox's id, under the line that offers them; the field controls it too
   * while they show.
   */
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
  /**
   * A match was clicked or tapped, by index; the hidden ones, once shown, count on after the rest.
   */
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
  /**
   * Where a group's heading sticks under the box while the list scrolls, in px from the window's
   * top; none where nothing sticks (ConversionTable's `stickTop`).
   */
  stickTop?: number | undefined;
}

/**
 * The columns of a match: the symbol, then the name, both left-aligned so they read down easily.
 */
const ROWS = 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3';
/**
 * A list in the columns' grid, so the matches and the hidden ones line up across the line between
 * them.
 */
const LIST = 'col-span-2 grid grid-cols-subgrid';
/** An option as a row of the columns' grid, which the cursor moves through. */
const OPTION_ROW = cx(CURSOR_ROW, 'col-span-2 grid grid-cols-subgrid items-center');

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
  stickTop,
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
  const groups: { category: Category; heading: string; first: number; items: UnitMatch[] }[] = [];
  matches.forEach((match, index) => {
    const last = groups[groups.length - 1];
    const heading = headingOf(match);
    if (last?.heading === heading) last.items.push(match);
    else groups.push({ category: match.category, heading, first: index, items: [match] });
  });

  /** The line's words, which name the hidden matches' list. */
  const lineId = `${groupId}-line`;
  /**
   * A unit's symbol and name, as every match writes them, a pair's too (ADR 0026; Sean,
   * 2026-10-19); the name for screen readers alone with Symbol only.
   */
  const unitText = (unit: Unit) => (
    <>
      <span className={unitSymbol()} data-symbol>
        <MatchedText text={unit.symbol} query={query} className="text-ink" />
      </span>
      <span className={unitName(!symbolOnly)} data-name>
        <MatchedText text={unit.plural} query={query} className="font-semibold" />
      </span>
    </>
  );
  /**
   * An ingredient's or a brand's match: its name, matched letters heavier, after the unit typed
   * beside it when there was one, joined by the kind's word ("cups of all-purpose flour", "US men
   * · Nike"); alone, its name. Screen readers hear its category, and whether it is in the box.
   */
  const secondText = (
    match: { unit: Unit | null; category: Category; inBox: boolean },
    joiner: string,
    name: string,
  ) => (
    <>
      <span className={unitSymbol()}>{match.unit?.symbol}</span>
      <span className="min-w-0 text-ink">
        {match.unit && (
          <span className={unitName(!symbolOnly)}>
            {match.unit.plural}
            {joiner}
          </span>
        )}
        <MatchedText text={name} query={query} className="font-semibold" />
        <span className="sr-only">
          , {match.category.name}
          {match.inBox && ', in the box'}
        </span>
      </span>
    </>
  );

  return (
    <div ref={ref} className={cx(LIST_CARD, 'p-2')}>
      {matches.length === 0 && hidden.length === 0 && (
        <p className={cx(LIST_MESSAGE, 'text-sm text-ink-muted')}>{notFound}</p>
      )}
      {(matches.length > 0 || hidden.length > 0) && (
        <div className={ROWS}>
          {matches.length > 0 && (
            <div id={id} role="listbox" aria-label="Matches" className={LIST}>
              {groups.map((group, groupIndex) => {
                const headerId = `${groupId}-${groupIndex}`;
                // A kind's heading lists, so it counts nothing: a category's counts its matches.
                const count =
                  group.heading === group.category.name ? (counts[group.category.id] ?? 0) : 0;
                return (
                  <div
                    key={group.heading}
                    role="group"
                    aria-labelledby={headerId}
                    className="col-span-2 grid grid-cols-subgrid gap-y-0.5"
                  >
                    <div
                      id={headerId}
                      className={cx(
                        GROUP_TITLE,
                        LABEL_WITH_COUNT,
                        'col-span-2 px-2 pb-1',
                        groupIndex === 0 ? 'pt-1' : 'mt-1.5 border-t border-line pt-2',
                        stickTop !== undefined && STUCK_HEADING,
                      )}
                      style={stickTop !== undefined ? { top: stickTop } : undefined}
                    >
                      <span className="text-ink">{group.heading}</span>
                      {/* The group's name is its heading alone; each option says its category too. */}
                      {count > 0 && (
                        <span aria-hidden="true" className={COUNT}>
                          {count}
                        </span>
                      )}
                    </div>
                    {group.items.map((match, offset) => {
                      const index = group.first + offset;
                      return (
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys act; a click keeps focus there
                        <div
                          key={matchKey(match)}
                          id={itemId(index)}
                          role="option"
                          tabIndex={-1}
                          aria-selected={index === cursor}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => onPick(index)}
                          className={cx(
                            OPTION_ROW,
                            rowFill(match.kind !== 'category' && match.inBox, index === cursor),
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
                          ) : match.kind === 'ingredient' ? (
                            // "cups of all-purpose flour" (ADR 0021).
                            secondText(match, ' of ', match.ingredient.name)
                          ) : match.kind === 'brand' ? (
                            // "US men · Nike" (ADR 0028).
                            secondText(match, ' · ', match.brand.name)
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
              className={cx('col-span-2', LIST_FOOT, matches.length > 0 && cx('mt-1.5', ROW_RULE))}
            >
              <span id={lineId} className={LIST_LINE}>
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
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys act; a click keeps focus there
                  <div
                    key={match.unit.id}
                    id={itemId(index)}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === cursor}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onPick(index)}
                    className={cx(OPTION_ROW, rowFill(false, index === cursor))}
                  >
                    <span className={unitSymbol()} data-symbol>
                      <MatchedText text={match.unit.symbol} query={query} className="text-ink" />
                    </span>
                    {/* Where the name and its category share no line, the category goes under
                        it: the name is never cut short. */}
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span className={unitName(!symbolOnly)} data-name>
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
