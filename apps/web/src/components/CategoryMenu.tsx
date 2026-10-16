import type { Category, CategoryId } from '@bigsmall/core';
import { useId, useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import {
  cx,
  MENU_CHEVRON,
  MENU_OPTION,
  MENU_ROOT,
  MENU_SHELL,
  MENU_SIZER,
  MENU_SIZER_LABEL,
  MENU_TRIGGER,
  SHELL_PANEL,
} from '../lib/recipes';
import { ChevronDownIcon } from './icons';

/** The trigger before a category is chosen: the control's own name, as a select shows its field's. */
const EMPTY_LABEL = 'Category';

export interface CategoryMenuProps {
  categories: readonly Category[];
  /** The category chosen, or null before one is. */
  value: CategoryId | null;
  /** While a unit is typed, how many of each category's units match it. */
  counts?: Partial<Record<CategoryId, number>> | undefined;
  /**
   * A choice was made, with Enter, a click, or a tap: the menu has closed. Focus goes back to the
   * trigger unless this moves it on.
   */
  onChoose: (id: CategoryId) => void;
  /** Its name as a control of the toolbar it sits in (`data-tool`, ADR 0014), if it is in one. */
  tool?: string;
}

/**
 * The converter's category menu (docs/UX-SPEC.md §1), built from the same recipes as the theme
 * menu: at rest a ghost, the name and its chevron with no edge or fill; open, a card around the
 * trigger and its choices, the same size. Its trigger shows the category's name, and the menu is as
 * wide as the widest, so the toolbar keeps it on its line until there is truly no room; open, its
 * trigger reads "Category" over the list, and its counts are bare numbers in the room the chevron
 * takes. The choices are native radios. ↑ and ↓ move through them without choosing, since a new
 * category takes the unit out of the box and each choice is a step to undo; Enter, a click, or a
 * tap chooses, and Escape, a click outside, or focus leaving closes it unchanged; ← and → close it
 * unchanged and move along the toolbar, as from the trigger (Sean, 2026-10-15). While a unit is
 * typed, each choice says how many of its units match.
 */
export function CategoryMenu({ categories, value, counts, onChoose, tool }: CategoryMenuProps) {
  const menuId = useId();
  const groupName = useId();
  const [open, setOpen] = useState(false);
  /** The choice the arrows have reached while open: the chosen category until they move. */
  const [reached, setReached] = useState<CategoryId | null>(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  /** Opened by a click or a tap, not by Enter or Space (a click with no pointer, detail 0). */
  const openedByPointer = useRef(false);
  const chosenName = categories.find((category) => category.id === value)?.name;

  const choose = (id: CategoryId) => {
    setOpen(false);
    onChoose(id);
    // Unless the host moved focus on (the converter puts the caret in the box after a click or a
    // key), it comes back to the trigger, as the theme menu's does, off a choice about to hide.
    if (rootRef.current?.contains(document.activeElement)) trigger.current?.focus();
  };

  // Opening moves focus onto the chosen category, or the first, as the theme menu does, without
  // moving the page: a click or a tap leaves it where it was, even with the choice below the
  // window's edge, and from the keyboard the choice comes into view, as little as it takes (Sean,
  // 2026-10-16: the page jumped to a category low in the list).
  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const choice =
      root?.querySelector<HTMLInputElement>('input:checked') ??
      root?.querySelector<HTMLInputElement>('input');
    choice?.focus({ preventScroll: true });
    if (!openedByPointer.current) choice?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  // While open: a click outside closes it; Enter chooses the choice reached and Escape closes it
  // back on the trigger; ← and → close it there too and hand the key to the toolbar, which moves
  // on from the trigger (layouts/Base.astro). Native listeners: the wrapper is not itself
  // interactive. Bound in a layout effect, so a key pressed straight after opening reaches them.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) setOpen(false);
    };
    // Pressing a choice keeps focus where it is, or the menu would close on its own blur first.
    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as Element).closest('label')) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target === trigger.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
        trigger.current?.dispatchEvent(
          new KeyboardEvent('keydown', { key: event.key, bubbles: true }),
        );
      } else if (event.key === 'Enter') {
        // The choice with focus: before any category, the first has focus without being checked.
        event.preventDefault();
        const radio = event.target instanceof HTMLInputElement ? event.target : null;
        if (radio) choose(radio.value as CategoryId);
        else setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('mousedown', onMouseDown);
      root.removeEventListener('keydown', onKeyDown);
    };
  });

  return (
    <div
      ref={rootRef}
      className={MENU_ROOT}
      data-open={open || undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {/* Unseen, every label stacked in one cell: the menu is as wide as the widest, so it keeps
          its width as categories change and while open (the theme menu's sizer). The room after
          each label is the chevron's, and open, a choice's count's: the trigger's padding and a
          choice's, with its gutter, come to the same. */}
      <span aria-hidden="true" className={MENU_SIZER}>
        {[EMPTY_LABEL, ...categories.map((category) => category.name)].map((label) => (
          <span key={label} className={MENU_SIZER_LABEL}>
            {label}
            <span className="size-4" />
          </span>
        ))}
      </span>
      <div className={MENU_SHELL}>
        <button
          ref={trigger}
          type="button"
          data-tool={tool}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={(event) => {
            openedByPointer.current = event.detail > 0;
            setReached(value);
            setOpen((now) => !now);
          }}
          className={MENU_TRIGGER}
        >
          {/* The category's name, the word "Category" kept for screen readers, as "Theme" is.
              Before a choice, and while open, the word shows, muted like the theme menu's label
              and a field's placeholder: open, the list's fill marks the choice, so the name would
              only repeat it, and the word heads the list as the shortcuts map's title does. */}
          <span className={cx((open || !chosenName) && 'text-ink-muted')}>
            {chosenName && !open ? (
              <>
                <span className="sr-only">Category </span>
                {chosenName}
              </>
            ) : (
              EMPTY_LABEL
            )}
          </span>
          <ChevronDownIcon width="16" height="16" className={MENU_CHEVRON} />
        </button>
        <fieldset id={menuId} className={cx(SHELL_PANEL, 'p-1')}>
          <legend className="sr-only">Category</legend>
          {categories.map((category) => {
            const count = counts?.[category.id];
            return (
              // A pointer's pick chooses at once. Not on click: the arrows check radios with a
              // click of their own (docs/LEARNINGS.md, "Radios fire change on every arrow key").
              // A tap ends on the choice: the menu has closed by then, and the browser's mouse
              // events and click after it would land on what it uncovered, the box, bringing a
              // touch screen's keyboard up (docs/LEARNINGS.md, "A tap's click lands on what it
              // uncovered").
              <label
                key={category.id}
                onPointerUp={() => choose(category.id)}
                onTouchEnd={(event) => event.preventDefault()}
                className={cx(MENU_OPTION, 'justify-between gap-2')}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={category.id}
                  checked={category.id === reached}
                  onChange={() => setReached(category.id)}
                  className="sr-only"
                />
                {category.name}
                {/* A bare number, as the matches' group headers show it ("Weight 2"); the word
                    stays for screen readers. */}
                {count !== undefined && count > 0 && (
                  <span className="font-numeric text-xs text-ink-muted">
                    {count}
                    <span className="sr-only"> {count === 1 ? 'match' : 'matches'}</span>
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}
