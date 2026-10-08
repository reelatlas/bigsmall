import { formatNumber, parse } from '@bigsmall/core';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import {
  CalculatorIcon,
  CopiedIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  RedoIcon,
  UndoIcon,
} from '../../components/icons';
import { Calculator, SendButton, type CalculatorKey } from '../../components/Calculator';
import { NumberText, runningValue } from '../../components/NumberText';
import { ToolbarDivider } from '../../components/ToolbarDivider';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { isApplePlatform } from '../../lib/platform';
import { SLOTS, useSlot } from '../../lib/slots';
import { entryMessage, isStepKey, placeNumber, pressKey } from './calculator';
import { TableLayout } from './TableLayout';
import { urlFor } from './url';
import { useConverter } from './useConverter';

/**
 * The buttons that confirm with a check: copying the box's value, a row's, or the page's URL, and
 * sending the calculator's value to the box.
 */
type Confirmable = 'value' | 'url' | 'use' | `row-${string}`;

/** What the status region says when a button confirms. */
function confirmation(key: Confirmable): string {
  if (key === 'url') return 'URL copied';
  if (key === 'use') return 'Sent to the value';
  return 'Copied';
}

/** The hint over the toolbar (docs/UX-SPEC.md §1). */
const HINT = 'Type a number, unit, or both to compare all at once.';

/**
 * The converter island (ADR 0012, ADR 0013, docs/UX-SPEC.md §1): the hint and the toolbar
 * (calculator, undo, redo, clear all); the box and its table (TableLayout), with the calculator
 * when open between them or beside them (§8); and the live regions. It draws the Copy URL button
 * into the header's slot (§7).
 */
export function Converter() {
  const hydrated = useIsHydrated();
  const { state, box, table, env, dispatch, canUndo, canRedo, announcement } = useConverter();
  // Tooltips name the platform's keys; until hydration they read as on the server (Ctrl).
  const apple = hydrated && isApplePlatform();
  const hintId = useId();
  const calcMessageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { copied, copy, markCopied, pointerProps } = useCopied<Confirmable>();
  const headerActions = useSlot(SLOTS.headerActions);
  const calculatorId = useId();
  const calculatorToggleId = useId();
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  // The calculator's own entry: a scratch pad in the converter's state, so undo reaches it too.
  const entry = state.calc;
  const entryParsed = parse(entry.text, env.separators);
  const entryValue = entryParsed.value;
  // Why the entry has no value to use or send, said in the display: "Too large".
  const calcMessage = entryMessage(entryParsed);
  const isEmpty = !state.text && !state.unit && !state.category;

  /** Clear all (undoable like any other step), and the caret back in the box. */
  const clearAll = () => {
    dispatch({ type: 'clear' });
    inputRef.current?.focus();
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

  /** Keys change only the calculator's own entry (calculator.ts); the box waits for a send. */
  const press = (key: CalculatorKey) => {
    const next = pressKey(entry, key, env);
    if (!next) return;
    dispatch(
      isStepKey(key)
        ? { type: 'calcSet', ...next }
        : { type: 'calcType', ...next, at: performance.now() },
    );
  };

  /** Escape takes back the latest chunk of the entry; empty, it closes. */
  const escapeCalculator = () => {
    if (entry.text === '') closeCalculator();
    else dispatch({ type: 'stepBack' });
  };

  /**
   * "Use": the entry's value, its running value if = was not pressed, replaces the box's number
   * or fills an empty box, keeping its unit. One undoable step.
   */
  const send = () => {
    if (entryValue === undefined) return;
    const number = formatNumber(entryValue, { locale: env.locale });
    dispatch({ type: 'replace', text: placeNumber(state.text, number, env.separators) });
    markCopied('use');
  };

  /** Copies a table row's full-precision value, not the 6 digits it shows (docs/UX-SPEC.md §7). */
  const copyRow = (unitId: string) => {
    const row = table.kind === 'units' ? table.rows.find((each) => each.id === unitId) : undefined;
    if (row?.value != null) copy(String(row.value), `row-${unitId}`);
  };

  // The box's copy button, whenever it holds a number: out of the Tab order, since Ctrl/⌘+C
  // copies from the field itself. A check in the success color confirms the copy (the status line
  // announces it); useCopied decides when it reverts.
  const value = box.parsed.value;
  const copyButton = value !== undefined && (
    <Button
      variant="ghost"
      square
      nested
      tabIndex={-1}
      aria-label="Copy value"
      onClick={() => copy(String(value), 'value')}
      {...pointerProps('value')}
    >
      {copied === 'value' ? <CopiedIcon /> : <CopyIcon />}
    </Button>
  );

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
        <SendButton
          symbol={box.unit?.symbol}
          confirmed={copied === 'use'}
          unavailable={entryValue === undefined}
          aria-describedby={calcMessage ? calcMessageId : undefined}
          onClick={send}
          {...pointerProps('use')}
        />
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
        The hint has a line of its own, and the toolbar the next one, flush left over the box it
        acts on, so what to do and the tools to do it with read apart (docs/UX-SPEC.md §1).
      */}
      <div className="mb-2 flex flex-col gap-2">
        <p id={hintId} className="text-sm text-ink-muted">
          {HINT}
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
          {/* The calculator works out a number; undo and redo step through the history. */}
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

      <TableLayout
        inputRef={inputRef}
        box={box}
        table={table}
        env={env}
        dispatch={dispatch}
        describedBy={hintId}
        copyButton={copyButton}
        calculator={calculator}
        calculatorId={calculatorId}
        copiedRow={copied?.startsWith('row-') ? copied.slice('row-'.length) : null}
        onCopyRow={copyRow}
        copyRowProps={(row) => pointerProps(`row-${row.id}`)}
      />

      {/* The two live regions (docs/UX-SPEC.md §12): the table's sentence, once it settles; and action feedback. */}
      <p aria-live="polite" className="sr-only">
        {announcement ?? ''}
      </p>
      <p role="status" className="sr-only">
        {copied ? confirmation(copied) : ''}
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
    </section>
  );
}
