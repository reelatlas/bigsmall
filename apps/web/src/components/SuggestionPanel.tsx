import { getCategory, matchSpan, type Category, type Unit } from '@bigsmall/core';
import { cx } from '../lib/recipes';
import { ChevronRightIcon } from './icons';

/**
 * What a row in the panel can be. The smart input builds this list from a core search response,
 * with the Back row first while a category is open, so arrow keys reach it like any other row.
 */
export type SuggestionItem =
  | { kind: 'back'; key: string }
  | { kind: 'unit'; key: string; unit: Unit }
  | { kind: 'category'; key: string; category: Category };

export const BACK_ITEM: SuggestionItem = { kind: 'back', key: '#back' };

/** The id of a row, for the combobox's aria-activedescendant. One scheme for the panel and its host. */
export function optionIdFor(listId: string, index: number): string {
  return `${listId}-option-${index}`;
}

export interface SuggestionPanelProps {
  id: string;
  /** Accessible name of the listbox, such as "First value suggestions". */
  label: string;
  items: SuggestionItem[];
  activeIndex: number;
  /** What the user typed to get these rows; the letters it matches are set heavier. */
  query?: string | undefined;
  /** The category the list is inside, shown on the Back row. */
  scopeName?: string | undefined;
  /** Shown above the list when nothing matches: "No unit matches …". */
  notFound?: string | undefined;
  /** When true, unit rows show their category, which is how ambiguous symbols are told apart. */
  showCategory: boolean;
  onPick: (item: SuggestionItem) => void;
  onHover: (index: number) => void;
}

// Rows sit in the same 8 px inset as the chip inside the field, with corners that nest in the
// field's corners, so a highlight never touches the shell's edge (docs/DESIGN-SYSTEM.md).
const ROW =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-nested px-2 text-left ' +
  'data-active:bg-accent-soft hover:bg-surface-raised';

// The Back row stays pinned at the top while the list scrolls, with a divider under it; its inner
// span carries the highlight so the divider is never highlighted.
const BACK_ROW = 'group sticky top-0 z-10 mb-1 cursor-pointer border-b border-line bg-surface pb-1';

/**
 * The listbox that grows out of a smart input. Plain WAI-ARIA combobox pattern: the input owns
 * focus and points at the active row with aria-activedescendant; rows are picked with Enter, tap,
 * or click. The Back row is the first option and stays pinned while the list scrolls, so it
 * shares the rows' edges and is reached by the arrow keys like any other row.
 * The surrounding shell (field or gallery card) draws the border and corners.
 */
export function SuggestionPanel({
  id,
  label,
  items,
  activeIndex,
  query,
  scopeName,
  notFound,
  showCategory,
  onPick,
  onHover,
}: SuggestionPanelProps) {
  const hasBack = items[0]?.kind === 'back';
  return (
    <div className="border-t border-line p-2">
      {notFound && <p className="px-2 pt-1 pb-2 text-sm text-ink-muted">{notFound}</p>}
      {/*
        With a pinned Back row, scrolling to a row keeps it clear of the pin. tabIndex -1: Chrome
        makes a scrolling list with no focusable children a Tab stop, which would catch Tab on its
        way to the next box; the input's arrow keys already scroll it.
      */}
      <ul
        role="listbox"
        id={id}
        aria-label={label}
        tabIndex={-1}
        className={cx('max-h-72 scroll-thin overflow-y-auto', hasBack && 'scroll-pt-14')}
      >
        {items.map((item, index) => {
          const active = index === activeIndex;
          const back = item.kind === 'back';
          return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the combobox input handles keys; rows are virtual-focused via aria-activedescendant
            <li
              key={item.key}
              role="option"
              id={optionIdFor(id, index)}
              aria-selected={active}
              aria-label={back ? 'Back to categories' : undefined}
              data-active={active || undefined}
              className={back ? BACK_ROW : ROW}
              onMouseDown={(event) => event.preventDefault()}
              // Movement, not entry: rows that render under a still pointer (after Back, say)
              // must not take the highlight from the row the keyboard or Back put it on.
              onMouseMove={() => {
                if (!active) onHover(index);
              }}
              onClick={() => onPick(item)}
            >
              {back ? (
                <span className="flex min-h-11 items-center justify-between rounded-nested px-2 text-sm text-ink-muted group-hover:bg-surface-raised group-hover:text-ink group-data-active:bg-accent-soft group-data-active:text-ink">
                  <span>← Back</span>
                  {scopeName && (
                    <span className="font-medium text-ink" data-scope-name>
                      {scopeName}
                    </span>
                  )}
                </span>
              ) : (
                <RowBody item={item} query={query} showCategory={showCategory} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A unit row reads "name … symbol": the name on the left, the symbol right-aligned, semibold and
 * muted, the order the chip shows them in. The letters the query matches are set heavier in both.
 */
function RowBody({
  item,
  query,
  showCategory,
}: {
  item: SuggestionItem;
  query: string | undefined;
  showCategory: boolean;
}) {
  if (item.kind === 'unit') {
    return (
      <>
        <span className="flex-1 truncate">
          <Marked text={item.unit.plural} query={query} className="font-semibold" />
          {showCategory && (
            // The literal space keeps the accessible name "ounces Weight", not "ouncesWeight".
            <>
              {' '}
              <span className="ml-1 text-xs text-ink-muted">
                {getCategory(item.unit.category)?.name ?? item.unit.category}
              </span>
            </>
          )}
        </span>
        <span className="shrink-0 font-numeric font-semibold text-ink-muted">
          <Marked text={item.unit.symbol} query={query} className="text-ink" />
        </span>
      </>
    );
  }
  if (item.kind === 'category') {
    return (
      <>
        <span className="flex-1 font-medium">
          <Marked text={item.category.name} query={query} className="font-bold" />
        </span>
        <ChevronRightIcon className="text-ink-muted" />
      </>
    );
  }
  return null;
}

/** `text` with the part that matches `query` wrapped in a span, the way search matched it (core matchSpan). */
function Marked({
  text,
  query,
  className,
}: {
  text: string;
  query: string | undefined;
  className: string;
}) {
  const span = query ? matchSpan(text, query) : null;
  if (!span) return text;
  return (
    <>
      {text.slice(0, span.start)}
      <span className={className} data-match>
        {text.slice(span.start, span.end)}
      </span>
      {text.slice(span.end)}
    </>
  );
}
