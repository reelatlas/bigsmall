import { formatClock, formatNumber, getUnit, ingredients, type CategoryId } from '@bigsmall/core';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { CategoryMenu } from '../../components/CategoryMenu';
import { CategoryTiles } from '../../components/CategoryTiles';
import { ConversionTable, type ConversionTableProps } from '../../components/ConversionTable';
import { UnitMatches } from '../../components/UnitMatches';
import { ValueField } from '../../components/ValueField';
import { track } from '../../lib/analytics';
import { pressedByTouch } from '../../lib/modality';
import { rowsIn, stopOf } from '../../lib/panel-keys';
import { stepPlane } from '../../lib/planes';
import { STARTS_TYPING } from '../../lib/typing';
import { evaluatedText } from './calculator';
import { byHand, orderOf, sectionsOf, shows, withChoice, type Settings } from './settings';
import {
  ingredientList,
  noMatchMessage,
  type BoxView,
  type HistoryAction,
  type TableRow,
  type TableView,
} from './state';
import type { ConverterEnv } from './useConverter';

/**
 * The converter from md (docs/UX-SPEC.md §1): the toolbar, the box, and its table in the first
 * column, and the side panel open (the calculator, Units, or Display) in a column of its own on
 * their right, its top level with the box's (Sean, 2026-10-15). It spans the box's row, the
 * table's, and the last, 1fr, which takes whatever of it is taller than the box and the table, so
 * the table always sits right under the box. Below md the side panel opens between the box and the
 * table, flush left.
 */
const TABLE_GRID =
  'md:grid md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto_auto_1fr] md:gap-x-4';
/** The toolbar's cell, as wide as the box. */
const TABLE_TOOLS_CELL = 'max-w-xl md:col-start-1 md:row-start-1';
/**
 * The toolbar row (Sean, 2026-10-10 and 15): the category menu, the calculator, Units, and
 * Display at its left, the menu's edge on the box's, with no dividers between them; undo, redo,
 * and clear all at its right end. Where the row has no room for both, undo, redo, and clear all
 * keep the top line and the leading four wrap under it, both lines flush left over the box, on a
 * phone or a narrow window alike, with no breakpoint: the leading four come first in the markup,
 * `flex-wrap-reverse` stacks a wrapped row's first line at the bottom, and `justify-between` puts
 * the two groups at the ends of a shared line and a group alone on its line at its start. The
 * browser's own fit decides, in every theme.
 */
const TABLE_TOOLS_ROW = 'mb-2 flex flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2';
const TABLE_LEADING = 'flex items-center gap-1';
/**
 * The right end's tools: their outer edges on the box's (the last button's at the row's right end,
 * or the first's at its left once they have a line of their own), so a filled one (switched on,
 * hovered) lines up with the box and the table, its glyph inside the column as their text is.
 */
const TABLE_TOOLS = 'flex shrink-0 items-center gap-1';
/**
 * The box's cell, stuck to the window's top while the table scrolls where the window is tall enough
 * (`data-stick` on the layout, measured below; a trial, Sean, 2026-10-17): the canvas behind it,
 * and a strip of canvas under it as deep as the gap to the table (`after:h-2`, the rows cell's
 * `mt-2`), cover the rows passing under; the strip's lower edge is a rule only while the box is
 * stuck (`data-stuck`). Drawn by a pseudo-element, so the cell keeps the box's own size. Over a
 * section's name (STUCK_HEADING, 5) and under an open shell (SHELL, 20).
 */
const TABLE_BOX_CELL =
  'relative z-10 max-w-xl bg-canvas group-data-stick/stick:sticky group-data-stick/stick:top-0 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-2 after:border-b after:border-transparent after:bg-canvas data-stuck:after:border-line md:col-start-1 md:row-start-2';
/**
 * 8 px under the box, its popup, as the toolbar sits 8 px over it; a container, so the categories
 * go four across once it has the room. Under an open side panel (below md) the panel's own 16 px
 * wins, the two margins collapsing.
 */
const TABLE_ROWS_CELL = '@container mt-2 max-w-xl md:col-start-1 md:row-span-2 md:row-start-3';
/**
 * Where a side panel opens (docs/DESIGN-SYSTEM.md, "Side panels"): 16 px from the box and from the
 * table, a panel apart, at most 384 px wide. From md, a column of its own, 320 px wide, room for
 * Units' four presets on one line (Sean, 2026-10-15), its top on the box's, as tall as its card
 * (`self-start`).
 */
const TABLE_SIDE_CELL =
  'isolate my-4 max-w-sm md:col-start-2 md:row-span-3 md:row-start-2 md:my-0 md:w-80 md:self-start';

/**
 * Keys that type into the field from a control beside it (a toolbar's, the chip, a copy button):
 * any character, or Backspace. Not Space, which presses the control.
 */
