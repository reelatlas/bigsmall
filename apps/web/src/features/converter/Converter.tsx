import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { CopyIcon, SwapIcon } from '../../components/icons';
import { useIsHydrated } from '../../lib/hydrated';
import { SmartInput } from './SmartInput';
import type { BoxId } from './state';
import { useConverter } from './useConverter';

const COPIED_MS = 1500;

/** The converter island: two linked smart inputs, a swap control, status lines, and the live region. */
export function Converter() {
  const { state, view, env, dispatch, announcement } = useConverter();
  const hydrated = useIsHydrated();
  const hintId = useId();
  const [copied, setCopied] = useState(false);

  const copyResult = async () => {
    if (!view.result) return;
    try {
      await navigator.clipboard.writeText(String(view.result.value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard blocked: nothing to do, the value is visible in the field.
    }
  };

  const copyButton = (box: BoxId) =>
    view.result?.box === box ? (
      <Button
        variant="ghost"
        square
        aria-label={copied ? 'Copied' : 'Copy result'}
        onClick={copyResult}
      >
        <CopyIcon />
      </Button>
    ) : undefined;

  return (
    <section aria-label="Unit converter" className="mt-6" data-hydrated={hydrated ? '' : undefined}>
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <SmartInput
          box={view.a}
          label="First value"
          describedBy={hintId}
          mode={state.mode}
          env={env}
          dispatch={dispatch}
          trailing={copyButton('a')}
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
          trailing={copyButton('b')}
        />
      </div>

      <p id={hintId} className="mt-3 text-sm text-ink-muted">
        Type a number, a unit, or both into either box, like{' '}
        <span className="font-numeric text-ink">5 ml</span>. The other box follows.
      </p>
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
