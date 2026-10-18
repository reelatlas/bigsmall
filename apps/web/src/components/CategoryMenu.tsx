import type { Category, CategoryId } from '@bigsmall/core';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  COUNT,
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
import { useShellMenu } from '../lib/shell-menu';
import { ChevronDownIcon } from './icons';

/** The trigger before a category is chosen: the control's own name, as a select shows its field's. */
const EMPTY_LABEL = 'Category';

/**
 * Open, the shell is as wide as two closed menus (`w-2/1`, over MENU_SHELL's `inset-x-0`), its
 * top row spanning them, so every category is in view at once (Sean, 2026-10-16).
 */
const OPEN_SHELL = 'group-data-open:right-auto group-data-open:w-2/1';

/**
 * The choices in two columns that run down the first and on into the second, so ↑ and ↓ follow
 * reading order; the rows come from the count (an inline style). Each column is as wide as the
 * menu closed, the 4 px inset and the 8 px between them making up the two choices' gutters, so a
 * count keeps the room the chevron takes. Held to the window's height, the list scrolls inside,
 * never the page behind it.
 */
const COLUMNS = 'grid auto-cols-fr grid-flow-col gap-x-2 overflow-y-auto overscroll-contain p-1';

/** The room kept between the open list and the window's bottom edge, in CSS pixels: a step of 8. */
const WINDOW_GAP = 8;

/** However short the window, the open list shows this many rows; the page scrolls to the rest. */
const FEWEST_ROWS = 4;

/** Scrolls the list alone, never the page, so the item is in its view, as little as it takes. */
function revealIn(list: HTMLElement, item: HTMLElement) {
  const shown = list.getBoundingClientRect();
  const at = item.getBoundingClientRect();
  if (at.top < shown.top) list.scrollTop -= shown.top - at.top;
  else if (at.bottom > shown.bottom) list.scrollTop += at.bottom - shown.bottom;
}

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
  /**
   * The focus ring inside the trigger's edge: for a toolbar row that scrolls (ADR 0023), a scroll
   * container, which would clip a ring around it.
   */
  ringInset?: boolean;
}

/**
 * Open, the shell is a popover in the top layer (below): the browser's own styles for one set a
 * margin, a border, a padding, and system colors, which the shell's own take back; nothing at rest.
 */
const POPOVER_RESET = 'm-0 border-0 p-0 text-ink';

/**
 * The converter's category menu (docs/UX-SPEC.md §1), built from the same recipes as the theme
 * menu: at rest a ghost, the name and its chevron with no edge or fill; open, a card around the
 * trigger and its choices in two columns, each as wide as the menu, held to the window's height.
 * Its trigger shows the category's name, and the menu is as wide as the widest, so the toolbar
 * keeps it on its line until there is truly no room; open, its trigger reads "Category" over the
 * list, and its counts are bare numbers in the room the chevron takes. The choices are native
 * radios, down the first column and on into the second. ↑ and ↓ move through them without
 * choosing, since a new
 * category takes the unit out of the box and each choice is a step to undo; Enter, a click, or a
 * tap chooses, and Escape, a click outside, or focus leaving closes it unchanged; ← and → close it
 * unchanged and move along the toolbar, as from the trigger (Sean, 2026-10-15). While a unit is
 * typed, each choice says how many of its units match.
 */