function typesIntoField(event: globalThis.KeyboardEvent): boolean {
  return event.key === 'Backspace' || (event.key.length === 1 && event.key !== ' ');
}

/**
 * Categories whose values go below zero as often as not (-40 °C, -90°): the box keeps the full
 * keyboard there, since a phone's number pad has no minus (docs/UX-SPEC.md §1).
 */
const SIGNED: ReadonlySet<CategoryId> = new Set(['temperature', 'angle']);

/** Which list the table's place shows, for a cursor to belong to: the start, the matches, or one category's units. */
function viewKeyOf(view: TableView): string {
  return view.kind === 'units' ? `units:${view.category}` : view.kind;
}

export interface TableLayoutProps {
  /** The tools after the category menu: the calculator, Units, and Display. */
  leadingTools: ReactNode;
  /** The toolbar's right end: undo, redo, and clear all. */
  tools: ReactNode;
  /** What shows and how it looks (settings.ts). */
  settings: Settings;
  onSettings: (update: (settings: Settings) => Settings) => void;
  /** The field's input, which the host also focuses (clear all puts the caret back in it). */
  inputRef: RefObject<HTMLInputElement>;
  /** The box, as the field shows it. */
  box: BoxView;
  table: TableView;
  env: ConverterEnv;
  dispatch: (action: HistoryAction) => void;
  /** Id of the converter's intro, which describes the field. */
  describedBy: string;
  /**
   * The side panel open, one at a time (the calculator, Units, or Display): between the box and
   * the table, or beside them from md.
   */
  side: ReactNode;
  sideId: string;
  /**
   * Whether typing in the side panel lands in the field, as from the toolbar: so for a settings
   * panel; the calculator keeps its keys.
   */
  sideTypes: boolean;
  /** The row whose copy button shows the check, by unit id. */
  copiedRow: string | null;
  onCopyRow: (unitId: string) => void;
  copyRowProps: NonNullable<ConversionTableProps<TableRow>['copyProps']>;
}

/**
 * The box and what it lists (ADR 0012, ADR 0013, docs/UX-SPEC.md §1, §8, §9): the toolbar row,
 * led by the category menu, the field, and in the table's place the categories to start from,
 * the category's units with their values, or the units a typed query matches. The table is the
 * unit list: the caret stays in the field while a cursor the field points at
 * (aria-activedescendant) moves through whatever the table's place shows, the arrows going on past
 * the field and the last row to the page's other planes (ADR 0014). Typing anywhere in the layout,
 * or with nothing focused on the page, lands in the field; Escape steps back one thing at a time,
 * from browsing the table to an empty page.
 */
