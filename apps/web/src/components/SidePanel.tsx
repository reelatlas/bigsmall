import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { panelKeys, rowsIn, stopOf } from '../lib/panel-keys';
import { CARD, cx, PANEL_ACTIVE, PANEL_TITLE } from '../lib/recipes';
import { Button } from './Button';
import { CloseIcon } from './icons';

export interface SidePanelProps {
  title: string;
  children: ReactNode;
  /** The close button, and Escape inside the panel. */
  onClose: () => void;
  /** Move focus into it when it mounts, which is what opening does. False for gallery samples. */
  focusOnOpen?: boolean;
}

/**
 * A side panel of settings (docs/DESIGN-SYSTEM.md, "Side panels"): a card like the calculator's,
 * its title row with a close button, then its controls. Not modal: the page stays in reach,
 * clicking elsewhere leaves it open, and Tab moves on past it. While focus is inside, its edge
 * turns accent (PANEL_ACTIVE) and its keys stay in it (lib/panel-keys.ts): the arrows move between
 * its rows and within a strip of choices, Enter works a checkbox or a radio, and Escape is the
 * caller's (close, focus back on its button). Typing that lands in the box is the host's
 * (TableLayout). Opening moves focus onto its first control after the close button.
 */
export function SidePanel({ title, children, onClose, focusOnOpen = true }: SidePanelProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!focusOnOpen || !panel) return;
    const rows = rowsIn(panel);
    stopOf(rows[1] ?? rows[0])?.focus();
  }, [focusOnOpen]);

  // Native listeners: the card is not itself interactive. In a layout effect, so a key pressed
  // straight after another finds the latest onClose.
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return undefined;
    const onKeyDown = panelKeys(panel, onClose);
    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={titleId}
      className={cx(CARD, 'p-3 shadow-sm', PANEL_ACTIVE)}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id={titleId} className={cx('pl-1', PANEL_TITLE)}>
          {title}
        </h2>
        <Button
          variant="ghost"
          square
          aria-label={`Close ${title.toLowerCase()}`}
          onClick={onClose}
        >
          <CloseIcon />
        </Button>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}
