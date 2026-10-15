import { formatNumber, type CategoryId } from '@bigsmall/core';
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
import { pressedByTouch } from '../../lib/modality';
import { rowsIn, stopOf } from '../../lib/panel-keys';
import { stepPlane } from '../../lib/planes';
import { STARTS_TYPING } from '../../lib/typing';
import { evaluatedText } from './calculator';
import { sectionsOf, shows, withChoice, type Settings } from './settings';
import {
  noMatchMessage,
  type BoxView,
  type HistoryAction,
  type TableRow,
  type TableView,
} from './state';
import type { ConverterEnv } from './useConverter';

/**
 * The converter from md (docs/UX-SPEC.md §1): the toolbar, the box, and its table in the first
 * column, and the side panel open (the calculator, Filter, or Display) in a column of its own on
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
 * The toolbar row (Sean, 2026-10-10 and 15): the category menu, the calculator, Filter, and
 * Display at its left, the menu's edge on the box's, with no dividers between them; undo, redo,
 * and clear all at its right end. Where the row has no room for both, the right end keeps the top
 * line and the leading four wrap under it, over the box, with no breakpoint: they come first in
 * the markup, `flex-wrap-reverse` stacks a wrapped row's first line at the bottom, and the right
 * end's `ml-auto` keeps it right. The browser's own fit decides, in every theme.
 */
const TABLE_TOOLS_ROW = 'mb-2 flex flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2';
const TABLE_LEADING = 'flex items-center gap-1';
/**
 * The right end's tools: their outer edges on the box's (the last button's at the row's right
 * end), so a filled one (switched on, hovered) lines up with the box and the table, its glyph
 * inside the column as their text is.
 */
const TABLE_TOOLS = 'ml-auto flex shrink-0 items-center gap-1';
const TABLE_BOX_CELL = 'max-w-xl md:col-start-1 md:row-start-2';
/**
 * 8 px under the box, its popup, as the toolbar sits 8 px over it; a container, so the categories
 * go four across once it has the room. Under an open side panel (below md) the panel's own 16 px
 * wins, the two margins collapsing.
 */
const TABLE_ROWS_CELL = '@container mt-2 max-w-xl md:col-start-1 md:row-span-2 md:row-start-3';
/**
 * Where a side panel opens (docs/DESIGN-SYSTEM.md, "Side panels"): 16 px from the box and from the
 * table, a panel apart, at most 384 px wide. From md, a column of its own, its top on the box's,
 * as tall as its card (`self-start`).
 */
const TABLE_SIDE_CELL =
  'my-4 max-w-sm md:col-start-2 md:row-span-3 md:row-start-2 md:my-0 md:w-72 md:self-start';

/**
 * Keys that type into the field from a control beside it (a toolbar's, the chip, a copy button):
 * any character, or Backspace. Not Space, which presses the control.
 */
function typesIntoField(event: globalThis.KeyboardEvent): boolean {
  return event.key === 'Backspace' || (event.key.length === 1 && event.key !== ' ');
}

/** Which list the table's place shows, for a cursor to belong to: the start, the matches, or one category's units. */
function viewKeyOf(view: TableView): string {
  return view.kind === 'units' ? `units:${view.category}` : view.kind;
}

export interface TableLayoutProps {
  /** The tools after the category menu: the calculator, Filter, and Display. */
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
  /** Id of the converter's hint, which describes the field. */
  describedBy: string;
  /** The field's copy button, once it holds a number. */
  copyButton: ReactNode;
  /**
   * The side panel open, one at a time (the calculator, Filter, or Display): between the box and
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
  table,
  env,
  dispatch,
  describedBy,
  copyButton,
  side,
  sideId,
  sideTypes,
  copiedRow,
  onCopyRow,
  copyRowProps,
}: TableLayoutProps) {
  const listId = useId();
  const itemId = (index: number) => `${listId}-item-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
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
   * Whether the caret came into the field with a tap, so a touch screen's keyboard is up: its
   * Enter, labelled Done, puts the keyboard away once it has done its job (ADR 0015).
   */
  const tappedIn = useRef(false);
  /** Edit, in the category it was started in: a new category ends it. */
  const [editingIn, setEditingIn] = useState<string | null>(null);
  const editing = table.kind === 'units' && editingIn === table.category;
  const [hiddenOpen, setHiddenOpen] = useState(false);
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
   * Past the field or the last row, ↑ and ↓ go on to the plane above or below, the toolbar or
   * the header (ADR 0014); the cursor rests again as focus leaves.
   */
  const leaveBox = (step: 1 | -1) => {
    if (inputRef.current) stepPlane(inputRef.current, step);
  };

  /**
   * ↓ past the last row: onto the table's foot (Hidden, or Edit; Show them under the matches),
   * which carries on the box's plane, else on to the next plane (ADR 0014, Sean 2026-10-15).
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

  /** From the foot: ↑ back into the box, the cursor on the last row; ↓ past its last control, on. */
  const leaveFoot = (step: 1 | -1) => {
    if (step === 1) {
      leaveBox(1);
      return;
    }
    inputRef.current?.focus();
    setPosition(rowCount > 0 ? rowCount - 1 : -1);
  };