export function TableLayout({
  leadingTools,
  tools,
  settings,
  onSettings,
  inputRef,
  box,
  table: selected,
  env,
  dispatch: send,
  describedBy,
  side,
  sideId,
  sideTypes,
  copiedRow,
  onCopyRow,
  copyRowProps,
}: TableLayoutProps) {
  const listId = useId();
  const hiddenListId = `${listId}-hidden`;
  const itemId = (index: number) => `${listId}-item-${index}`;
  /**
   * Cooking's ingredients, listed in the table's place while the ingredient's pill holds them open
   * (a trial, Sean, 2026-10-16): the box's popup lists them under their kinds, as it lists the
   * units, the one in the box marked. Taking one, typing, Escape, or the pill again closes it.
   */
  const [choosingFor, setChoosingForState] = useState<string | null>(null);
  const choosing =
    choosingFor !== null &&
    choosingFor === box.ingredient?.id &&
    selected.kind === 'units' &&
    selected.category === 'cooking';
  const table: TableView = choosing ? ingredientList(selected, box.ingredient) : selected;
  const rootRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  /**
   * The box's top before a change of the table, for the layout effect that keeps the page to it
   * after (below): whatever the table is swapped for, the box stays where it was on the screen
   * (docs/UX-SPEC.md §5). Every change goes through `dispatch` or the pill's open, which note it.
   */
  const anchored = useRef<number | null>(null);
  const anchor = () => {
    anchored.current = fieldRef.current?.getBoundingClientRect().top ?? null;
  };
  const dispatch = (action: HistoryAction) => {
    anchor();
    send(action);
  };
  const setChoosingFor = (value: string | null) => {
    anchor();
    setChoosingForState(value);
  };

  /**
   * Where the cursor is, in the view it was set in, so a change from outside (undo, clear all, a
   * send from the calculator) brings it back to rest. A null position rests on the unit in the
   * box, so the arrows move on from its row, or on the field when the table does not list one;
   * -1 is the field, reached with the arrows; 0 and up, a row, a match, or a category tile.
   */
  const viewKey = viewKeyOf(table);
  const [cursor, setCursor] = useState<{ view: string; position: number | null }>({
    view: viewKey,
    position: null,
  });
  const position = cursor.view === viewKey ? cursor.position : null;
  const setPosition = (next: number | null) => setCursor({ view: viewKey, position: next });
  /** Set when typing elsewhere lands in the field: the caret goes after the text it added. */
  const caretToEnd = useRef(false);
  /**
   * Set when the ingredient's pill opens its list: the cursor lands on the ingredient in the box
   * without the page scrolling to its row, which would carry the box away (Sean, 2026-10-16).
   */
  const holdScroll = useRef(false);
  /** Set when a pick puts the table where a list was: the box comes back into view. */
  const showBox = useRef(false);
  /**
   * Whether the caret came into the field with a tap, so a touch screen's keyboard is up: its
   * Enter, labelled Done, puts the keyboard away once it has done its job (ADR 0015).
   */
  const tappedIn = useRef(false);
  /** Edit, in the category it was started in: a new category ends it. */
  const [editingIn, setEditingIn] = useState<string | null>(null);
  const editing = table.kind === 'units' && editingIn === table.category;
  const [hiddenOpen, setHiddenOpen] = useState(false);

  /**
   * The box and the section names stay at the window's top while the table scrolls (a trial,
   * Sean, 2026-10-17; docs/UX-SPEC.md §1). The box's measured height says where a name sticks
   * under it, a pixel under the box's edge (docs/LEARNINGS.md, "Stacked sticky headers"), and
   * nothing sticks where the window is shorter than the box, a name, and three rows together (a
   * phone on its side, 400% zoom), so the table stays usable. Measured, never counted.
   */
  const [stick, setStick] = useState({ top: 0, gap: 0, on: false });
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const cell = fieldRef.current;
    if (!cell || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const box = cell.getBoundingClientRect().height;
      const place = placeRef.current;
      // The gap between the box and the table, which the stuck box's strip covers.
      const gap = place ? parseFloat(getComputedStyle(place).marginTop) || 0 : 0;
      const heading =
        place?.querySelector('[data-section], [role="group"] > *')?.getBoundingClientRect()
          .height ?? 0;
      const row =
        place?.querySelector('[data-row], [role="option"]')?.getBoundingClientRect().height ?? 0;
      const on = window.innerHeight >= box + gap + heading + 3 * row;
      setStick((now) =>
        now.top === box && now.gap === gap && now.on === on ? now : { top: box, gap, on },
      );
    };
    measure();
    const resizes = new ResizeObserver(measure);
    resizes.observe(cell);
    window.addEventListener('resize', measure);
    return () => {
      resizes.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  // Whether a side panel sits between the box and the table (below md) rather than beside them:
  // its rows' small checkboxes would pass under a stuck box. Measured from the layout.
  const [sideBelow, setSideBelow] = useState(false);
  const hasSide = !!side;
  useLayoutEffect(() => {
    const measure = () => {
      const panel = sideRef.current;
      const field = fieldRef.current;
      setSideBelow(
        !!panel &&
          !!field &&
          panel.getBoundingClientRect().top >= field.getBoundingClientRect().bottom - 1,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [hasSide]);
  /**
   * The box sticks while the table is what scrolls under it, and lets go while Edit is on, Hidden
   * is open, or a settings panel sits between the box and the table: their rows' 16 px checkboxes
   * would pass under the stuck box within a target's safe space of the field (axe's target-size),
   * and none of those is reading the table.
   */
  const sticking = stick.on && !editing && !hiddenOpen && !sideBelow;
  // A section's name sticks a pixel under the strip's lower edge (the box, then its gap).
  const stickTop = sticking ? stick.top + stick.gap - 1 : undefined;
  // The rule under the box only while it is stuck: a pixel set 2 px over the cell's top edge leaves
  // the window exactly then (at 1 px it would touch the window's edge, which still counts as
  // intersecting).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const watcher = new IntersectionObserver(([entry]) =>
      setStuck(sticking && !!entry && !entry.isIntersecting),
    );
    watcher.observe(sentinel);
    return () => watcher.disconnect();
  }, [sticking]);
  /**
   * Edit ends, as Done ends it, when the box changes (typing in it, or typing from the table that
   * lands in it) or Escape is pressed there: back in the box, converting is the job again.
   */
  const endEdit = () => {
    setEditingIn(null);
    setHiddenOpen(false);
  };
  /** The hidden matches shown, for the query they were shown for: a new query hides them again. */
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const revealed = table.kind === 'matches' && revealedFor === table.query;
  const { rule, display } = settings;

  const number = box.parsed.valueText ?? '';
  const rowCount =
    table.kind === 'units'
      ? table.message || editing
        ? 0
        : table.rows.length
      : table.kind === 'matches'
        ? table.rows.length + (revealed ? table.hidden.length : 0)
        : table.categories.length;
  /**
   * Where the table's foot sits in the cursor's order: after the last row; under the matches,
   * between them and the hidden ones its line lists once shown (Sean, 2026-10-15).
   */
  const foot = table.kind === 'matches' && table.hidden.length > 0 ? table.rows.length : rowCount;
  /** What the field controls: the table's place, or the matches and the hidden ones while they show. */
  const controls =
    table.kind === 'matches'
      ? [table.rows.length > 0 && listId, revealed && table.hidden.length > 0 && hiddenListId]
          .filter(Boolean)
          .join(' ')
      : listId;
  const rest = table.kind === 'units' && box.unit ? table.rows.findIndex((row) => row.inBox) : -1;
  const at = position === null ? rest : Math.min(position, rowCount - 1);
  /** The arrows have moved the cursor into the table's place: Escape first brings it back. */
  const browsing = position !== null && at >= 0;
  const chosen = table.kind === 'start' ? null : table.category;

  /** How many tiles the start's grid shows in a row, as laid out: two, or four with the room. */
  const tilesPerRow = () => {
    const tiles = placeRef.current?.querySelectorAll<HTMLElement>('[data-tile]') ?? [];
    const top = tiles[0]?.offsetTop;
    let count = 0;
    for (const tile of tiles) {
      if (tile.offsetTop !== top) break;
      count += 1;
    }
    return Math.max(count, 1);
  };

  /**
   * Past the field, ↑ goes on to the plane above, the toolbar (ADR 0014), the cursor resting
   * again as focus leaves; below the box there is none, the page's bottom a stop (Sean,
   * 2026-10-15).
   */
  const leaveBox = (step: 1 | -1) => {
    if (inputRef.current) stepPlane(inputRef.current, step);
  };

  /**
   * ↓ past the last row: onto the table's foot (Hidden, or Edit; Show them under the matches),
   * which carries on the box's plane (ADR 0014, Sean 2026-10-15); with no foot, nowhere.
   */
  const toFoot = () => {
    const first = placeRef.current ? stopOf(rowsIn(placeRef.current)[0]) : undefined;
    if (!first) {
      leaveBox(1);
      return;
    }
    setPosition(null);
    first.focus();
  };

  /**
   * From the foot: ↑ back into the box, the cursor on the row over it; ↓ on to the hidden matches
   * its line lists, the cursor back in the box, else past its end, nowhere.
   */
  const leaveFoot = (step: 1 | -1) => {
    if (step === 1 && foot >= rowCount) {
      leaveBox(1);
      return;
    }
    inputRef.current?.focus();
    setPosition(step === 1 ? foot : foot - 1);
  };

  /**
   * The Escape ladder's steps that change the conversion, one a call: a typed unit, back to the
   * number; the number; in Cooking the ingredient, back to its ingredients to choose from; the
   * unit and the category, back to the start, as clear all does. False when there is nothing left
   * to clear.
   */
  const clearStep = (): boolean => {
    if (table.kind === 'matches' && table.query !== '') dispatch({ type: 'replace', text: number });
    else if (box.text !== '') dispatch({ type: 'replace', text: '' });
    // One pill a step, as Backspace and the pills' own × take them (Sean, 2026-10-16).
    else if (box.ingredient) dispatch({ type: 'removeIngredient' });
    // Cooking's ingredients to choose from count as its table.
    else if (box.unit || table.kind !== 'start') dispatch({ type: 'clear' });
    else return false;
    setPosition(null);
    return true;
  };

  /**
   * Typing that lands in the field from elsewhere: always after what is there, so 554 then 67
   * reads 55467; Backspace takes the last character back; Escape is how to clear.
   */
  const typeIntoField = (key: string) => {
    const input = inputRef.current;
    if (!input) return;
    const text = key === 'Backspace' ? input.value.slice(0, -1) : input.value + key;
    if (editing) endEdit();
    setChoosingFor(null);
    caretToEnd.current = true;
    input.focus();
    dispatch({ type: 'input', text, at: performance.now() });
    setPosition(null);
  };

  // Keys pressed on the layout's other parts: the toolbar, the chip, a copy button, a settings
  // panel. Native listeners: the wrapper is not itself interactive. The calculator keeps its own
  // keys, a settings panel its arrows and Escape (SidePanel), and the toolbar's arrows and Escape
  // are the page's toolbar controller's (layouts/Base.astro).
  // - Escape on the chip or a copy button brings the caret back to the field.
  // - A letter, a digit, or Backspace lands in the field, as typing in a combobox's list does
  //   (WAI-ARIA). Space keeps its own job on a button or a radio.
  // Bound in a layout effect, so a key pressed straight after another finds the latest state.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const input = inputRef.current;
      const target = event.target as Node;
      if (!input || target === input || event.defaultPrevented || event.isComposing) return;
      const parts = sideTypes
        ? [toolsRef, fieldRef, placeRef, sideRef]
        : [toolsRef, fieldRef, placeRef];
      const own = parts.some((part) => part.current?.contains(target));
      if (!own) return;
      if (event.key === 'Escape') {
        if ((target as Element).closest('[data-tool]')) return;
        event.preventDefault();
        input.focus();
        setChoosingFor(null);
        setPosition(null);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!typesIntoField(event)) return;
      event.preventDefault();
      typeIntoField(event.key);
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  });

  // With nothing on the page focused, the page has one job: a key that starts typing (a letter, a
  // digit, `-`, `.`, or `,`) types in the field, ↑ or ↓ goes into it, the next press moving on from there (ADR 0014), and Escape
  // takes the ladder's clearing steps, as it would in the field. Typing only types, never acts;
  // none of it works with focus in another control or with Ctrl, ⌘, or Alt held (WCAG 2.1.4;
  // ADR 0012). An Escape that closed a header menu has done its job already.
  useLayoutEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) {
        // A toolbar's control beyond the layout (the header's) types into the field too, as the
        // converter's own toolbar does.
        const tool = active.matches('[role="toolbar"] [data-tool]');
        if (tool && !rootRef.current?.contains(active) && typesIntoField(event)) {
          event.preventDefault();
          typeIntoField(event.key);
        }
        return;
      }
      if (event.key === 'Escape') {
        if (editing) {
          endEdit();
          event.preventDefault();
        } else if (choosing) {
          setChoosingFor(null);
          event.preventDefault();
        } else if (clearStep()) event.preventDefault();
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        inputRef.current?.focus();
        setPosition(null);
        return;
      }
      if (!STARTS_TYPING.test(event.key)) return;
      event.preventDefault();
      typeIntoField(event.key);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  // Only while the field has focus: after a tap it has none, and setting a selection could bring a
  // touch screen's keyboard back up.
  useLayoutEffect(() => {
    if (!caretToEnd.current) return;
    caretToEnd.current = false;
    const input = inputRef.current;
    if (input && input === document.activeElement) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  // The row the arrows reach stays in view, as the page scrolls; not the row the pill's list opens
  // on, which the page would scroll to and leave the box behind.
  useEffect(() => {
    if (browsing && !holdScroll.current)
      document.getElementById(`${listId}-item-${at}`)?.scrollIntoView({ block: 'nearest' });
  }, [browsing, at, listId]);
  useEffect(() => {
    holdScroll.current = false;
  });

  // After a change of the table, the box back to where it was on the screen, before the page
  // paints: where the virtual DOM removes the table before it inserts what replaces it, a browser
  // that lays the page out in between clamps the scroll to the top and, without scroll anchoring
  // (WebKit, an iPhone), leaves it there (docs/LEARNINGS.md, 2026-10-17). Chromium anchors by
  // itself and finds nothing to do here.
  useLayoutEffect(() => {
    if (anchored.current === null) return;
    const was = anchored.current;
    anchored.current = null;
    const now = fieldRef.current?.getBoundingClientRect().top;
    if (now !== undefined && Math.abs(now - was) >= 1) window.scrollBy(0, now - was);
  });

  // After a pick that put the table where a list was (typed matches, Cooking's ingredients, the
  // category tiles), the box comes back into view where the list had scrolled it off (Sean,
  // 2026-10-16): the list in the page is the box's listbox, and a listbox never leaves its box
  // behind. A pick in the table itself keeps the page where it is: its rows stay put.
  useLayoutEffect(() => {
    if (!showBox.current) return;
    showBox.current = false;
    const field = fieldRef.current;
    const place = placeRef.current;
    if (!field || !place) return;
    field.scrollIntoView({ block: 'nearest' });
    // Under a stuck box, the table's own top comes out from behind it; measured, since a browser's
    // "nearest" with a scroll margin landed it 35 px short.
    const behind = place.getBoundingClientRect().top - (sticking ? stick.top + stick.gap : 0);
    if (behind < 0) window.scrollBy(0, behind);
  });

  /**
   * A category chosen: the box keeps its number and its units list with none chosen and none
   * highlighted, the caret waiting in the field for ↓, Enter, or a click; the box's own category
   * keeps its unit, the cursor resting on it.
   */
  const chooseCategory = (category: CategoryId) => {
    dispatch({ type: 'chooseCategory', category });
    setPosition(null);
  };

  /** Units shown or hidden on their own, from Edit, the Hidden list, or a hidden unit taken. */
  const choose = (rows: readonly Pick<TableRow, 'unit'>[], show: boolean) =>
    onSettings((now) =>
      byHand(
        now,
        withChoice(
          now.rule,
          rows.map((row) => row.unit),
          show,
          env.system,
        ),
      ),
    );

  /** A unit taken into the box, with its new text; the category follows, and the cursor rests on its row. */
  const take = (unitId: string, text: string, ingredient?: string) => {
    dispatch(
      ingredient === undefined
        ? { type: 'use', unit: unitId, text }
        : { type: 'use', unit: unitId, text, ingredient },
    );
    // Which units people convert in, counted as each is taken (ADR 0019).
    track('Unit chosen', { category: getUnit(unitId)?.category ?? '', unit: unitId });
    setPosition(null);
    caretToEnd.current = true;
  };

  /**
   * An ingredient taken into the box (ADR 0021), with the unit typed before it when its match
   * brought one ("2 cups flour"), the number as typed: Cooking's table.
   */
  const takeIngredient = (ingredient: string, unitId: string | null) => {
    setChoosingFor(null);
    // The one in the box, taken again from the list its pill opened: nothing changes, nothing to undo.
    if (choosing && !unitId && ingredient === box.ingredient?.id) {
      setPosition(null);
      return;
    }
    if (unitId) take(unitId, number, ingredient);
    else {
      dispatch({ type: 'useIngredient', ingredient, text: number });
      setPosition(null);
      caretToEnd.current = true;
    }
    track('Ingredient chosen', { ingredient });
  };

  /**
   * Enter or a click on what the cursor is on. A row of the units moves into the box with its
   * value, to the 10 digits a box shows, as if it had been typed, or with the number as typed
   * while the rows are dashes; a match moves in with the number as typed; a category, a tile or
   * a match, opens it.
   */
  const takeRow = (index: number) => {
    if (table.kind === 'start') {
      const category = table.categories[index];
      if (!category) return;
      showBox.current = true;
      chooseCategory(category.id);
    } else if (table.kind === 'matches') {
      const match = table.rows[index];
      // A hidden unit taken from search leaves Hidden, as if checked there, so clearing the box
      // never hides it again (Sean, 2026-10-10).
      const hiddenMatch = revealed ? table.hidden[index - table.rows.length] : undefined;
      if (!match && !hiddenMatch) return;
      showBox.current = true;
      if (match?.kind === 'unit') take(match.unit.id, number);
      else if (match?.kind === 'ingredient') {
        takeIngredient(match.ingredient.id, match.unit?.id ?? null);
      } else if (match) chooseCategory(match.category.id);
      else if (hiddenMatch) {
        choose([hiddenMatch], true);
        take(hiddenMatch.unit.id, number);
      }
    } else {
      const row = table.rows[index];
      if (!row || row.tone === 'message') return;
      if (row.inBox) setPosition(null);
      // Its unit: a change row's is its scale's (Temperature's As a change).
      else if (row.value === null) take(row.unit.id, number);
      // A pace comes into the box as the row writes it, minutes and seconds (5:30).
      else if (row.clock) take(row.unit.id, formatClock(row.value, { locale: env.locale }));
      else take(row.unit.id, formatNumber(row.value, { locale: env.locale }));
    }
  };

  /**
   * A click or tap takes what it is on. After a click the caret is back in the field, for the keys
   * to go on from there; after a tap a touch screen's keyboard stays down, and goes away if it was
   * up, so the table being picked from stays in view (ADR 0015).
   */
  const pick = (index: number) => {
    takeRow(index);
    // The page moves only for a list replaced (the layout effect above), never for the caret.
    if (pressedByTouch()) inputRef.current?.blur();
    else inputRef.current?.focus({ preventScroll: true });
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (editing) endEdit();
    setChoosingFor(null);
    dispatch({
      type: 'input',
      text: event.currentTarget.value,
      at: performance.now(),
    });
    setPosition(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/⌘+C copies the row whose copy button shows for the keys, as the row shows it: the
      // cursor's, or resting, the box's unit's, as after Enter took it (Sean, 2026-10-15). Text
      // selected in the field is the field's own to copy. Undo and redo are the converter's.
      if (event.key.toLowerCase() !== 'c' || table.kind !== 'units') return;
      const field = event.currentTarget;
      if (field.selectionStart !== field.selectionEnd) return;
      const row = browsing ? table.rows[at] : table.rows.find((each) => each.inBox);
      if (row?.tone !== 'value') return;
      event.preventDefault();
      onCopyRow(row.id);
      return;
    }
    // The start's categories are a grid: ← → move across it once the cursor is in it; in the
    // field they move the caret as ever.
    const grid = table.kind === 'start' && browsing;
    const step = grid ? tilesPerRow() : 1;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        if (!grid) return;
        event.preventDefault();
        const next = at + (event.key === 'ArrowRight' ? 1 : -1);
        setPosition(Math.min(Math.max(next, 0), rowCount - 1));
        return;
      }
      case 'ArrowDown': {
        // From the field down every row, each step from where the cursor is (the unit in the box
        // while it rests there), onto the table's foot where it sits, on through the hidden
        // matches its line lists, and past the last nowhere: the page's bottom.
        event.preventDefault();
        const next = at < 0 ? 0 : at + step;
        if (at < foot && next >= foot) toFoot();
        else if (next < rowCount) setPosition(next);
        else leaveBox(1);
        return;
      }
      case 'ArrowUp':
        event.preventDefault();
        // From the first hidden match up onto the foot's line over it.
        if (at >= 0 && at === foot) toFoot();
        else if (at >= 0) setPosition(at - step >= 0 ? at - step : -1);
        else leaveBox(-1);
        return;
      case 'Enter': {
        // On a row, take it. In the field: a typed unit takes its best match; arithmetic becomes
        // its value; with a unit the cursor comes back to rest on it; without one, Enter goes
        // into the table, to pick a category or a unit.
        event.preventDefault();
        const worked = evaluatedText(box.text, env);
        if (browsing) takeRow(at);
        // A typed unit takes its best match; Cooking's ingredients, listed to choose from, are
        // gone into, as a category's units are.
        else if (table.kind === 'matches' && table.query !== '') takeRow(0);
        else if (table.kind === 'matches') setPosition(0);
        else if (worked !== null) dispatch({ type: 'replace', text: worked });
        else if (box.unit) setPosition(null);
        else if (rowCount > 0) setPosition(0);
        // On a touch screen's keyboard Enter reads Done: what it did stands, and the keyboard goes
        // away, so the table shows (ADR 0015).
        if (tappedIn.current) inputRef.current?.blur();
        return;
      }
      case 'Escape':
        // One step at a time: back from browsing the table, then the clearing steps, then it
        // lets go, leaving just the page. Right after Enter the cursor only rests, so the first
        // Escape already clears.
        event.preventDefault();
        if (editing) endEdit();
        else if (choosing) {
          setChoosingFor(null);
          setPosition(null);
        } else if (browsing) {
          setPosition(null);
          inputRef.current?.scrollIntoView({ block: 'nearest' });
        } else if (!clearStep()) inputRef.current?.blur();
        return;
      case 'Backspace':
        // On an empty field, Backspace takes the last pill out, as its × does: the ingredient,
        // then the unit.
        if ((box.ingredient || box.unit) && event.currentTarget.value === '') {
          event.preventDefault();
          dispatch(box.ingredient ? { type: 'removeIngredient' } : { type: 'unlock' });
          setPosition(null);
        }
        return;
    }
  };

  const place =
    table.kind === 'start' ? (
      <CategoryTiles
        id={listId}
        categories={table.categories}
        cursor={browsing ? at : -1}
        itemId={itemId}
        onPick={pick}
      />
    ) : table.kind === 'matches' ? (
      <UnitMatches
        id={listId}
        hiddenId={hiddenListId}
        matches={table.rows}
        counts={table.counts}
        query={table.query}
        notFound={noMatchMessage(table.query)}
        cursor={browsing ? at : -1}
        itemId={itemId}
        onPick={pick}
        hidden={table.hidden}
        revealed={revealed}
        onReveal={(show) => setRevealedFor(show ? table.query : null)}
        symbolOnly={display.names === 'symbol'}
        onLeave={leaveFoot}
        stickTop={stickTop}
      />
    ) : (
      <ConversionTable<TableRow>
        id={listId}
        title={table.categories.find((category) => category.id === table.category)?.name ?? ''}
        sections={table.sections}
        hidden={table.hidden}
        every={sectionsOf(table.all, env.system, orderOf(settings, env.system))}
        message={table.message}
        display={display}
        locale={env.locale}
        cursor={browsing ? at : -1}
        itemId={itemId}
        copied={copiedRow}
        onPick={pick}
        onCopy={(row) => onCopyRow(row.id)}
        copyProps={copyRowProps}
        editing={editing}
        hiddenOpen={hiddenOpen}
        isShown={(row) => row.inBox || shows(row.unit, rule, env.system)}
        onChoose={choose}
        onEditing={(on) => {
          setEditingIn(on ? table.category : null);
          setPosition(null);
        }}
        onHiddenOpen={setHiddenOpen}
        onLeave={leaveFoot}
        stickTop={stickTop}
      />
    );
  // Under Cooking's table, the line saying what a cup of its ingredient weighs (ADR 0021).
  const note = table.kind === 'units' && table.note && (
    <p className="mt-2 px-2 text-sm text-ink-muted">{table.note}</p>
  );

  // The cursor shows only while focus is in the box or its table: moving to the toolbar, the
  // calculator, or off the page, the cursor rests again.
  return (
    <div
      ref={rootRef}
      className="group/stick"
      data-stick={sticking ? '' : undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        const next = event.relatedTarget as Node | null;
        if (![fieldRef, placeRef].some((part) => part.current?.contains(next))) setPosition(null);
      }}
    >
      <div className={TABLE_GRID}>
        <div className={TABLE_TOOLS_CELL}>
          {/* The converter's toolbar, the page's second plane (ADR 0014): first reached at the menu. */}
          <div
            ref={toolsRef}
            role="toolbar"
            aria-label="Tools"
            className={TABLE_TOOLS_ROW}
            data-plane="tools"
            data-default-tool="category"
          >
            <div className={TABLE_LEADING}>
              <CategoryMenu
                categories={table.categories}
                value={chosen}
                counts={table.kind === 'matches' ? table.counts : undefined}
                tool="category"
                onChoose={(category) => {
                  chooseCategory(category);
                  // After a tap focus stays with the menu, so no keyboard comes up (ADR 0015).
                  if (!pressedByTouch()) inputRef.current?.focus({ preventScroll: true });
                }}
              />
              {leadingTools}
            </div>
            <div className={TABLE_TOOLS}>{tools}</div>
          </div>
        </div>
        <div
          ref={fieldRef}
          className={TABLE_BOX_CELL}
          data-plane="box"
          data-stuck={stuck ? '' : undefined}
          onFocus={(event: FocusEvent<HTMLDivElement>) => {
            if (event.target === inputRef.current) tappedIn.current = pressedByTouch();
          }}
        >
          <div
            ref={sentinelRef}
            aria-hidden="true"
            className="pointer-events-none absolute -top-0.5 h-px w-px"
          />
          <ValueField
            inputRef={inputRef}
            label="Value"
            text={box.text}
            parsed={box.parsed}
            locale={env.locale}
            unit={box.unit}
            ingredient={box.ingredient}
            // What the field takes, never a value it might be mistaken for.
            placeholder={box.unit ? 'Number' : 'Number or unit'}
            describedBy={describedBy}
            popup={{
              expanded: rowCount > 0,
              controls,
              activeId: browsing ? itemId(at) : undefined,
              kind: table.kind === 'units' ? 'grid' : 'listbox',
            }}
            symbolOnly={display.names === 'symbol'}
            // With a unit in the chip the box takes a number alone, so a phone brings up its
            // number pad; with none, letters type a unit ("2 cups"), and the chip's × brings
            // them back (Sean, 2026-10-15).
            numberPad={box.unit !== null && !SIGNED.has(box.unit.category)}
            onChange={onChange}
            onKeyDown={onKeyDown}
            // The field's ×: its text goes and its unit stays, one undoable step, the caret back
            // in the field after a click; after a tap focus stays where it was (ADR 0015).
            onClear={() => {
              dispatch({ type: 'replace', text: '' });
              setPosition(null);
              if (!pressedByTouch()) inputRef.current?.focus({ preventScroll: true });
            }}
            // The chip is a readout here, and part of the box: clicking or tapping it puts the
            // caret in the field, where the arrows reach the units. Its × takes the unit out and
            // keeps the category's table, the caret back in the field after a click, not a tap.
            onChipOpen={() => inputRef.current?.focus({ preventScroll: true })}
            onChipRemove={() => {
              dispatch({ type: 'unlock' });
              setPosition(null);
              if (!pressedByTouch()) inputRef.current?.focus({ preventScroll: true });
            }}
            // The ingredient's pill: its body opens every ingredient in the table's place, the
            // cursor on the one in the box, and closes them again (a trial, Sean, 2026-10-16); the
            // caret goes into the field after a click, not a tap, as the chip's does. Its × takes
            // the ingredient out, leaving a weight or a volume (ADR 0021).
            ingredientOpen={choosing}
            onIngredientOpen={() => {
              const current = box.ingredient?.id ?? null;
              if (choosing || !current) setChoosingFor(null);
              else {
                holdScroll.current = true;
                setChoosingFor(current);
                setCursor({
                  view: 'matches',
                  position: ingredients.findIndex((each) => each.id === current),
                });
              }
              if (!pressedByTouch()) inputRef.current?.focus({ preventScroll: true });
            }}
            onIngredientRemove={() => {
              dispatch({ type: 'removeIngredient' });
              setPosition(null);
              if (!pressedByTouch()) inputRef.current?.focus({ preventScroll: true });
            }}
          />
        </div>
        {side && (
          <div ref={sideRef} id={sideId} className={TABLE_SIDE_CELL}>
            {side}
          </div>
        )}
        <div ref={placeRef} className={TABLE_ROWS_CELL}>
          {place}
          {note}
        </div>
      </div>
    </div>
  );
}
