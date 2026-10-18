import { useLayoutEffect, useState, type FocusEvent, type RefObject } from 'react';

/**
 * What a menu in a fluid shell does while open, the same for every one (docs/DESIGN-SYSTEM.md,
 * "Fluid shells"): a press outside it closes it; focus leaving it closes it; Escape closes it back
 * on its trigger; and ← and → close it there too and hand the key to the toolbar, which moves on
 * from the trigger (layouts/Base.astro, ADR 0014). The converter's category menu and More; the
 * header's menus do the same in Base.astro's inline script (ADR 0002). Each menu adds its own keys
 * in a listener of its own. The trigger is read when a key lands, since a shell's button may be
 * rendered by a component that takes no ref. Native listeners on the root, which is not itself
 * interactive, bound in a layout effect so a key pressed straight after opening reaches them.
 */
export function useShellMenu({
  rootRef,
  trigger,
  initiallyOpen = false,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  trigger: () => HTMLElement | null;
  /** Open as it mounts: a gallery's sample of the open state. */
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const close = () => {
    setOpen(false);
    trigger()?.focus();
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target === trigger()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        close();
        trigger()?.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, bubbles: true }));
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('keydown', onKeyDown);
    };
  });

  /** For the root's `onBlur`: focus leaving the menu closes it. */
  const closeOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  return { open, setOpen, close, closeOnBlur };
}
