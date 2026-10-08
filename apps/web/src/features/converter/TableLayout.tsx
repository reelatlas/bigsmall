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
import { CALCULATOR_PLACE, cx } from '../../lib/recipes';
import { evaluatedText } from './calculator';
import { noMatchMessage, type BoxView, type HistoryAction, type TableView } from './state';
import type { ConverterEnv } from './useConverter';

/**
 * The converter from md (docs/UX-SPEC.md §1): the toolbar, the box, and its table in the first
 * column, and the calculator in a column of its own on their right, level with the box and
 * spanning its rows; the last row takes any height the calculator adds, so the table always sits
 * right under the box. Below md the calculator opens between the box and the table, flush left.
 */
const TABLE_GRID =
  'md:grid md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto_1fr] md:gap-x-4';
/**
 * The toolbar row, as wide as the box: the tools at its left, the category menu at its right end,
 * its right edge on the box's. Where the row has no room for both, the menu wraps onto a line of
 * its own, flush left (justify-between puts a line's one item at its start), with no breakpoint:
 * the browser's own fit decides, in every theme.
 */
const TABLE_TOOLS_ROW =
  'mb-2 flex max-w-xl flex-wrap items-center justify-between gap-x-4 gap-y-2 md:col-start-1 md:row-start-1';
/** The tools: their first glyph lined up with the hint and the box. */
const TABLE_TOOLS = '-ml-3 flex shrink-0 items-center gap-1';
const TABLE_BOX_CELL = 'max-w-xl md:col-start-1 md:row-start-2';
/** 16 px under the box or the calculator; a container, so the categories go four across once it has the room. */
const TABLE_ROWS_CELL = '@container mt-4 max-w-xl md:col-start-1 md:row-start-3';
const TABLE_CALCULATOR_CELL =
  'md:col-start-2 md:row-span-2 md:row-start-2 md:mt-0 md:w-72 md:self-start';

/**
 * Keys that start typing in the field when nothing on the page has focus: a letter, a digit, or
 * what a number can start with. Not Space, which scrolls the page.
 */
const STARTS_TYPING = /^[\p{L}\p{N}.,-]$/u;

/** Which list the table's place shows, for a cursor to belong to: the start, the matches, or one category's units. */
function viewKeyOf(view: TableView): string {
  return view.kind === 'units' ? `units:${view.category}` : view.kind;
}

export interface TableLayoutProps {
  /** The toolbar's buttons (the calculator, undo, redo, clear all), at the left of its row. */
  tools: ReactNode;
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
  /** The calculator while it is open: between the box and the table, or beside them from md. */
  calculator: ReactNode;
  calculatorId: string;
  /** The row whose copy button shows the check, by unit id. */
  copiedRow: string | null;
  onCopyRow: (unitId: string) => void;
  copyRowProps: NonNullable<ConversionTableProps['copyProps']>;
}

/**
 * The box and what it lists (ADR 0012, ADR 0013, docs/UX-SPEC.md §1, §8, §9): the toolbar row
 * with the category menu at its end, the field, and in the table's place the categories to start from, the category's units
 * with their values, or the units a typed query matches. The table is the unit list: the caret
 * stays in the field while a cursor the field points at (aria-activedescendant) moves through
 * whatever the table's place shows, the arrows going round from the menu through the field and
 * every row and back. Typing anywhere in the layout, or with nothing focused on the page, lands
 * in the field; Escape steps back one thing at a time, from browsing the table to an empty page.
 */
