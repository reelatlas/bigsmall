import { formatNumber, parse } from '@bigsmall/core';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import {
  CalculatorIcon,
  CopiedIcon,
  EraserIcon,
  LinkIcon,
  ListArrowIcon,
  RedoIcon,
  RulerIcon,
  UndoIcon,
} from '../../components/icons';
import { Calculator, SendButton, type CalculatorKey } from '../../components/Calculator';
import { copiedText } from '../../components/ConversionTable';
import { NumberText, runningValue } from '../../components/NumberText';
import { ToolbarDivider } from '../../components/ToolbarDivider';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { pressedByTouch } from '../../lib/modality';
import { isApplePlatform } from '../../lib/platform';
import { SLOTS, useSlot } from '../../lib/slots';
import { entryMessage, isStepKey, placeNumber, pressKey } from './calculator';
import { glide } from './glide';
import { DisplayPanel, UnitsPanel } from './SettingsPanels';
import type { Settings } from './settings';
import { TableLayout } from './TableLayout';
import { urlFor } from './url';
import { useConverter } from './useConverter';

/**
 * The buttons that confirm with a check: copying a row's value or the page's URL, and sending the
 * calculator's value to the box.
 */
type Confirmable = 'url' | 'use' | `row-${string}`;

/** What the status region says when a button confirms. */
function confirmation(key: Confirmable): string {
  if (key === 'url') return 'URL copied';
  if (key === 'use') return 'Sent to the value';
  return 'Copied';
}

/** The side panels the toolbar opens, one at a time. */
type Side = 'calculator' | 'units' | 'display';

/**
 * Each side panel's key with Alt, side by side on the keyboard as the panels are in the toolbar
 * (Sean, 2026-10-15): C, V, B.
 */
const SIDE_KEYS: Readonly<Record<string, Side>> = { c: 'calculator', v: 'units', b: 'display' };

/** The hint over the toolbar (docs/UX-SPEC.md §1). */
const HINT = 'Type a number, unit, or both to compare all at once.';

/**
 * The converter island (ADR 0012, ADR 0013, ADR 0018, docs/UX-SPEC.md §1): the hint; the
 * toolbar's buttons, the calculator, Units, and Display after the category menu and undo, redo,
 * and clear all at its right end, which TableLayout sets in a row; the box and its table, with the
 * side panel open, one at a time (the calculator §8, Units, or Display), between them or beside
 * them; and the live regions. It draws the Copy URL button into the header's slot (§7).
 */