  /**
   * The Escape ladder's steps that change the conversion, one a call: a typed unit, back to the
   * number; the number; the unit and the category, back to the start, as clear all does. False
   * when there is nothing left to clear.
   */
  const clearStep = (): boolean => {
    if (table.kind === 'matches') dispatch({ type: 'replace', text: number });
    else if (box.text !== '') dispatch({ type: 'replace', text: '' });
    else if (box.unit || table.kind === 'units') dispatch({ type: 'clear' });
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

  // With nothing on the page focused, the page has one job: a letter or a digit starts typing in
  // the field, ↑ or ↓ goes into it, the next press moving on from there (ADR 0014), and Escape
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

  // The row the arrows reach stays in view, as the page scrolls.
  useEffect(() => {
    if (browsing)
      document.getElementById(`${listId}-item-${at}`)?.scrollIntoView({ block: 'nearest' });
  }, [browsing, at, listId]);

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
    onSettings((now) => ({
      ...now,
      rule: withChoice(
        now.rule,
        rows.map((row) => row.unit),
        show,
        env.system,
      ),
    }));

  /** A unit taken into the box, with its new text; the category follows, and the cursor rests on its row. */
  const take = (unitId: string, text: string) => {
    dispatch({ type: 'use', unit: unitId, text });
    setPosition(null);
    caretToEnd.current = true;
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
      if (category) chooseCategory(category.id);
    } else if (table.kind === 'matches') {
      const match = table.rows[index];
      // A hidden unit taken from search leaves Hidden, as if checked there, so clearing the box
      // never hides it again (Sean, 2026-10-10).
      const hiddenMatch = revealed ? table.hidden[index - table.rows.length] : undefined;
      if (match?.kind === 'unit') take(match.unit.id, number);
      else if (match) chooseCategory(match.category.id);
      else if (hiddenMatch) {
        choose([hiddenMatch], true);
        take(hiddenMatch.unit.id, number);
      }
    } else {
      const row = table.rows[index];
      if (!row || row.tone === 'message') return;
      if (row.inBox) setPosition(null);
      else
        take(row.id, row.value === null ? number : formatNumber(row.value, { locale: env.locale }));
    }
  };

  /**
   * A click or tap takes what it is on. After a click the caret is back in the field, for the keys
   * to go on from there; after a tap a touch screen's keyboard stays down, and goes away if it was
   * up, so the table being picked from stays in view (ADR 0015).
   */
  const pick = (index: number) => {
    takeRow(index);
    if (pressedByTouch()) inputRef.current?.blur();
    else inputRef.current?.focus();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (editing) endEdit();
    dispatch({
      type: 'input',
      text: event.currentTarget.value,
      at: performance.now(),
    });
    setPosition(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/⌘+C on a row the cursor is on copies its full value; undo and redo are the converter's.
      if (event.key.toLowerCase() !== 'c' || !browsing || table.kind !== 'units') return;
      const row = table.rows[at];
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
      case 'ArrowDown':
        // From the field down every row, each step from where the cursor is (the unit in the box
        // while it rests there), past the last row onto the table's foot, and from there on to the
        // next plane, the header's toolbar.
        event.preventDefault();
        if (at < 0 && rowCount > 0) setPosition(0);
        else if (at >= 0 && at + step < rowCount) setPosition(at + step);
        else toFoot();
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (at >= 0) setPosition(at - step >= 0 ? at - step : -1);
        else leaveBox(-1);
        return;
      case 'Enter': {
        // On a row, take it. In the field: a typed unit takes its best match; arithmetic becomes
        // its value; with a unit the cursor comes back to rest on it; without one, Enter goes
        // into the table, to pick a category or a unit.
        event.preventDefault();
        const worked = evaluatedText(box.text, env);
        if (browsing) takeRow(at);
        else if (table.kind === 'matches') takeRow(0);
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
        else if (browsing) {
          setPosition(null);
          inputRef.current?.scrollIntoView({ block: 'nearest' });
        } else if (!clearStep()) inputRef.current?.blur();
        return;
      case 'Backspace':
        // On an empty field, Backspace takes the unit out, as the chip's × does.
        if (box.unit && event.currentTarget.value === '') {
          event.preventDefault();
          dispatch({ type: 'unlock' });
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
      />
    ) : (
      <ConversionTable<TableRow>
        id={listId}
        title={table.categories.find((category) => category.id === table.category)?.name ?? ''}
        sections={table.sections}
        hidden={table.hidden}
        every={sectionsOf(table.all, env.system)}
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
      />
    );

  // The cursor shows only while focus is in the box or its table: moving to the toolbar, the
  // calculator, or off the page, the cursor rests again.
  return (
    <div
      ref={rootRef}
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
                  if (!pressedByTouch()) inputRef.current?.focus();
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
          onFocus={(event: FocusEvent<HTMLDivElement>) => {
            if (event.target === inputRef.current) tappedIn.current = pressedByTouch();
          }}
        >
          <ValueField
            inputRef={inputRef}
            label="Value"
            text={box.text}
            parsed={box.parsed}
            locale={env.locale}
            unit={box.unit}
            // What the field takes, never a value it might be mistaken for.
            placeholder={box.unit ? 'Number' : 'Number or unit'}
            describedBy={describedBy}
            popup={{
              expanded: rowCount > 0,
              id: listId,
              activeId: browsing ? itemId(at) : undefined,
              kind: table.kind === 'units' ? 'grid' : 'listbox',
            }}
            trailing={copyButton}
            symbolOnly={display.names === 'symbol'}
            onChange={onChange}
            onKeyDown={onKeyDown}
            // The chip is a readout here, and part of the box: clicking or tapping it puts the
            // caret in the field, where the arrows reach the units. Its × takes the unit out and
            // keeps the category's table, the caret back in the field after a click, not a tap.
            onChipOpen={() => inputRef.current?.focus()}
            onChipRemove={() => {
              dispatch({ type: 'unlock' });
              setPosition(null);
              if (!pressedByTouch()) inputRef.current?.focus();
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
        </div>
      </div>
    </div>
  );
}
