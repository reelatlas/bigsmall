import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { panelKeys, rowsIn, stopOf } from '../lib/panel-keys';
import { PANEL_CARD, PANEL_HEAD, PANEL_HEADING } from '../lib/recipes';
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
 * (TableLayout). Opening moves focus onto its first control after the close button, and a click
 * anywhere in it brings focus in, so the keys reach it after a click as they do after opening.
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
  // straight after another finds the latest onClose. A click in the panel makes it where the keys
  // go, as a click in the calculator does (Sean, 2026-10-15): on a control, focus goes to it
  // (Safari leaves a clicked button or checkbox without focus); anywhere else in the panel, focus
  // stays inside it, or comes in onto its first control.
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return undefined;
    const onKeyDown = panelKeys(panel, onClose);
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Element;
      const control =
        target.closest<HTMLElement>('button, input') ??
        (target.closest('label')?.control as HTMLElement | null | undefined);
      if (control && !control.matches(':disabled')) {
        control.focus({ preventScroll: true });
        return;
      }
      event.preventDefault();
      if (!panel.contains(document.activeElement)) {
        const rows = rowsIn(panel);
        stopOf(rows[1] ?? rows[0])?.focus({ preventScroll: true });
      }
    };
    panel.addEventListener('keydown', onKeyDown);
    panel.addEventListener('mousedown', onMouseDown);
    return () => {
      panel.removeEventListener('keydown', onKeyDown);
      panel.removeEventListener('mousedown', onMouseDown);
    };
  });

  return (
    <div ref={ref} role="group" aria-labelledby={titleId} className={PANEL_CARD}>
      <div className={PANEL_HEAD}>
        <h2 id={titleId} className={PANEL_HEADING}>
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
