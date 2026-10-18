import type { Category } from '@bigsmall/core';
import { CURSOR_ROW, cx, LIST_CARD, rowFill } from '../lib/recipes';

export interface CategoryTilesProps {
  /** The listbox's id, which the field's combobox controls. */
  id: string;
  categories: readonly Category[];
  /** The tile the field's cursor is on, by index, or -1. */
  cursor: number;
  /** The id of a tile, which the field points at while the cursor is on it. */
  itemId: (index: number) => string;
  /** A tile was clicked or tapped, by index. */
  onPick: (index: number) => void;
}

/**
 * The start, in the table's place before there is a category (docs/UX-SPEC.md §1): the
 * categories to start from, as tiles two across, four once their container is 512 px wide
 * (docs/DESIGN-SYSTEM.md, "Tiles by their container"). A listbox the field's cursor moves
 * through, ↑ ↓ by row and ← → across, while the caret stays in the field; the field counts the
 * tiles in a row as they are laid out (`data-tile`).
 */
export function CategoryTiles({ id, categories, cursor, itemId, onPick }: CategoryTilesProps) {
  return (
    <div
      id={id}
      role="listbox"
      aria-label="Categories"
      className={cx(LIST_CARD, 'grid grid-cols-2 gap-1 p-2 @lg:grid-cols-4')}
    >
      {categories.map((category, index) => (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the field's keys act; a click keeps focus there
        <div
          key={category.id}
          id={itemId(index)}
          role="option"
          tabIndex={-1}
          aria-selected={index === cursor}
          data-tile
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(index)}
          className={cx(CURSOR_ROW, 'flex items-center text-ink', rowFill(false, index === cursor))}
        >
          {category.name}
        </div>
      ))}
    </div>
  );
}