export function CategoryMenu({
  categories,
  value,
  counts,
  onChoose,
  tool,
  ringInset = false,
}: CategoryMenuProps) {
  const menuId = useId();
  const groupName = useId();
  /** The choice the arrows have reached while open: the chosen category until they move. */
  const [reached, setReached] = useState<CategoryId | null>(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, setOpen, closeOnBlur } = useShellMenu({
    rootRef,
    trigger: () => trigger.current,
  });
  const listRef = useRef<HTMLDivElement>(null);
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

  // Opening holds the list to the window, measured: from its top to the window's bottom, less the
  // gap, and never fewer than FEWEST_ROWS rows, again whenever the window resizes. Then focus goes
  // onto the chosen category, or the first, as the theme menu does, and the choice into the list's
  // view, without moving the page: a click or a tap leaves the page where it was, and from the
  // keyboard the choice comes into view, as little as it takes (Sean, 2026-10-16: the page jumped
  // to a category low in the list).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;
    const fit = () => {
      const style = getComputedStyle(list);
      const inset = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const row = list.querySelector('label')?.offsetHeight ?? 0;
      const room = window.innerHeight - list.getBoundingClientRect().top - WINDOW_GAP;
      list.style.maxHeight = `${Math.max(room, FEWEST_ROWS * row + inset)}px`;
    };
    fit();
    const choice =
      list.querySelector<HTMLInputElement>('input:checked') ??
      list.querySelector<HTMLInputElement>('input');
    choice?.focus({ preventScroll: true });
    // The radio is visually hidden; the choice people see is its label.
    const label = choice?.closest('label');
    if (label && openedByPointer.current) revealIn(list, label);
    else label?.scrollIntoView({ block: 'nearest' });
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);

  // Open, the shell rises to the top layer as a popover, placed over its root: inside a toolbar
  // row that scrolls (ADR 0023) it would otherwise be clipped to the row, and in the top layer
  // nothing covers it. Twice the menu's width, as its classes say, but never past the toolbar's
  // right edge, so it never leaves the page (a phone with wider fonts): the two columns then
  // share the toolbar's width. Placed again as the page or the row scrolls and as the window
  // resizes, so it stays over its trigger. A browser without popovers opens it in place, as before.
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const root = rootRef.current;
    if (!open || !shell || !root || typeof shell.showPopover !== 'function') return;
    const place = () => {
      const at = root.getBoundingClientRect();
      const bar = root.closest('[role="toolbar"]')?.getBoundingClientRect();
      const left = bar ? Math.max(at.left, bar.left) : at.left;
      const width = bar ? Math.min(at.width * 2, bar.right - left) : at.width * 2;
      shell.style.position = 'fixed';
      shell.style.top = `${at.top}px`;
      shell.style.left = `${left}px`;
      shell.style.right = 'auto';
      shell.style.width = `${width}px`;
    };
    place();
    shell.setAttribute('popover', 'manual');
    shell.showPopover();
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, { capture: true });
      if (shell.matches(':popover-open')) shell.hidePopover();
      shell.removeAttribute('popover');
      shell.removeAttribute('style');
    };
  }, [open]);

  // While open, besides what every shell menu does (useShellMenu: a press outside, focus leaving,
  // Escape, ← and →): pressing a choice keeps focus where it is, or the menu would close on its
  // own blur first; and Enter chooses the choice reached. Native listeners on the root, bound in
  // a layout effect so a key pressed straight after opening reaches them.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as Element).closest('label')) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target === trigger.current || event.key !== 'Enter') return;
      // The choice with focus: before any category, the first has focus without being checked.
      event.preventDefault();
      const radio = event.target instanceof HTMLInputElement ? event.target : null;
      if (radio) choose(radio.value as CategoryId);
      else setOpen(false);
    };
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('keydown', onKeyDown);
    return () => {
      root.removeEventListener('mousedown', onMouseDown);
      root.removeEventListener('keydown', onKeyDown);
    };
  });

  return (
    <div ref={rootRef} className={MENU_ROOT} data-open={open || undefined} onBlur={closeOnBlur}>
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
      <div ref={shellRef} className={cx(MENU_SHELL, OPEN_SHELL, POPOVER_RESET)}>
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
          className={cx(MENU_TRIGGER, ringInset && 'focus-ring-inset')}
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
        <fieldset id={menuId} className={SHELL_PANEL}>
          <legend className="sr-only">Category</legend>
          <div
            ref={listRef}
            className={COLUMNS}
            style={{ gridTemplateRows: `repeat(${Math.ceil(categories.length / 2)}, auto)` }}
          >
            {categories.map((category) => {
              const count = counts?.[category.id];
              return (
                // A pointer's pick chooses at once. Not on click: the arrows check radios with a
                // click of their own (docs/LEARNINGS.md, "Radios fire change on every arrow
                // key"). A tap ends on the choice: the menu has closed by then, and the browser's
                // mouse events and click after it would land on what it uncovered, the box,
                // bringing a touch screen's keyboard up (docs/LEARNINGS.md, "A tap's click lands
                // on what it uncovered").
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
                    <span className={cx(COUNT, 'text-xs text-ink-muted')}>
                      {count}
                      <span className="sr-only"> {count === 1 ? 'match' : 'matches'}</span>
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
