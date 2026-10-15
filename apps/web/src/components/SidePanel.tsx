import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { CARD, cx, PANEL_ACTIVE, PANEL_TITLE } from '../lib/recipes';
import { Button } from './Button';
import { CloseIcon } from './icons';

export interface SidePanelProps {
  title: string;
  /**
   * The part under the title row: one short control, which a host that makes the card a subgrid
   * sets level with its box (TableLayout from md), as the calculator's display is.
   */
  lead: ReactNode;
  children: ReactNode;
  /** The close button, and Escape inside the panel. */
  onClose: () => void;
  /** Move focus into it when it mounts, which is what opening does. False for gallery samples. */
  focusOnOpen?: boolean;
}

/** The controls the arrows move between, by row: a strip of choices (`data-strip`) is one row. */
function rowsIn(panel: HTMLElement): HTMLElement[][] {
  const rows: HTMLElement[][] = [];
  let strip: Element | null = null;
  for (const control of panel.querySelectorAll<HTMLElement>('button, input')) {
    if (control.matches(':disabled')) continue;
    const own = control.closest('[data-strip]');
    if (own && own === strip) rows.at(-1)?.push(control);
    else rows.push([control]);
    strip = own;
  }
  return rows;
}

/** Where focus lands on a row: a strip of radios' chosen one, else its first control. */
function stopOf(row: readonly HTMLElement[]): HTMLElement | undefined {
  return row.find((control) => control instanceof HTMLInputElement && control.checked) ?? row[0];
}

/**
 * A side panel of settings (docs/DESIGN-SYSTEM.md, "Side panels"): a card like the calculator's,
 * its title row with a close button, a lead part, then the rest. Not modal: the page stays in
 * reach, clicking elsewhere leaves it open, and Tab moves on past it. While focus is inside, its
 * edge turns accent (PANEL_ACTIVE) and its keys stay in it: ↑ and ↓ move between its rows, a strip
 * of choices one row, never past the first or the last; ← and → move within a strip (a radio
 * strip's own arrows choose as they go); Enter works a checkbox or a radio as Space does; Escape
 * is the caller's (close, focus back on its button). Typing that lands in the box is the host's
 * (TableLayout). Opening moves focus onto its first control after the close button.
 */
export function SidePanel({ title, lead, children, onClose, focusOnOpen = true }: SidePanelProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!focusOnOpen || !panel) return;
    const rows = rowsIn(panel);
    stopOf(rows[1] ?? rows[0] ?? [])?.focus();
  }, [focusOnOpen]);

  // Native listeners: the card is not itself interactive. In a layout effect, so a key pressed
  // straight after another finds the latest onClose.
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      const input = target instanceof HTMLInputElement ? target : null;
      if (event.key === 'Enter' && (input?.type === 'checkbox' || input?.type === 'radio')) {
        event.preventDefault();
        input.click();
        return;
      }
      const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      const across = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      if (!vertical && !across) return;
      const rows = rowsIn(panel);
      const at = rows.findIndex((row) => row.includes(target));
      const row = rows[at];
      if (!row) return;
      if (vertical) {
        event.preventDefault();
        const next = rows[at + (event.key === 'ArrowDown' ? 1 : -1)];
        if (next) stopOf(next)?.focus();
        return;
      }
      // A radio strip's own ← and → move and choose; a strip of toggles moves without changing.
      if (input?.type === 'radio' || row.length < 2) return;
      event.preventDefault();
      row[row.indexOf(target) + (event.key === 'ArrowRight' ? 1 : -1)]?.focus();
    };
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
      <div className="grid content-center">{lead}</div>
      <div className="mt-2 grid gap-3">{children}</div>
    </div>
  );
}