export function TableLayout({
  tools,
  inputRef,
  box,
  table,
  env,
  dispatch,
  describedBy,
  copyButton,
  calculator,
  calculatorId,
  copiedRow,
  onCopyRow,
  copyRowProps,
}: TableLayoutProps) {
  const listId = useId();
  const itemId = (index: number) => `${listId}-item-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLDivElement>(null);
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

  const number = box.parsed.valueText ?? '';
  const rowCount =
    table.kind === 'units'
      ? table.message
        ? 0
        : table.rows.length
      : table.kind === 'matches'
        ? table.rows.length
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

  /** Focus onto the menu's trigger, the stop above the field in the arrows' loop. */
  const focusMenu = () => {
    triggerRef.current?.focus();
    setPosition(null);
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
    caretToEnd.current = true;
    input.focus();
    dispatch({ type: 'input', text, at: performance.now() });
    setPosition(null);
  };

  // Keys pressed on the layout's other parts: the menu, the chip, a copy button. Native
  // listeners: the wrapper is not itself interactive. The calculator keeps its own keys.
  // - Escape brings the caret back to the field; on the menu's trigger, the ladder's last step,
  //   it lets go of focus, leaving just the page.
  // - On the trigger the arrows go on round the loop: up to the last row, down to the field.
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
      const own = [menuRef, fieldRef, placeRef].some((part) => part.current?.contains(target));
      if (!own) return;
      const onTrigger = target === triggerRef.current;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (onTrigger) triggerRef.current?.blur();
        else {
          input.focus();
          setPosition(null);
        }
        return;
      }
      if (onTrigger && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        input.focus();
        setPosition(event.key === 'ArrowUp' ? rowCount - 1 : null);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key !== 'Backspace' && (event.key.length !== 1 || event.key === ' ')) return;
      event.preventDefault();
      typeIntoField(event.key);
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  });

  // With nothing on the page focused, the page has one job: a letter or a digit starts typing in
  // the field, and Escape takes the ladder's clearing steps, as it would in the field. Typing
  // only types, never acts; neither works with focus in another control or with Ctrl, ⌘, or Alt
  // held (WCAG 2.1.4; ADR 0012). An Escape that closed a header menu has done its job already.
  useLayoutEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      if (event.key === 'Escape') {
        if (clearStep()) event.preventDefault();
        return;
      }
      if (!STARTS_TYPING.test(event.key)) return;
      event.preventDefault();
      typeIntoField(event.key);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  useLayoutEffect(() => {
    if (!caretToEnd.current) return;
    caretToEnd.current = false;
    const input = inputRef.current;
    input?.setSelectionRange(input.value.length, input.value.length);
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
  const choose = (category: CategoryId) => {
    dispatch({ type: 'chooseCategory', category });
    setPosition(null);
  };

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
      if (category) choose(category.id);
    } else if (table.kind === 'matches') {
      const match = table.rows[index];
      if (match?.kind === 'unit') take(match.unit.id, number);
      else if (match) choose(match.category.id);
    } else {
      const row = table.rows[index];
      if (!row || row.tone === 'message') return;
      if (row.inBox) setPosition(null);
      else
        take(row.id, row.value === null ? number : formatNumber(row.value, { locale: env.locale }));
    }
  };

  /** A click or tap takes what it is on and leaves the caret in the field, for the keys to go on from there. */
  const pick = (index: number) => {
    takeRow(index);
    inputRef.current?.focus();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
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
        // The loop: the menu, the field, every row, and round to the menu again, each step from
        // where the cursor is, the unit in the box while it rests there.
        event.preventDefault();
        if (at < 0 && rowCount > 0) setPosition(0);
        else if (at >= 0 && at + step < rowCount) setPosition(at + step);
        else focusMenu();
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (at >= 0) setPosition(at - step >= 0 ? at - step : -1);
        else focusMenu();
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
        return;
      }
      case 'Escape':
        // One step at a time: back from browsing the table, then the clearing steps, then it
        // lets go, leaving just the page. Right after Enter the cursor only rests, so the first
        // Escape already clears.
        event.preventDefault();
        if (browsing) {
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
      />
    ) : (
      <ConversionTable
        id={listId}
        title={table.categories.find((category) => category.id === table.category)?.name ?? ''}
        rows={table.rows}
        message={table.message}
        cursor={browsing ? at : -1}
        itemId={itemId}
        copied={copiedRow}
        onPick={pick}
        onCopy={(row) => onCopyRow(row.id)}
        copyProps={copyRowProps}
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
        <div className={TABLE_TOOLS_ROW}>
          <div className={TABLE_TOOLS}>{tools}</div>
          <div ref={menuRef}>
            <CategoryMenu
              categories={table.categories}
              value={chosen}
              counts={table.kind === 'matches' ? table.counts : undefined}
              triggerRef={triggerRef}
              onChoose={(category) => {
                choose(category);
                inputRef.current?.focus();
              }}
            />
          </div>
        </div>
        <div ref={fieldRef} className={TABLE_BOX_CELL}>
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
            onChange={onChange}
            onKeyDown={onKeyDown}
            // The chip is a readout here: clicking it puts the caret in the field, where the
            // arrows reach the units; its × takes the unit out and keeps the category's table.
            onChipOpen={() => inputRef.current?.focus()}
            onChipRemove={() => {
              dispatch({ type: 'unlock' });
              setPosition(null);
              inputRef.current?.focus();
            }}
          />
        </div>
        {calculator && (
          <div id={calculatorId} className={cx(CALCULATOR_PLACE, TABLE_CALCULATOR_CELL)}>
            {calculator}
          </div>
        )}
        <div ref={placeRef} className={TABLE_ROWS_CELL}>
          {place}
        </div>
      </div>
    </div>
  );
}
