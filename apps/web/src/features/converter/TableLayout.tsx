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
import { stepPlane } from '../../lib/planes';
import { evaluatedText } from './calculator';
import { noMatchMessage, type BoxView, type HistoryAction, type TableView } from './state';
import type { ConverterEnv } from './useConverter';

/**
 * The converter from md (docs/UX-SPEC.md §1): the toolbar, the box, and its table in the first
 * column, and the calculator in a column of its own on their right. Its card is a subgrid of the
 * first three rows, so its title row sits level with the toolbar, its display level with the box,
 * and its keys in the third row, which the table shares with the last; the last row, 1fr, takes
 * the rest of a long table, so the card hugs its keys and the table always sits right under the
 * box. Below md the calculator opens between the box and the table, flush left.
 */
const TABLE_GRID =
  'md:grid md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto_auto_1fr] md:gap-x-4';
/**
 * The toolbar row, as wide as the box: the category menu at its left, its edge on the box's, and
 * the tools at its right end. Where the row has no room for both, the tools keep the line and the
 * menu wraps under them, both flush left, with no breakpoint: the menu comes first in the markup,
 * `flex-wrap-reverse` stacks a wrapped row's first line at the bottom, and justify-between puts a
 * line's one item at its start. The browser's own fit decides, in every theme.
 */
const TABLE_TOOLS_ROW =
  'mb-2 flex max-w-xl flex-wrap-reverse items-center justify-between gap-x-4 gap-y-2 md:col-start-1 md:row-start-1';
/**
 * The tools: their outer edges on the box's (the last button's at the row's right end, the first's
 * when they wrap, flush left), so a filled one (switched on, hovered) lines up with the box and the
 * table, its glyph inside the column as their text is.
 */
const TABLE_TOOLS = 'flex shrink-0 items-center gap-1';
const TABLE_BOX_CELL = 'max-w-xl md:col-start-1 md:row-start-2';
/** 16 px under the box or the calculator; a container, so the categories go four across once it has the room. */
const TABLE_ROWS_CELL = '@container mt-4 max-w-xl md:col-start-1 md:row-span-2 md:row-start-3';
/**
 * Where the calculator opens (docs/DESIGN-SYSTEM.md, "Calculator"): 16 px under the box, at most
 * 384 px wide. From md, a column of its own: a subgrid of the first three rows, and the card in it
 * one too (`*:`), its three parts in the three rows. The card's top padding shrinks to 1 px there,
 * so its title row, 44 px and its 8 px margin, sits as high as the toolbar's icons and never makes
 * the first row taller.
 */
const TABLE_CALCULATOR_CELL =
  'mt-4 max-w-sm md:col-start-2 md:row-span-3 md:row-start-1 md:mt-0 md:grid md:w-72 md:grid-rows-subgrid md:*:row-span-3 md:*:grid md:*:grid-rows-subgrid md:*:pt-px';

/**
 * Keys that start typing in the field when nothing on the page has focus: a letter, a digit, or
 * what a number can start with. Not Space, which scrolls the page.
 */
const STARTS_TYPING = /^[\p{L}\p{N}.,-]$/u;

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
  /** The toolbar's buttons (the calculator, undo, redo, clear all), at the right end of its row. */
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
  const toolsRef = useRef<HTMLDivElement>(null);
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

  /**
   * Past the field or the last row, ↑ and ↓ go on to the plane above or below, the toolbar or
   * the header (ADR 0014); the cursor rests again as focus leaves.
   */
  const leaveBox = (step: 1 | -1) => {
    if (inputRef.current) stepPlane(inputRef.current, step);
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

  // Keys pressed on the layout's other parts: the toolbar, the chip, a copy button. Native
  // listeners: the wrapper is not itself interactive. The calculator keeps its own keys, and the
  // toolbar's arrows and Escape are the page's toolbar controller's (layouts/Base.astro).
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
      const own = [toolsRef, fieldRef, placeRef].some((part) => part.current?.contains(target));
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
        if (clearStep()) event.preventDefault();
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
        // From the field down every row, each step from where the cursor is (the unit in the box
        // while it rests there), and past the last row on to the next plane, the header's toolbar.
        event.preventDefault();
        if (at < 0 && rowCount > 0) setPosition(0);
        else if (at >= 0 && at + step < rowCount) setPosition(at + step);
        else leaveBox(1);
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
        {/* The converter's toolbar, the page's second plane (ADR 0014): first reached at the menu. */}
        <div
          ref={toolsRef}
          role="toolbar"
          aria-label="Tools"
          className={TABLE_TOOLS_ROW}
          data-plane="tools"
          data-default-tool="category"
        >
          <CategoryMenu
            categories={table.categories}
            value={chosen}
            counts={table.kind === 'matches' ? table.counts : undefined}
            tool="category"
            onChoose={(category) => {
              choose(category);
              inputRef.current?.focus();
            }}
          />
          <div className={TABLE_TOOLS}>{tools}</div>
        </div>
        <div ref={fieldRef} className={TABLE_BOX_CELL} data-plane="box">
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
          <div id={calculatorId} className={TABLE_CALCULATOR_CELL}>
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
