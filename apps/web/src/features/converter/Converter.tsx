import { formatNumber, parse } from '@bigsmall/core';
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
  UndoIcon,
} from '../../components/icons';
import { Calculator, SendButton, type CalculatorKey } from '../../components/Calculator';
import { NumberText, runningValue } from '../../components/NumberText';
import { ToolbarDivider } from '../../components/ToolbarDivider';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { pressedByTouch } from '../../lib/modality';
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
 * The converter island (ADR 0012, ADR 0013, docs/UX-SPEC.md §1): the hint; the toolbar's
 * buttons (calculator, undo, redo, clear all), which TableLayout sets in a row after the category
 * menu; the box and its table, with the calculator when open between them or beside them (§8);
 * and the live regions. It draws the Copy URL button into the header's slot (§7).
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

  /**
   * Clear all (undoable like any other step), and the caret back in the box after a click or a
   * key; after a tap focus stays put, so no keyboard comes up (ADR 0015).
   */
  const clearAll = () => {
    dispatch({ type: 'clear' });
    if (!pressedByTouch()) inputRef.current?.focus();
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

  /**
   * Where focus goes back to when the calculator closes from inside: the icon, when the icon
   * opened it, or where Alt+C was pressed (docs/UX-SPEC.md §8).
   */
  const returnTo = useRef<HTMLElement | null>(null);
  const calculatorToggle = () => document.getElementById(calculatorToggleId);

  const openCalculator = (from: HTMLElement | null) => {
    returnTo.current = from;
    setCalculatorOpen(true);
  };

  const closeCalculator = (focus: HTMLElement | null = returnTo.current) => {
    setCalculatorOpen(false);
    (focus?.isConnected ? focus : calculatorToggle())?.focus();
  };

  // Alt+C (⌥C on Apple devices, where Option+C types ç) from anywhere on the page opens the
  // calculator and closes it. Closed from inside it, focus goes back where it was; closed from
  // outside, focus stays put. AltGr, which is Ctrl+Alt, is left alone.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
      const isC = event.key.toLowerCase() === 'c' || (isApplePlatform() && event.code === 'KeyC');
      if (!isC) return;
      event.preventDefault();
      const focused = document.activeElement;
      // With nothing focused, closing comes back to the box.
      const here =
        focused instanceof HTMLElement && focused !== document.body ? focused : inputRef.current;
      if (!calculatorOpen) openCalculator(here);
      else if (document.getElementById(calculatorId)?.contains(focused)) closeCalculator();
      else setCalculatorOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

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
      onClose={() => closeCalculator()}
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
      className="@container mt-6"
      data-hydrated={hydrated ? '' : undefined}
    >
      {/*
        The hint has a line of its own, and the toolbar the next one, over the box it acts on, so
        what to do and the tools to do it with read apart (docs/UX-SPEC.md §1). Spaced by what
        shows under it (docs/DESIGN-SYSTEM.md, "Space by what shows"): 16 px over a toolbar on one
        line, whose menu starts with its edge right under the hint, and 8 px where the toolbar
        wraps and its icons, each glyph 12 px inside its button, come first. The converter is a
        container, and 384 px (@sm) is the stock size above the widest theme's one-line toolbar,
        362 px in Theorem.
      */}
      <p id={hintId} className="mb-2 text-sm text-ink-muted @sm:mb-4">
        {HINT}
      </p>

      <TableLayout
        tools={
          <>
            <Button
              variant="ghost"
              square
              id={calculatorToggleId}
              data-tool="calculator"
              aria-label="Calculator"
              aria-keyshortcuts="Alt+C"
              title={apple ? 'Calculator (⌥C)' : 'Calculator (Alt+C)'}
              aria-expanded={calculatorOpen}
              aria-controls={calculatorOpen ? calculatorId : undefined}
              onClick={() => {
                // Closed with the icon, focus stays on it, wherever the calculator was opened from.
                const icon = calculatorToggle();
                if (calculatorOpen) closeCalculator(icon);
                else openCalculator(icon);
              }}
              on={calculatorOpen}
            >
              <CalculatorIcon />
            </Button>
            {/* The calculator works out a number; undo and redo step through the history. */}
            <ToolbarDivider />
            <Button
              variant="ghost"
              square
              data-tool="undo"
              aria-label="Undo"
              aria-keyshortcuts="Control+Z Meta+Z"
              title={apple ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
              aria-disabled={!canUndo || undefined}
              onClick={() => canUndo && dispatch({ type: 'undo' })}
            >
              <UndoIcon />
            </Button>
            <Button
              variant="ghost"
              square
              data-tool="redo"
              aria-label="Redo"
              aria-keyshortcuts="Control+Y Control+Shift+Z Meta+Shift+Z Meta+Y"
              title={apple ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
              aria-disabled={!canRedo || undefined}
              onClick={() => canRedo && dispatch({ type: 'redo' })}
            >
              <RedoIcon />
            </Button>
            {/* Clearing is a different kind of step from undo and redo, so a divider sets it apart. */}
            <ToolbarDivider />
            <Button
              variant="ghost"
              square
              data-tool="clear"
              aria-label="Clear all"
              title="Clear all"
              aria-disabled={isEmpty || undefined}
              onClick={() => !isEmpty && clearAll()}
            >
              <EraserIcon />
            </Button>
          </>
        }
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
            data-tool="copy-url"
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
