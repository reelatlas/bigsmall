import { formatNumber, getCategory, parse } from '@bigsmall/core';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import {
  CalculatorIcon,
  CopiedIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  RedoIcon,
  SwapIcon,
  UndoIcon,
} from '../../components/icons';
import { Calculator, SendButton, type CalculatorKey } from '../../components/Calculator';
import { LayoutSwitch } from '../../components/LayoutSwitch';
import { NumberText, runningValue } from '../../components/NumberText';
import { ToolbarDivider } from '../../components/ToolbarDivider';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { appliedLayout, applyLayout, type Layout } from '../../lib/layout';
import { isApplePlatform } from '../../lib/platform';
import { CALCULATOR_PLACE, cx, LABEL } from '../../lib/recipes';
import { SLOTS, useSlot } from '../../lib/slots';
import { entryMessage, isStepKey, placeNumber, pressKey } from './calculator';
import { SmartInput } from './SmartInput';
import { nextBox, type BoxId, type BoxView } from './state';
import { TableLayout } from './TableLayout';
import { urlFor } from './url';
import { useConverter } from './useConverter';

/**
 * The buttons that confirm with a check: copying a box's value, a table row's, or the page's URL,
 * and sending the calculator's value to a box.
 */
type Confirmable = BoxId | 'url' | `use-${BoxId}` | `row-${string}`;

/** What the status region says when a button confirms. */
function confirmation(key: Confirmable, layout: Layout | null): string {
  if (key === 'url') return 'URL copied';
  if (key === 'use-a' || key === 'use-b') {
    if (layout === 'table') return 'Sent to the value';
    return key === 'use-a' ? 'Sent to the first value' : 'Sent to the second value';
  }
  return 'Copied';
}

/** The hint over the toolbar, per layout (docs/UX-SPEC.md §1). */
const HINTS: Record<Layout, string> = {
  table:
    'Type a number and a unit to see it in every unit of its kind. Pick one to convert from it.',
  boxes: 'Type a number, unit, or both. Once each box has a unit, typing in one updates the other.',
};

/** What each empty box suggests before anything scopes it; the second shows a category can be typed too. */
const EXAMPLES: Record<BoxId, string> = {
  a: '5 ml, feet, °F…',
  b: '2 kg, inches, speed…',
};

/** A box's text field, found by the mark SmartInput puts on it. */
function boxInput(section: HTMLElement | null, id: BoxId): HTMLInputElement | null {
  return section?.querySelector<HTMLInputElement>(`input[data-box="${id}"]`) ?? null;
}

/** Focus that waits for the render after a change (see the layout effect below). */
type FocusRequest = { kind: 'enter'; box: BoxId } | { kind: 'box'; box: BoxId };

/**
 * The converter island, in either layout (ADR 0009, ADR 0012, docs/UX-SPEC.md §1): the hint and
 * the toolbar (calculator, swap with two boxes, undo, redo, clear all); then the table layout
 * (TableLayout: its category menu, its one box, and its table), or the category label and the two
 * linked boxes; the calculator when open, beside the table or under the boxes (§8); and the live
 * regions. It draws the Copy URL button and the layout switch into the header's slots (§7, §10).
 *
 * Until it hydrates the layout is unknown here, so the server's markup carries both layouts' empty
 * state and the layout-* variants (global.css) show the one the inline script applied. Classes
 * with those variants stay on afterwards: they agree with the page's data-layout, which the switch
 * keeps in step.
 */
