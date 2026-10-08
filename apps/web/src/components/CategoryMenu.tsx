import type { Category, CategoryId } from '@bigsmall/core';
import { useId, useLayoutEffect, useRef, useState, type FocusEvent, type RefObject } from 'react';
import {
  cx,
  MENU_CHEVRON,
  MENU_OPTION,
  MENU_TRIGGER,
  SHELL,
  SHELL_BORDERED,
  SHELL_PANEL,
} from '../lib/recipes';
import { ChevronDownIcon } from './icons';

export interface CategoryMenuProps {
  categories: readonly Category[];
  /** The category chosen, or null before one is. */
  value: CategoryId | null;
  /** While a unit is typed, how many of each category's units match it. */
  counts?: Partial<Record<CategoryId, number>> | undefined;
  /** A choice was made, with Enter or a click: the menu has closed. */
  onChoose: (id: CategoryId) => void;
  /** The trigger, for a host whose keys move focus onto it (TableLayout's arrow loop). */
  triggerRef?: RefObject<HTMLButtonElement>;
}

/**
 * The converter's category menu (docs/UX-SPEC.md §1): a fluid shell like the theme menu, built
 * from the same recipes, its trigger and its choices one shape that grows over the page when
 * open. The choices are native radios. The arrows move through them without choosing, since a
 * new category takes the unit out of the box and each choice is a step to undo; Enter or a click
 * chooses, and Escape, a click outside, or focus leaving closes it unchanged. While a unit is
 * typed, each choice says how many of its units match.
 */
export function CategoryMenu({
  categories,
  value,
  counts,
  onChoose,
  triggerRef,
}: CategoryMenuProps) {
  const menuId = useId();
  const groupName = useId();
  const [open, setOpen] = useState(false);
  /** The choice the arrows have reached while open: the chosen category until they move. */
  const [reached, setReached] = useState<CategoryId | null>(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const ownTriggerRef = useRef<HTMLButtonElement>(null);
  const trigger = triggerRef ?? ownTriggerRef;
  const chosenName = categories.find((category) => category.id === value)?.name;

  const choose = (id: CategoryId) => {
    setOpen(false);
    onChoose(id);
  };

  // Opening moves focus onto the chosen category, or the first, as the theme menu does.
  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    (
      root?.querySelector<HTMLInputElement>('input:checked') ??
      root?.querySelector<HTMLInputElement>('input')
    )?.focus();
  }, [open]);

  // While open: a click outside closes it; Enter chooses the choice reached and Escape closes it
  // back on the trigger. Native listeners: the wrapper is not itself interactive. Bound in a
  // layout effect, so a key pressed straight after opening reaches them.
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
      className="group relative h-12 w-56"
      data-open={open || undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className={cx('absolute inset-x-0 top-0 rounded-md', SHELL, SHELL_BORDERED)}>
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => {
            setReached(value);
            setOpen((now) => !now);
          }}
          className={cx(MENU_TRIGGER, 'justify-between')}
        >
          {chosenName ? (
            <>
              <span className="text-ink-muted">Category</span>
              <span className="flex items-center gap-1">
                {chosenName}
                <ChevronDownIcon width="16" height="16" className={MENU_CHEVRON} />
              </span>
            </>
          ) : (
            <>
              <span>Choose a category</span>
              <ChevronDownIcon width="16" height="16" className={MENU_CHEVRON} />
            </>
          )}
        </button>
        <fieldset id={menuId} className={cx(SHELL_PANEL, 'p-1')}>
          <legend className="sr-only">Category</legend>
          {categories.map((category) => {
            const count = counts?.[category.id];
            return (
              // A pointer's pick chooses at once. Not on click: the arrows check radios with a
              // click of their own (docs/LEARNINGS.md, "Radios fire change on every arrow key").
              <label
                key={category.id}
                onPointerUp={() => choose(category.id)}
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
                {count !== undefined && count > 0 && (
                  <span className="font-numeric text-xs text-ink-muted">
                    {count} {count === 1 ? 'match' : 'matches'}
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
