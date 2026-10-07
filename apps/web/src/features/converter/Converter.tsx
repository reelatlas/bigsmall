import { getCategory } from '@bigsmall/core';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button';
import {
  CheckIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  RedoIcon,
  SwapIcon,
  UndoIcon,
} from '../../components/icons';
import { useCopied } from '../../lib/copied';
import { useIsHydrated } from '../../lib/hydrated';
import { isApplePlatform } from '../../lib/platform';
import { SLOTS, useSlot } from '../../lib/slots';
import { SmartInput } from './SmartInput';
import type { BoxId, BoxView } from './state';
import { linkFor } from './url';
import { useConverter } from './useConverter';

/** What a copy button copies: one box's value, or the link to the whole conversion. */
type CopyTarget = BoxId | 'link';

/** What each empty box suggests before anything scopes it; the second shows a category can be typed too. */
const EXAMPLES: Record<BoxId, string> = {
  a: '5 ml, feet, °F…',
  b: '2 kg, inches, speed…',
};

/**
 * The converter island: the hint with undo, redo, and clear all, two linked smart inputs with
 * swap between them, the category label under the box the conversion is anchored on, and the
 * live region. It also draws the copy-link button into the header's slot (docs/UX-SPEC.md §7).
 */
export function Converter() {
  const { state, view, env, dispatch, canUndo, canRedo, escapeTargets, announcement } =
    useConverter();
  const hydrated = useIsHydrated();
  // Tooltips name the platform's keys; until hydration they read as on the server (Ctrl).
  const apple = hydrated && isApplePlatform();
  const hintId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { copied, markCopied, pointerProps } = useCopied<CopyTarget>();
  const headerActions = useSlot(SLOTS.headerActions);
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

  const copy = async (text: string, target: CopyTarget) => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied(target);
    } catch {
      // Clipboard blocked: no check, and the value or the address is still visible.
    }
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
    <div className={`min-w-0 ${placement}`}>
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
      <div className="mb-2 flex items-start justify-between gap-3">
        {/* pt-3 centers the first line of the hint on the 44 px toolbar buttons. */}
        <p id={hintId} className="pt-3 text-sm text-ink-muted">
          Type a number, unit, or both. Once each box has a unit, typing in one updates the other.
        </p>
        <div className="flex shrink-0 items-center gap-1">
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
          <span aria-hidden="true" className="mx-1 h-6 border-l border-line" />
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

      {/* The two live regions (docs/UX-SPEC.md §12): the result, once it settles; and action feedback. */}
      <p aria-live="polite" className="sr-only">
        {announcement ?? ''}
      </p>
      <p role="status" className="sr-only">
        {copied === 'link' ? 'Link copied' : copied ? 'Copied' : ''}
      </p>

      {/* Drawn into the header so it copies from this state, not from the address bar. */}
      {headerActions &&
        createPortal(
          <Button
            variant="ghost"
            square
            aria-label="Copy link"
            title="Copy link"
            onClick={() => copy(linkFor(state, env.separators, window.location), 'link')}
            {...pointerProps('link')}
          >
            {copied === 'link' ? <CheckIcon className="text-success" data-copied /> : <LinkIcon />}
          </Button>,
          headerActions,
        )}
    </section>
  );
}
