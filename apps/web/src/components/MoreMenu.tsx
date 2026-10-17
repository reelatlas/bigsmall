import { useId, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { cx, SHELL } from '../lib/recipes';
import { Button } from './Button';
import { MoreIcon } from './icons';

/** A tool folded into the menu: the same action as its button on the toolbar, as a menu item. */
export interface MoreMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
  /** Can do nothing right now: shown at half strength, and a press does nothing. */
  disabled?: boolean | undefined;
  /** Its keyboard shortcut, for assistive technology (`aria-keyshortcuts`). */
  keys?: string | undefined;
}

export interface MoreMenuProps {
  items: readonly MoreMenuItem[];
  /** Its name as a control of the toolbar it sits in (`data-tool`, ADR 0014). */
  tool?: string;
  /** Open as it mounts: the gallery's sample of the open state. */
  openAtFirst?: boolean;
}

/**
 * The menu's panel: a card under the trigger's right edge, over the page, as wide as its widest
 * item (docs/DESIGN-SYSTEM.md, "Fluid shells": the dropdown under an icon trigger).
 */
const PANEL = cx(
  SHELL,
  'absolute top-full right-0 mt-1 hidden w-max min-w-44 rounded-md border-transparent bg-surface p-1 group-data-open:block',
);

/** A menu item: a row with the tool's icon, muted, and its label. */
const ITEM =
  'focus-ring-inset flex min-h-11 w-full items-center gap-3 rounded-nested-md px-2 text-sm text-ink hover:bg-surface-raised aria-disabled:opacity-50';

/**
 * More: the tools a toolbar's one row has no room for, behind one icon at its end (docs/UX-SPEC.md
 * §1, ADR 0023), on screens with a pointer; a touch screen scrolls the row instead. The trigger is
 * a ghost icon button, switched on while open; the menu opens under its right edge, over the page,
 * and lists each folded tool as a menu item with the same icon, label, and action. Enter, Space, or
 * a click on the trigger opens it with focus on the first item; ↑ and ↓ move through the items,
 * round from end to end, Home and End to the first and last; Enter, Space, or a click takes one,
 * which closes the menu and puts focus back on the trigger before the tool acts, so a tool that
 * moves focus (a panel opening) still does; Escape closes it back on the trigger; ← and → close it
 * there too and hand the key to the toolbar, which moves on; a click outside, or focus leaving,
 * closes it unchanged.
 */
export function MoreMenu({ items, tool, openAtFirst = false }: MoreMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(openAtFirst);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /** The trigger, the root's own button (Button takes no ref). */
  const trigger = () =>
    rootRef.current?.querySelector<HTMLButtonElement>(':scope > button') ?? null;

  const close = () => {
    setOpen(false);
    trigger()?.focus();
  };
  const take = (item: MoreMenuItem) => {
    if (item.disabled) return;
    close();
    item.onPress();
  };

  // Opening puts focus on the first item, as a menu does; bound in a layout effect, so a key
  // pressed straight after opening reaches the items.
  useLayoutEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [open]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target === trigger()) return;
      const menuItems = [
        ...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []),
      ];
      const at = menuItems.indexOf(event.target as HTMLButtonElement);
      const moveTo = (index: number) => {
        event.preventDefault();
        menuItems[(index + menuItems.length) % menuItems.length]?.focus();
      };
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        close();
        trigger()?.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, bubbles: true }));
      } else if (event.key === 'ArrowDown') moveTo(at + 1);
      else if (event.key === 'ArrowUp') moveTo(at - 1);
      else if (event.key === 'Home') moveTo(0);
      else if (event.key === 'End') moveTo(menuItems.length - 1);
    };
    document.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('keydown', onKeyDown);
    };
  });

  return (
    <div
      ref={rootRef}
      className="group relative"
      data-open={open || undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Button
        variant="ghost"
        square
        data-tool={tool}
        aria-label="More tools"
        title="More tools"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        on={open}
        onClick={() => setOpen((now) => !now)}
      >
        <MoreIcon />
      </Button>
      <div ref={menuRef} id={menuId} role="menu" aria-label="More tools" className={PANEL}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-disabled={item.disabled || undefined}
            aria-keyshortcuts={item.keys}
            className={ITEM}
            onClick={() => take(item)}
          >
            <span className="text-ink-muted">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
