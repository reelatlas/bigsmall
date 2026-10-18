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
import { track } from '../../lib/analytics';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { pressedByTouch } from '../../lib/modality';
import { isApplePlatform } from '../../lib/platform';
import { cx, IN_CONVERTER_GRID } from '../../lib/recipes';
import { INTRO } from '../../lib/site';
import { SLOTS, useSlot } from '../../lib/slots';
import { entryMessage, isStepKey, placeNumber, pressKey } from './calculator';
import { glide } from './glide';
import { DisplayPanel, UnitsPanel } from './SettingsPanels';
import type { Settings } from './settings';
import { TableLayout, type ToolbarTool } from './TableLayout';
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

/** What a side panel's opening is counted as (ADR 0019). */
const SIDE_OPENED = {
  calculator: 'Calculator opened',
  units: 'Units opened',
  display: 'Display opened',
} as const;

/**
 * The converter island (ADR 0012, ADR 0013, ADR 0018, docs/UX-SPEC.md §1): the intro; the
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
  const introId = useId();
  const calcMessageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { copied, copy, markCopied, pointerProps } = useCopied<Confirmable>();
  const headerActions = useSlot(SLOTS.headerActions);
  const sideId = useId();
  const calculatorToggleId = useId();
  /** The side panel open, one at a time (Sean, 2026-10-15): the calculator, Units, or Display. */
  const [side, setSide] = useState<Side | null>(null);
  const calculatorOpen = side === 'calculator';
  // Counted however a side panel opens, from its button or its key (ADR 0019).
  useEffect(() => {
    if (side) track(SIDE_OPENED[side]);
  }, [side]);
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
    if (!pressedByTouch()) inputRef.current?.focus({ preventScroll: true });
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
  /**
   * A tool's button by its id, or, where the toolbar's row had no room for it and folded it into
   * More (TableLayout, ADR 0023), the More trigger, so focus coming back to a tool lands on
   * something shown.
   */
  const toolElement = (id: string): HTMLElement | null =>
    document.getElementById(id) ??
    sectionRef.current?.querySelector<HTMLElement>('[data-tool="more"]') ??
    null;
  const calculatorToggle = () => toolElement(calculatorToggleId);

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
    const toggle = side ? toolElement(button[side]) : null;
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
    toolElement(key === 'units' ? unitsToggleId : displayToggleId)?.focus();
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
    track('Calculator sent');
  };

  /**
   * Copies a table row's value as the row shows it (docs/UX-SPEC.md §7; Sean, 2026-10-15), from
   * its copy button or Ctrl/⌘+C. A check in the success color confirms it, and the status line
   * says so; useCopied decides when it reverts.
   */
  const copyRow = (unitId: string) => {
    const row = table.kind === 'units' ? table.rows.find((each) => each.id === unitId) : undefined;
    const text = row ? copiedText(row, settings.display, env.locale) : null;
    if (text === null) return;
    copy(text, `row-${unitId}`);
    // The pair someone needed: from the box's unit to the row's (ADR 0019).
    track('Value copied', { from: box.unit?.id ?? '', to: unitId });
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

  /**
   * The toolbar's tools after the category menu, in the order they show (docs/UX-SPEC.md §1): the
   * calculator, Units, and Display at the left, undo, redo, a rule, and clear all at the right end.
   * The layout draws each as a button on the row or, where a pointer's row has no room for it, as
   * an item of More (TableLayout, ADR 0023).
   */
  const tools: ToolbarTool[] = [
    {
      id: 'calculator',
      group: 'leading',
      label: 'Calculator',
      icon: <CalculatorIcon />,
      keys: 'Alt+C',
      title: apple ? 'Calculator (⌥C)' : 'Calculator (Alt+C)',
      expanded: calculatorOpen,
      controls: calculatorOpen ? sideId : undefined,
      on: calculatorOpen,
      elementId: calculatorToggleId,
      onPress: () => {
        // Closed with the icon, focus stays on it, wherever the calculator was opened from.
        const icon = calculatorToggle();
        if (calculatorOpen) closeCalculator(icon);
        else openCalculator(icon);
      },
    },
    {
      id: 'units',
      group: 'leading',
      label: 'Units',
      icon: <ListArrowIcon />,
      keys: 'Alt+V',
      title: apple ? 'Units (⌥V)' : 'Units (Alt+V)',
      expanded: side === 'units',
      controls: side === 'units' ? sideId : undefined,
      on: side === 'units',
      elementId: unitsToggleId,
      onPress: () => toggleSettings('units'),
    },
    {
      id: 'display',
      group: 'leading',
      label: 'Display',
      icon: <RulerIcon />,
      keys: 'Alt+B',
      title: apple ? 'Display (⌥B)' : 'Display (Alt+B)',
      expanded: side === 'display',
      controls: side === 'display' ? sideId : undefined,
      on: side === 'display',
      elementId: displayToggleId,
      onPress: () => toggleSettings('display'),
    },
    {
      id: 'undo',
      group: 'end',
      label: 'Undo',
      icon: <UndoIcon />,
      keys: 'Control+Z Meta+Z',
      title: apple ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)',
      disabled: !canUndo,
      onPress: () => dispatch({ type: 'undo' }),
    },
    {
      id: 'redo',
      group: 'end',
      label: 'Redo',
      icon: <RedoIcon />,
      keys: 'Control+Y Control+Shift+Z Meta+Shift+Z Meta+Y',
      title: apple ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)',
      disabled: !canRedo,
      onPress: () => dispatch({ type: 'redo' }),
    },
    {
      id: 'clear',
      group: 'end',
      // Clearing is a different kind of step from undo and redo, so a rule sets it apart.
      dividerBefore: true,
      label: 'Clear all',
      icon: <EraserIcon />,
      disabled: isEmpty,
      onPress: clearAll,
    },
  ];

  return (
    <section
      ref={sectionRef}
      aria-label="Unit converter"
      className={cx('mt-6', IN_CONVERTER_GRID)}
      data-hydrated={hydrated ? '' : undefined}
    >
      {/*
        The intro, what bigsmall does, has a line of its own, and the toolbar the next one, over
        the box it acts on, so what to do and the tools to do it with read apart (docs/UX-SPEC.md
        §1); it describes the box to screen readers too. 8 px over the toolbar, as the toolbar sits
        over the box: nothing in it shows an edge under the intro, the
        menu's text and the icons' glyphs each inset in their buttons (docs/DESIGN-SYSTEM.md,
        "Space by what shows").
      */}
      <p id={introId} className="mb-2 text-sm text-ink-muted md:col-start-1">
        {INTRO}
      </p>

      <TableLayout
        tools={tools}
        settings={settings}
        onSettings={changeShown}
        inputRef={inputRef}
        box={box}
        table={table}
        env={env}
        dispatch={dispatch}
        describedBy={introId}
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
            onClick={() => {
              copy(urlFor(state, env.separators, window.location), 'url');
              track('URL copied');
            }}
            {...pointerProps('url')}
          >
            {copied === 'url' ? <CopiedIcon /> : <LinkIcon />}
          </Button>,
          headerActions,
        )}
    </section>
  );
}
