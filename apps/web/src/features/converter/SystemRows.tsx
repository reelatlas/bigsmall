import type { UnitPreference } from '@bigsmall/core';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { Button } from '../../components/Button';
import { GripIcon } from '../../components/icons';
import { TriCheckbox } from '../../components/TriCheckbox';
import { cssTime } from '../../lib/css-time';
import { cx, OPTION_ROW } from '../../lib/recipes';
import {
  byHand,
  orderOf,
  SECTION_LABEL,
  systemState,
  withOrder,
  withSystem,
  type SectionKey,
  type Settings,
} from './settings';

/** How far a press on a handle travels before it is a drag rather than a click, in CSS pixels. */
const DRAG_START = 4;

/**
 * The Move menu, drawn as a segmented control is (SegmentedControl; Sean, 2026-10-15): its two
 * moves joined in one strip under the handle, no gutter, each seam drawn once (a move's left edge
 * clear over its neighbour's line), and the move with focus turning its own edge the focus color,
 * lifted over its neighbour, so the highlight is the strip's edge itself, never a ring inside it.
 */
const MOVE_MENU = 'absolute top-full right-0 z-20 flex rounded-md bg-surface shadow-md';
const MOVE =
  'flex min-h-11 items-center justify-center border-2 border-edge border-l-transparent bg-surface bg-clip-padding px-4 text-sm font-medium text-ink not-first:-ml-0.5 first:rounded-l-md first:border-l-edge last:rounded-r-md hover:bg-surface-raised aria-disabled:text-ink-muted focus-visible:relative focus-visible:z-10 focus-visible:border-focus focus-visible:outline-0';

/**
 * A system's row. The row being moved is marked alike however it moves (Sean, 2026-10-15): dragged,
 * or with its Move menu open, it is lifted over the others, filled, with a shadow; with focus in
 * it from the keys (Alt and an arrow), the whole row fills, its handle too, as a cursor row does.
 */
const ROW = cx(
  'relative flex items-center rounded-nested-md has-focus-visible:bg-surface-raised',
  'data-dragging:z-10 data-dragging:bg-surface-raised data-dragging:shadow-sm',
  'data-moving:z-10 data-moving:bg-surface-raised data-moving:shadow-sm',
);

interface Drag {
  key: SectionKey;
  /** Where the press started, and where the pointer is now, on the screen. */
  startY: number;
  y: number;
  /** The row's place in the list when the press started (offsetTop, which ignores the transform). */
  top: number;
  moved: boolean;
}

export interface SystemRowsProps {
  settings: Settings;
  preference: UnitPreference;
  onSettings: (update: (settings: Settings) => Settings) => void;
}

/**
 * Units' systems (docs/UX-SPEC.md §1, §3; Sean, 2026-10-15), one row each in the order the table's
 * sections follow in every category: a checkbox over the system (a dash while some of its units are
 * chosen on their own) and, at the row's end, a handle to reorder it by. Dragging the handle moves
 * the row, the others sliding out of its way and the table's sections gliding to match; a press on
 * the handle without dragging opens Move up and Move down, the way to reorder without dragging
 * (WCAG 2.5.7), by pointer or by key; and Alt+↑ or Alt+↓ on a row moves it at once. Each move is
 * said in a status line ("Metric, 2 of 4"). A drag by touch never scrolls the page: the handle
 * takes the pointer (`touch-none`, pointer capture).
 */