export function Converter() {
  const hydrated = useIsHydrated();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    state,
    box,
    table,
    env,
    dispatch,
    canUndo,
    canRedo,
    announcement,
    settings,
    updateSettings,
  } = useConverter(inputRef);
  const unitsToggleId = useId();
  const displayToggleId = useId();
  // Tooltips name the platform's keys; until hydration they read as on the server (Ctrl).
  const apple = hydrated && isApplePlatform();
  const hintId = useId();
  const calcMessageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { copied, copy, markCopied, pointerProps } = useCopied<Confirmable>();
  const headerActions = useSlot(SLOTS.headerActions);
  const sideId = useId();
  const calculatorToggleId = useId();
  /** The side panel open, one at a time (Sean, 2026-10-15): the calculator, Units, or Display. */
  const [side, setSide] = useState<Side | null>(null);
  const calculatorOpen = side === 'calculator';
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
   * Where focus goes back to when a side panel closes from inside: the calculator's icon, when the
   * icon opened it, or where its key was pressed (docs/UX-SPEC.md §8). Null for a settings panel
   * opened from its button, which closes back onto the button.
   */
  const returnTo = useRef<HTMLElement | null>(null);
  const calculatorToggle = () => document.getElementById(calculatorToggleId);

  const openCalculator = (from: HTMLElement | null) => {
    returnTo.current = from;
    setSide('calculator');
  };

  const closeCalculator = (focus: HTMLElement | null = returnTo.current) => {
    setSide(null);
    (focus?.isConnected ? focus : calculatorToggle())?.focus();
  };

  /** The open side panel closed by its key from inside it: focus back where the key opened it. */
  const closeSide = () => {
    const button = {
      calculator: calculatorToggleId,
      units: unitsToggleId,
      display: displayToggleId,
    };
    const toggle = side ? document.getElementById(button[side]) : null;
    const focus = returnTo.current;
    setSide(null);
    (focus?.isConnected ? focus : toggle)?.focus();
  };

  // Alt+C, Alt+V, and Alt+B (⌥ on Apple devices, where Option and a letter type a character)
  // from anywhere on the page open the calculator, Units, and Display, one over whichever was
  // open, and close them. Closed from inside it, focus goes back where it was when a key opened
  // it (from a panel it replaced, where that one was opened from); closed from outside, focus
  // stays put. AltGr, which is Ctrl+Alt, is left alone.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
      const physical = /^Key[A-Z]$/.test(event.code) ? event.code.slice(3).toLowerCase() : '';
      const which =
        SIDE_KEYS[event.key.toLowerCase()] ?? (isApplePlatform() ? SIDE_KEYS[physical] : undefined);
      if (!which) return;
      event.preventDefault();
      const focused = document.activeElement;
      const inside = document.getElementById(sideId)?.contains(focused) ?? false;
      if (side === which) {
        if (inside) closeSide();
        else setSide(null);
        return;
      }
      // With nothing focused, closing comes back to the box.
      if (!inside) {
        returnTo.current =
          focused instanceof HTMLElement && focused !== document.body ? focused : inputRef.current;
      }
      setSide(which);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  /** Units or Display, from its button: opening one closes whichever side panel was open. */
  const toggleSettings = (key: 'units' | 'display') => {
    returnTo.current = null;
    setSide((open) => (open === key ? null : key));
  };

  /** Closed from inside it (its × or Escape), focus goes back to its button. */
  const closeSettings = (key: 'units' | 'display') => {
    setSide(null);
    document.getElementById(key === 'units' ? unitsToggleId : displayToggleId)?.focus();
  };

  /**
   * A change to what shows, from Units or the table (Edit, Hidden), glides: rows slide to their
   * places and a unit checked in Hidden travels to its row (glide.ts). Display's changes rewrite
   * the values in place and need none.
   */
  const changeShown = (update: (settings: Settings) => Settings) =>
    glide(sectionRef.current, () => updateSettings(update));

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

  /**
   * Copies a table row's value as the row shows it (docs/UX-SPEC.md §7; Sean, 2026-10-15), from
   * its copy button or Ctrl/⌘+C. A check in the success color confirms it, and the status line
   * says so; useCopied decides when it reverts.
   */
  const copyRow = (unitId: string) => {
    const row = table.kind === 'units' ? table.rows.find((each) => each.id === unitId) : undefined;
    const text = row ? copiedText(row, settings.display, env.locale) : null;
    if (text !== null) copy(text, `row-${unitId}`);
  };

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

  let sidePanel: ReactNode = calculator;
  if (side === 'units') {
    sidePanel = (
      <UnitsPanel
        settings={settings}
        preference={env.system}
        onSettings={changeShown}
        onClose={() => closeSettings('units')}
      />
    );
  } else if (side === 'display') {
    sidePanel = (
      <DisplayPanel
        settings={settings}
        onSettings={updateSettings}
        onClose={() => closeSettings('display')}
      />
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Unit converter"
      className="mt-6"
      data-hydrated={hydrated ? '' : undefined}
    >
      {/*
        The hint has a line of its own, and the toolbar the next one, over the box it acts on, so
        what to do and the tools to do it with read apart (docs/UX-SPEC.md §1). 8 px over the
        toolbar, as the toolbar sits over the box: nothing in it shows an edge under the hint, the
        menu's text and the icons' glyphs each inset in their buttons (docs/DESIGN-SYSTEM.md,
        "Space by what shows").
      */}
      <p id={hintId} className="mb-2 text-sm text-ink-muted">
        {HINT}
      </p>

      <TableLayout
        leadingTools={
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
              aria-controls={calculatorOpen ? sideId : undefined}
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
            <Button
              variant="ghost"
              square
              id={unitsToggleId}
              data-tool="units"
              aria-label="Units"
              aria-keyshortcuts="Alt+V"
              title={apple ? 'Units (⌥V)' : 'Units (Alt+V)'}
              aria-expanded={side === 'units'}
              aria-controls={side === 'units' ? sideId : undefined}
              on={side === 'units'}
              onClick={() => toggleSettings('units')}
            >
              <ListArrowIcon />
            </Button>
            <Button
              variant="ghost"
              square
              id={displayToggleId}
              data-tool="display"
              aria-label="Display"
              aria-keyshortcuts="Alt+B"
              title={apple ? 'Display (⌥B)' : 'Display (Alt+B)'}
              aria-expanded={side === 'display'}
              aria-controls={side === 'display' ? sideId : undefined}
              on={side === 'display'}
              onClick={() => toggleSettings('display')}
            >
              <RulerIcon />
            </Button>
          </>
        }
        tools={
          <>
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
        settings={settings}
        onSettings={changeShown}
        inputRef={inputRef}
        box={box}
        table={table}
        env={env}
        dispatch={dispatch}
        describedBy={hintId}
        side={sidePanel}
        sideId={sideId}
        sideTypes={side === 'units' || side === 'display'}
        copiedRow={copied?.startsWith('row-') ? copied.slice('row-'.length) : null}
        onCopyRow={copyRow}
        copyRowProps={(row) => ({
          ...pointerProps(`row-${row.id}`),
          title: apple ? 'Copy (⌘C)' : 'Copy (Ctrl+C)',
        })}
      />

      {/* The page's two live regions (docs/UX-SPEC.md §12): the table's sentence, once it settles,
          and action feedback; the side panels' resets and moves have status lines of their own. */}
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
