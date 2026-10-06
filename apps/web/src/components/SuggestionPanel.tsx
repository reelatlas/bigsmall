import { getCategory, type Category, type Unit } from '@bigsmall/core';
import { ChevronRightIcon } from './icons';

/** What a row in the panel can be. The smart input builds this list from a core search response. */
export type SuggestionItem =
  { kind: 'unit'; key: string; unit: Unit } | { kind: 'category'; key: string; category: Category };

export interface SuggestionPanelProps {
  id: string;
  items: SuggestionItem[];
  activeIndex: number;
  optionId: (index: number) => string;
  /** When set, a "← Back" row sits above the list and returns to the categories. */
  onBack?: (() => void) | undefined;
  /** The category this list belongs to, shown on the Back row. */
  scopeName?: string | undefined;
  /** Shown above the list, such as "No unit matches …". */
  message?: string | undefined;
  /** When true, unit rows show their category, which is how ambiguous symbols are told apart. */
  showCategory: boolean;
  onPick: (item: SuggestionItem) => void;
  onHover: (index: number) => void;
}

const row =
  'flex min-h-11 cursor-pointer items-center gap-3 px-3 text-left ' +
  'data-active:bg-accent-soft hover:bg-surface-raised';

/**
 * The listbox that grows out of a smart input. Plain WAI-ARIA combobox pattern: the input owns
 * focus and points at the active row with aria-activedescendant; rows are picked with Enter, tap,
 * or click. The Back row is a real button outside the listbox, reachable by Tab or Escape.
 * The surrounding shell (field or gallery card) draws the border and corners.
 */
export function SuggestionPanel({
  id,
  items,
  activeIndex,
  optionId,
  onBack,
  scopeName,
  message,
  showCategory,
  onPick,
  onHover,
}: SuggestionPanelProps) {
  return (
    <div className="border-t border-line">
      {onBack && (
        <div className="flex items-center justify-between border-b border-line">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onBack}
            className="flex min-h-11 items-center px-3 text-sm text-ink-muted transition-[background-color] duration-[var(--motion-fast)] ease-standard outline-none hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
          >
            ← Back
          </button>
          {scopeName && <span className="px-3 text-sm font-medium text-ink">{scopeName}</span>}
        </div>
      )}
      {message && <p className="px-3 pt-2 text-sm text-ink-muted">{message}</p>}
      <ul role="listbox" id={id} aria-label="Suggestions" className="max-h-72 overflow-y-auto py-1">
        {items.map((item, index) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the combobox input handles keys; rows are virtual-focused via aria-activedescendant
          <li
            key={item.key}
            role="option"
            id={optionId(index)}
            aria-selected={index === activeIndex}
            data-active={index === activeIndex || undefined}
            className={row}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onHover(index)}
            onClick={() => onPick(item)}
          >
            <RowBody item={item} showCategory={showCategory} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowBody({ item, showCategory }: { item: SuggestionItem; showCategory: boolean }) {
  if (item.kind === 'unit') {
    return (
      <>
        <span className="min-w-12 font-numeric font-semibold">{item.unit.symbol}</span>
        <span className="flex-1 truncate">{item.unit.plural}</span>
        {showCategory && (
          <span className="text-xs text-ink-muted">
            {getCategory(item.unit.category)?.name ?? item.unit.category}
          </span>
        )}
      </>
    );
  }
  return (
    <>
      <span className="flex-1 font-medium">{item.category.name}</span>
      <ChevronRightIcon className="text-ink-muted" />
    </>
  );
}