export function SystemRows({ settings, preference, onSettings }: SystemRowsProps) {
  const order = orderOf(settings, preference);
  const { rule } = settings;
  const listRef = useRef<HTMLDivElement>(null);
  const [menuFor, setMenuFor] = useState<SectionKey | null>(null);
  const [said, setSaid] = useState('');
  const drag = useRef<Drag | null>(null);
  /** The click that ends a drag opens no menu. */
  const dragged = useRef(false);
  /** Where each row sat before a move, so the rows that moved can slide from there. */
  const before = useRef<Map<string, number> | null>(null);
  /** Set as the menu opens, for the effect below to put focus in it. */
  const focusMenu = useRef(false);
  /**
   * What had focus as a row moved. Reordering moves the row's element in the page, and a browser
   * drops focus from whatever is inside an element it moves, so the effect below gives it back:
   * the checkbox after Alt and an arrow, the Move button after a move from the menu (Sean,
   * 2026-10-15; docs/LEARNINGS.md, "Moving an element drops the focus inside it").
   */
  const refocus = useRef<HTMLElement | null>(null);

  const rowOf = (key: SectionKey) =>
    listRef.current?.querySelector<HTMLElement>(`[data-system="${key}"]`) ?? null;
  const rows = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[data-system]') ?? [])];

  /** A system moved to place `to`; `said` is whether to say where it went. */
  const place = (key: SectionKey, to: number, say: boolean) => {
    const last = order.length - 1;
    const target = Math.min(Math.max(to, 0), last);
    if (target === order.indexOf(key)) return;
    before.current = new Map(
      rows().map((row) => [row.dataset.system ?? '', row.getBoundingClientRect().top]),
    );
    const active = document.activeElement;
    refocus.current =
      active instanceof HTMLElement && listRef.current?.contains(active) ? active : null;
    onSettings((now) => withOrder(now, key, target, preference));
    if (say) setSaid(`${SECTION_LABEL[key]}, ${target + 1} of ${order.length}`);
  };

  /** The dragged row follows the pointer from wherever its place in the list now is. */
  const follow = (row: HTMLElement, now: Drag) => {
    row.style.transform = `translateY(${now.y - now.startY - (row.offsetTop - now.top)}px)`;
  };

  // After a move: the rows that moved slide from where they were (the theme's base pace, its even
  // curve; nothing under reduced motion), and a dragged row keeps to the pointer. After every
  // render, doing nothing unless a move set where the rows were.
  useLayoutEffect(() => {
    const was = before.current;
    const list = listRef.current;
    const focused = refocus.current;
    before.current = null;
    refocus.current = null;
    if (focused?.isConnected && document.activeElement !== focused) {
      focused.focus({ preventScroll: true });
    }
    if (!was || !list) return;
    const style = getComputedStyle(list);
    const duration = cssTime(style.getPropertyValue('--motion-base'));
    for (const row of rows()) {
      const key = row.dataset.system as SectionKey;
      const now = drag.current;
      if (now?.moved && now.key === key) {
        follow(row, now);
        continue;
      }
      const from = was.get(key);
      const shift = from === undefined ? 0 : from - row.getBoundingClientRect().top;
      if (!duration || Math.abs(shift) < 0.5 || typeof row.animate !== 'function') continue;
      row.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], {
        duration,
        easing: style.getPropertyValue('--motion-glide'),
      });
    }
  });

  // An open Move menu closes on a press anywhere else.
  useEffect(() => {
    if (!menuFor) return undefined;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!rowOf(menuFor)?.contains(event.target as Node)) setMenuFor(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  });

  // Opened, the menu takes focus on the move there is room for.
  useLayoutEffect(() => {
    if (!focusMenu.current || !menuFor) return;
    focusMenu.current = false;
    const buttons = [...(rowOf(menuFor)?.querySelectorAll<HTMLElement>('[data-move]') ?? [])];
    (buttons.find((button) => !button.hasAttribute('aria-disabled')) ?? buttons[0])?.focus();
  });

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, key: SectionKey) => {
    if (event.button !== 0) return;
    const row = rowOf(key);
    if (!row) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      key,
      startY: event.clientY,
      y: event.clientY,
      top: row.offsetTop,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const now = drag.current;
    if (!now) return;
    if (!now.moved && Math.abs(event.clientY - now.startY) < DRAG_START) return;
    const row = rowOf(now.key);
    if (!row) return;
    if (!now.moved) {
      now.moved = true;
      row.dataset.dragging = '';
      setMenuFor(null);
    }
    now.y = event.clientY;
    // Its place: one further for each other row whose middle the pointer has passed.
    const to = rows()
      .filter((other) => other !== row)
      .filter((other) => {
        const box = other.getBoundingClientRect();
        return event.clientY > box.top + box.height / 2;
      }).length;
    place(now.key, to, false);
    follow(row, now);
  };

  const onPointerEnd = () => {
    const now = drag.current;
    drag.current = null;
    if (!now?.moved) return;
    dragged.current = true;
    const row = rowOf(now.key);
    if (!row) return;
    delete row.dataset.dragging;
    // It settles into its place from where it was let go.
    const offset = row.style.transform;
    row.style.transform = '';
    const style = getComputedStyle(row);
    const duration = cssTime(style.getPropertyValue('--motion-base'));
    if (duration && offset && typeof row.animate === 'function') {
      row.animate([{ transform: offset }, { transform: 'none' }], {
        duration,
        easing: style.getPropertyValue('--motion-glide'),
      });
    }
    setSaid(`${SECTION_LABEL[now.key]}, ${order.indexOf(now.key) + 1} of ${order.length}`);
  };

  // The rows' keys, one native listener on the list (the rows are not themselves interactive):
  // Alt+↑ and Alt+↓ move the row focus is in, focus staying where it was; an open Move menu keeps
  // the keys until Escape closes it, focus back on its handle: Tab and the arrows go between Move
  // up and Move down and never out (Sean, 2026-10-15), all before the panel takes them. In a
  // layout effect, so a key pressed straight after another finds the latest order.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as Element;
      const row = target.closest<HTMLElement>('[data-system]');
      const key = row?.dataset.system as SectionKey | undefined;
      if (!row || !key) return;
      const menu = target.closest<HTMLElement>('[data-move-menu]');
      if (menu) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setMenuFor(null);
          row.querySelector<HTMLElement>('button[aria-expanded]')?.focus();
          return;
        }
        const [up, down] = [...menu.querySelectorAll<HTMLElement>('[data-move]')];
        const next = {
          ArrowLeft: up,
          ArrowUp: up,
          Home: up,
          ArrowRight: down,
          ArrowDown: down,
          End: down,
          Tab: target === up ? down : up,
        }[event.key];
        if (next && !event.altKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          next.focus();
          return;
        }
      }
      const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !step) return;
      event.preventDefault();
      place(key, order.indexOf(key) + step, true);
    };
    list.addEventListener('keydown', onKeyDown);
    return () => list.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div ref={listRef} className="grid">
      {order.map((key, at) => {
        // A dash while some of the system's units are chosen on their own; a press on a dash or a
        // clear box shows them all, on a checked one hides them all.
        const state = systemState(rule, key, preference);
        const label = SECTION_LABEL[key];
        const open = menuFor === key;
        return (
          <div
            key={key}
            data-system={key}
            data-strip
            data-moving={open || undefined}
            className={ROW}
          >
            <label className={cx(OPTION_ROW, 'min-w-0 flex-1 gap-2')}>
              <TriCheckbox
                state={state}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                onChange={() =>
                  onSettings((now) =>
                    byHand(now, withSystem(now.rule, key, state !== 'all', preference)),
                  )
                }
              />
              {label}
            </label>
            <Button
              variant="ghost"
              square
              nested="md"
              aria-label={`Move ${label}`}
              aria-expanded={open}
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
              title={`Move ${label}: drag, or press for Move up and Move down`}
              className="cursor-grab touch-none focus-ring-inset active:cursor-grabbing"
              onPointerDown={(event) => onPointerDown(event, key)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                focusMenu.current = !open;
                setMenuFor(open ? null : key);
              }}
            >
              <GripIcon />
            </Button>
            {open && (
              <div
                role="group"
                aria-label={`Move ${label}`}
                data-strip
                data-move-menu
                className={MOVE_MENU}
              >
                <button
                  type="button"
                  className={MOVE}
                  data-move
                  aria-disabled={at === 0 || undefined}
                  onClick={() => place(key, at - 1, true)}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className={MOVE}
                  data-move
                  aria-disabled={at === order.length - 1 || undefined}
                  onClick={() => place(key, at + 1, true)}
                >
                  Move down
                </button>
              </div>
            )}
          </div>
        );
      })}
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
