import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { CopyIcon, RedoIcon, SwapIcon, UndoIcon } from '../../components/icons';
import { useIsHydrated } from '../../lib/hydrated';
import { SmartInput } from './SmartInput';
import type { BoxId, BoxView } from './state';
import { useConverter } from './useConverter';

const COPIED_MS = 1500;

/** The converter island: two linked smart inputs, swap, undo and redo, status lines, and the live region. */
export function Converter() {
  const { state, view, env, dispatch, canUndo, canRedo, announcement } = useConverter();
  const hydrated = useIsHydrated();
  const hintId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [copiedBox, setCopiedBox] = useState<BoxId | null>(null);

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

  const copy = async (value: number, box: BoxId) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedBox(box);
      window.setTimeout(() => setCopiedBox(null), COPIED_MS);
    } catch {
      // Clipboard blocked: nothing to do, the value is visible in the field.
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
        aria-label={copiedBox === box.id ? 'Copied' : `Copy ${label}`}
        onClick={() => copy(value, box.id)}
      >
        <CopyIcon />
      </Button>
    );
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Unit converter"
      className="mt-6"
      data-hydrated={hydrated ? '' : undefined}
    >
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <SmartInput
          box={view.a}
          label="First value"
          describedBy={hintId}
          mode={state.mode}
          env={env}
          dispatch={dispatch}
          trailing={copyButton(view.a, 'first value')}
        />
        <div className="flex justify-center sm:pt-1.5">
          <Button
            variant="secondary"
            square
            aria-label="Swap sides"
            onClick={() => dispatch({ type: 'swap' })}
          >
            <SwapIcon className="rotate-90 sm:rotate-0" />
          </Button>
        </div>
        <SmartInput
          box={view.b}
          label="Second value"
          describedBy={hintId}
          mode={state.mode}
          env={env}
          dispatch={dispatch}
          trailing={copyButton(view.b, 'second value')}
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <p id={hintId} className="text-sm text-ink-muted">
          Type a number, a unit, or both into either box, like{' '}
          <span className="font-numeric text-ink">5 ml</span>. The other box follows.
        </p>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            square
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={() => dispatch({ type: 'undo' })}
          >
            <UndoIcon />
          </Button>
          <Button
            variant="ghost"
            square
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={() => dispatch({ type: 'redo' })}
          >
            <RedoIcon />
          </Button>
        </div>
      </div>
      {view.notice && (
        <p role="status" className="mt-2 text-sm text-ink">
          {view.notice}
        </p>
      )}
      {view.error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {view.error}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement ?? ''}
      </p>
    </section>
  );
}
