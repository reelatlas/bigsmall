import { formatNumber, getCategory, parse } from '@bigsmall/core';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import {
  CalculatorIcon,
  CheckIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  RedoIcon,
  SwapIcon,
  UndoIcon,
} from '../../components/icons';
import { Calculator, SendButton, type CalculatorKey } from '../../components/Calculator';
import { NumberText, runningValue } from '../../components/NumberText';
import { ToolbarDivider } from '../../components/ToolbarDivider';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { cx } from '../../lib/recipes';
import { isApplePlatform } from '../../lib/platform';
import { SLOTS, useSlot } from '../../lib/slots';
import { entryMessage, isStepKey, placeNumber, pressKey } from './calculator';
import { SmartInput } from './SmartInput';
import type { BoxId, BoxView } from './state';
import { urlFor } from './url';
import { useConverter } from './useConverter';

/**
 * The buttons that confirm with a check: copying a box's value or the page's URL, and sending the
 * calculator's value to a box. What the status region says for each.
 */
type Confirmable = BoxId | 'url' | `use-${BoxId}`;
const CONFIRMATION: Record<Confirmable, string> = {
  a: 'Copied',
  b: 'Copied',
  url: 'URL copied',
  'use-a': 'Sent to the first value',
  'use-b': 'Sent to the second value',
};

/** What each empty box suggests before anything scopes it; the second shows a category can be typed too. */
const EXAMPLES: Record<BoxId, string> = {
  a: '5 ml, feet, °F…',
  b: '2 kg, inches, speed…',
};

/**
 * The converter island: the hint with undo, redo, and clear all, two linked smart inputs with
 * swap between them, the category label under the box the conversion is anchored on, and the
 * live region; the calculator below the boxes when it is open (docs/UX-SPEC.md §8). It also draws the
 * Copy URL button into the header's slot (§7).
 */
export function Converter() {
  const { state, view, env, dispatch, canUndo, canRedo, escapeTargets, announcement } =
    useConverter();
  const hydrated = useIsHydrated();
  // Tooltips name the platform's keys; until hydration they read as on the server (Ctrl).
  const apple = hydrated && isApplePlatform();
  const hintId = useId();
  const calcMessageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { copied, markCopied, pointerProps } = useCopied<Confirmable>();
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
  const categoryName = view.category ? getCategory(view.category)?.name : undefined;
  const isEmpty = !state.a.text && !state.a.unit && !state.b.text && !state.b.unit;

  /** Clear both boxes (undoable like any other step) and put the caret back in the first box. */
  const clearAll = () => {
    dispatch({ type: 'clear' });
    sectionRef.current?.querySelector<HTMLInputElement>('input[role="combobox"]')?.focus();
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

  const copy = async (text: string, target: Confirmable) => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied(target);
    } catch {
      // Clipboard blocked: no check, and the value or the address is still visible.
    }
  };

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
   * "Use in 1st": the entry's value, its running value if = was not pressed, replaces the box's
   * number or fills an empty box, keeping its unit. One undoable step that makes the box the
   * source.
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

  const sendButton = (id: BoxId, ordinal: string) => (
    <SendButton
      ordinal={ordinal}
      symbol={view[id].unit?.symbol}
      confirmed={copied === `use-${id}`}
      unavailable={entryValue === undefined}
      aria-describedby={calcMessage ? calcMessageId : undefined}
      onClick={() => send(id)}
      {...pointerProps(`use-${id}`)}
    />
  );

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
        {copied === box.id ? <CheckIcon className="text-success" data-copied /> : <CopyIcon />}
      </Button>
    );
  };

  /**
   * The category label sits under the box the conversion is anchored on, left-aligned with the
   * value in both boxes so it reads right beside what the user typed. It says both what kind of
   * units these are and which side is driving; after a switch of category it simply names the
   * new one, under the box that switched it. Not a live region: the result announcement already
   * names the units (docs/UX-SPEC.md §12).
   */
  const categoryLabel = (id: BoxId) => (
    <p
      data-category-label={id}
      className="mt-1.5 min-h-5 px-4.5 text-sm font-medium text-ink-muted"
    >
      {view.anchor === id ? (categoryName ?? '') : ''}
    </p>
  );

  const renderBox = (box: BoxView, label: string, counterpart: BoxView, placement: string) => (
    <div className={cx('min-w-0', placement)}>
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
      />
      {categoryLabel(box.id)}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Unit converter"
      className="mt-6"
      data-hydrated={hydrated ? '' : undefined}
    >
      {/*
        The hint has a line of its own, and the toolbar the next one, right-aligned over the
        boxes it acts on, so what to do and the tools to do it with read apart (docs/UX-SPEC.md §1).
      */}
      <div className="mb-2 flex flex-col gap-1">
        <p id={hintId} className="text-sm text-ink-muted">
          Type a number, unit, or both. Once each box has a unit, typing in one updates the other.
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
          {/* Opening the calculator is a different kind of action from undo and redo. */}
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
        The DOM order is first box, second box, swap, so Tab goes from one value straight to the
        other; the grid still draws swap between them (docs/UX-SPEC.md §8). sm:pt-2.5 centers the
        44 px swap button on the 64 px fields.
      */}
      <div className="grid grid-cols-1 items-start gap-x-3 gap-y-2 sm:grid-cols-[1fr_auto_1fr]">
        {renderBox(view.a, 'First value', view.b, 'row-start-1 sm:col-start-1')}
        {renderBox(view.b, 'Second value', view.a, 'row-start-3 sm:col-start-3 sm:row-start-1')}
        <div className="row-start-2 flex justify-center sm:col-start-2 sm:row-start-1 sm:pt-2.5">
          <Button
            variant="ghost"
            square
            aria-label="Swap sides"
            onClick={() => dispatch({ type: 'swap' })}
          >
            <SwapIcon className="rotate-90 sm:rotate-0" />
          </Button>
        </div>
      </div>

      {calculatorOpen && (
        <div id={calculatorId} className="mx-auto mt-4 max-w-sm">
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
              <>
                {sendButton('a', '1st')}
                {sendButton('b', '2nd')}
              </>
            }
          />
        </div>
      )}

      {/* The two live regions (docs/UX-SPEC.md §12): the result, once it settles; and action feedback. */}
      <p aria-live="polite" className="sr-only">
        {announcement ?? ''}
      </p>
      <p role="status" className="sr-only">
        {copied ? CONFIRMATION[copied] : ''}
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
            {copied === 'url' ? <CheckIcon className="text-success" data-copied /> : <LinkIcon />}
          </Button>,
          headerActions,
        )}
    </section>
  );
}