export function Converter() {
  const hydrated = useIsHydrated();
  const [chosenLayout, setChosenLayout] = useState<Layout | null>(null);
  const layout: Layout | null = hydrated ? (chosenLayout ?? appliedLayout()) : null;
  const { state, view, table, env, dispatch, canUndo, canRedo, escapeTargets, announcement } =
    useConverter(layout);
  // Tooltips name the platform's keys; until hydration they read as on the server (Ctrl).
  const apple = hydrated && isApplePlatform();
  const hintId = useId();
  const calcMessageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { copied, copy, markCopied, pointerProps } = useCopied<Confirmable>();
  const headerActions = useSlot(SLOTS.headerActions);
  const layoutSlot = useSlot(SLOTS.layoutSwitch);
  const calculatorId = useId();
  const calculatorToggleId = useId();
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  // The calculator's own entry: a scratch pad in the converter's state, so undo reaches it too.
  const entry = state.calc;
  const entryParsed = parse(entry.text, env.separators);
  const entryValue = entryParsed.value;
  // Why the entry has no value to use or send, said in the display: "Too large".
  const calcMessage = entryMessage(entryParsed);
  const categoryName = view.category ? getCategory(view.category)?.name : undefined;
  // A category chosen with no unit is something to clear in the table layout, which shows it.
  const isEmpty =
    !state.a.text &&
    !state.a.unit &&
    !state.b.text &&
    !state.b.unit &&
    (layout === 'boxes' || !state.category);

  const switchLayout = (next: Layout) => {
    applyLayout(next);
    setChosenLayout(next);
  };

  // Focus that waits for the render a change brings: Enter's hand-off to the other box, with two
  // boxes (docs/UX-SPEC.md §5), so the other box opens on its new scope; and clear all's caret,
  // whose box the table layout renders only once the clear lands. A layout effect, so focus moves
  // before the next key; each request is a new object, handled once however the view changes.
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const handledFocus = useRef<FocusRequest | null>(null);
  useLayoutEffect(() => {
    if (!focusRequest || handledFocus.current === focusRequest) return;
    handledFocus.current = focusRequest;
    const to =
      focusRequest.kind === 'box'
        ? focusRequest.box
        : layout === 'boxes'
          ? nextBox(view, focusRequest.box)
          : null;
    if (to) boxInput(sectionRef.current, to)?.focus();
  }, [focusRequest, view, layout]);

  /** Clear both boxes (undoable like any other step) and put the caret back in the first box. */
  const clearAll = () => {
    dispatch({ type: 'clear' });
    setFocusRequest({ kind: 'box', box: 'a' });
  };

  // Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes anywhere inside the converter,
  // replacing the text field's own undo so "undo" always means the last thing the user did here.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: 'undo' });
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        dispatch({ type: 'redo' });
      }
    };
    section.addEventListener('keydown', onKeyDown);
    return () => section.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  const closeCalculator = () => {
    setCalculatorOpen(false);
    document.getElementById(calculatorToggleId)?.focus();
  };

  /** Keys change only the calculator's own entry (calculator.ts); the boxes wait for a send. */
  const press = (key: CalculatorKey) => {
    const next = pressKey(entry, key, env);
    if (!next) return;
    dispatch(
      isStepKey(key)
        ? { type: 'calcSet', ...next }
        : { type: 'calcType', ...next, at: performance.now() },
    );
  };

  /** Escape takes back the latest chunk of the entry, like Escape in a box; empty, it closes. */
  const escapeCalculator = () => {
    if (entry.text === '') closeCalculator();
    else dispatch({ type: 'stepBack', box: 'calc' });
  };

  /**
   * "Use in 1st", or "Use" into the table's box: the entry's value, its running value if = was
   * not pressed, replaces the box's number or fills an empty box, keeping its unit. One undoable
   * step that makes the box the source.
   */
  const send = (id: BoxId) => {
    if (entryValue === undefined) return;
    const shown = view[id];
    const showsResult = !shown.isSource && view.result?.box === id;
    const number = formatNumber(entryValue, { locale: env.locale });
    dispatch({
      type: 'replace',
      box: id,
      text: placeNumber(shown.text, showsResult, number, env.separators),
    });
    markCopied(`use-${id}`);
  };

  const sendButton = (id: BoxId, ordinal?: string) => (
    <SendButton
      key={id}
      ordinal={ordinal}
      symbol={view[id].unit?.symbol}
      confirmed={copied === `use-${id}`}
      unavailable={entryValue === undefined}
      aria-describedby={calcMessage ? calcMessageId : undefined}
      onClick={() => send(id)}
      {...pointerProps(`use-${id}`)}
    />
  );

  /** Copies a table row's full-precision value, not the 6 digits it shows (docs/UX-SPEC.md §7). */
  const copyRow = (unitId: string) => {
    const row = table?.kind === 'units' ? table.rows.find((each) => each.id === unitId) : undefined;
    if (row?.value != null) copy(String(row.value), `row-${unitId}`);
  };

  /** Both boxes get a copy control whenever they hold a number, so the control never jumps sides. */
  const copyButton = (box: BoxView, label: string) => {
    const value = box.isSource
      ? box.parsed.value
      : view.result?.box === box.id
        ? view.result.value
        : undefined;
    if (value === undefined) return undefined;
    return (
      <Button
        variant="ghost"
        square
        nested
        // Out of the Tab order so Tab goes box to box; focusing a result selects it for Ctrl+C.
        tabIndex={-1}
        aria-label={`Copy ${label}`}
        onClick={() => copy(String(value), box.id)}
        {...pointerProps(box.id)}
      >
        {/* A check in the success color confirms the copy (the status line announces it);
            useCopied decides when it reverts. */}
        {copied === box.id ? <CopiedIcon /> : <CopyIcon />}
      </Button>
    );
  };

  /** One of the two boxes. */
  const renderBox = (box: BoxView, label: string, counterpart: BoxView) => (
    <div className="min-w-0 flex-1">
      <SmartInput
        box={box}
        label={label}
        describedBy={hintId}
        mode={state.mode}
        env={env}
        dispatch={dispatch}
        escapeTarget={escapeTargets[box.id]}
        examples={EXAMPLES[box.id]}
        counterpart={counterpart.unit}
        trailing={copyButton(box, label.toLowerCase())}
        onEnter={() => setFocusRequest({ kind: 'enter', box: box.id })}
      />
    </div>
  );

  const source = state.source;

  const calculator = calculatorOpen && (
    <Calculator
      display={
        entry.text && (
          <NumberText
            text={entry.text}
            parsed={entryParsed}
            running={runningValue(entryParsed, env.locale)}
          />
        )
      }
      message={calcMessage}
      messageId={calcMessageId}
      decimalMark={env.separators.decimal}
      onPress={press}
      onEscape={escapeCalculator}
      onClose={closeCalculator}
      footer={
        layout === 'table' ? (
          sendButton(source)
        ) : (
          <>
            {sendButton('a', '1st')}
            {sendButton('b', '2nd')}
          </>
        )
      }
    />
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Unit converter"
      className="mt-6"
      data-hydrated={hydrated ? '' : undefined}
    >
      {/*
        The hint has a line of its own, and the toolbar the next one, flush left over the boxes it
        acts on, so what to do and the tools to do it with read apart (docs/UX-SPEC.md §1).
      */}
      <div className="mb-2 flex flex-col gap-2">
        <p id={hintId} className="text-sm text-ink-muted">
          {layout !== 'boxes' && <span className="layout-boxes:hidden">{HINTS.table}</span>}
          {layout !== 'table' && <span className="layout-table:hidden">{HINTS.boxes}</span>}
        </p>
        <div className="-ml-3 flex shrink-0 items-center gap-1 self-start">
          <Button
            variant="ghost"
            square
            id={calculatorToggleId}
            aria-label="Calculator"
            title="Calculator"
            aria-expanded={calculatorOpen}
            aria-controls={calculatorOpen ? calculatorId : undefined}
            onClick={() => (calculatorOpen ? closeCalculator() : setCalculatorOpen(true))}
            on={calculatorOpen}
          >
            <CalculatorIcon />
          </Button>
          {/* Two boxes only: in the table a row does swap's job. Its arrows point the way the
              boxes sit, across from sm and down below it. */}
          {layout !== 'table' && (
            <Button
              variant="ghost"
              square
              className="layout-table:hidden"
              aria-label="Swap sides"
              title="Swap sides"
              disabled={isEmpty}
              onClick={() => dispatch({ type: 'swap' })}
            >
              <SwapIcon className="rotate-90 sm:rotate-0" />
            </Button>
          )}
          {/* The calculator and swap act on the conversion; undo and redo step through its history. */}
          <ToolbarDivider />
          <Button
            variant="ghost"
            square
            aria-label="Undo"
            aria-keyshortcuts="Control+Z Meta+Z"
            title={apple ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
            disabled={!canUndo}
            onClick={() => dispatch({ type: 'undo' })}
          >
            <UndoIcon />
          </Button>
          <Button
            variant="ghost"
            square
            aria-label="Redo"
            aria-keyshortcuts="Control+Y Control+Shift+Z Meta+Shift+Z Meta+Y"
            title={apple ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
            disabled={!canRedo}
            onClick={() => dispatch({ type: 'redo' })}
          >
            <RedoIcon />
          </Button>
          {/* Clearing is a different kind of step from undo and redo, so a divider sets it apart. */}
          <ToolbarDivider />
          <Button
            variant="ghost"
            square
            aria-label="Clear all"
            title="Clear all"
            disabled={isEmpty}
            onClick={clearAll}
          >
            <EraserIcon />
          </Button>
        </div>
      </div>

      {/*
        The table layout: its category menu, its one box, a column wide enough to read its rows
        across, and its table (TableLayout).
      */}
      {layout !== 'boxes' && table && (
        <div className="layout-boxes:hidden">
          <TableLayout
            box={view[source]}
            table={table}
            env={env}
            dispatch={dispatch}
            describedBy={hintId}
            copyButton={copyButton(view[source], 'value')}
            calculator={layout === 'table' && calculator}
            calculatorId={calculatorId}
            copiedRow={copied?.startsWith('row-') ? copied.slice('row-'.length) : null}
            onCopyRow={copyRow}
            copyRowProps={(row) => pointerProps(`row-${row.id}`)}
          />
        </div>
      )}

      {layout !== 'table' && (
        <div className="layout-table:hidden">
          {/*
            The category label over the first box, left-aligned with the value, whichever box
            drives. It keeps its line while empty, so nothing moves when it appears. Plain text,
            not a live region: the announcement already names the units (docs/UX-SPEC.md §12).
          */}
          <p data-category-label className={cx('mb-1.5 min-h-5 px-4.5', LABEL)}>
            {categoryName ?? ''}
          </p>
          {/* Side by side from sm and stacked below it, Tab going from one straight to the other. */}
          <div className="flex flex-col gap-y-2 sm:flex-row sm:gap-x-4">
            {renderBox(view.a, 'First value', view.b)}
            {renderBox(view.b, 'Second value', view.a)}
          </div>
          {calculator && (
            <div id={calculatorId} className={CALCULATOR_PLACE}>
              {calculator}
            </div>
          )}
        </div>
      )}

      {/* The two live regions (docs/UX-SPEC.md §12): the result, once it settles; and action feedback. */}
      <p aria-live="polite" className="sr-only">
        {announcement ?? ''}
      </p>
      <p role="status" className="sr-only">
        {copied ? confirmation(copied, layout) : ''}
      </p>

      {/* Drawn into the header so it copies from this state, not from the address bar. */}
      {headerActions &&
        createPortal(
          <Button
            variant="ghost"
            square
            aria-label="Copy URL"
            title="Copy URL"
            onClick={() => copy(urlFor(state, env.separators, window.location), 'url')}
            {...pointerProps('url')}
          >
            {copied === 'url' ? <CopiedIcon /> : <LinkIcon />}
          </Button>,
          headerActions,
        )}
      {layoutSlot &&
        layout &&
        createPortal(<LayoutSwitch value={layout} onChange={switchLayout} />, layoutSlot)}
    </section>
  );
}
