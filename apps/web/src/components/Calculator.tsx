import { useId, useLayoutEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useFitStep } from '../lib/fit-step';
import { CARD, cx, FIELD_ROW, NUMBER_SIZES } from '../lib/recipes';
import { Button, type ButtonVariant } from './Button';
import { BackspaceIcon, CloseIcon, CopiedIcon } from './icons';

export type CalculatorKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'decimal'
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'exponent'
  | 'equals'
  | 'backspace'
  | 'clear';

interface KeyDef {
  key: CalculatorKey;
  /** What the key shows; the decimal key shows the visitor's own mark. */
  face: ReactNode;
  /** What a screen reader says. */
  name: string;
  variant: ButtonVariant;
}

const digit = (key: CalculatorKey): KeyDef => ({ key, face: key, name: key, variant: 'secondary' });

/** Physical keys that press a calculator key while focus is inside it. */
const TYPED: Readonly<Record<string, CalculatorKey>> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'power',
  e: 'exponent',
  E: 'exponent',
  '=': 'equals',
  '.': 'decimal',
  ',': 'decimal',
  Backspace: 'backspace',
};

/** The display's text: one line, sized down like a long number in a field, its end kept in view. */
const DISPLAY_TEXT = 'min-w-0 flex-1 overflow-hidden font-numeric whitespace-pre text-ink';

/** Marks what Tab moves between: close, =, and each send button. Enter presses the one focused. */
const STOP = 'data-calculator-stop';

export interface CalculatorProps {
  /** What the display shows, such as a NumberText; empty shows a muted 0. */
  display: ReactNode;
  /**
   * Why the entry has no value ("Too large"), shown at the right of the display in the danger
   * color and joined to the description of = (and of the caller's send buttons, by `messageId`).
   */
  message?: string | null;
  /** The message's id, for the caller's buttons to name it in `aria-describedby`. */
  messageId?: string;
  /** The visitor's decimal mark, "." or ",". */
  decimalMark: string;
  onPress: (key: CalculatorKey) => void;
  /** Escape inside the calculator: the caller steps back or closes. */
  onEscape: () => void;
  /** The close button. */
  onClose: () => void;
  /** Move focus onto = when it mounts, which is what opening does. False for gallery samples. */
  focusOnOpen?: boolean;
  /** Under the keys: the buttons that send the value to a box, sharing the row's width. */
  footer?: ReactNode;
}

/**
 * A calculator with its own display. While it is open it holds the keyboard: focus moves in,
 * every typed key presses its key (digits, ". ,", "+ - * / ^", "e", "=", Backspace), Tab and
 * Shift+Tab cycle through close, =, and each send button, and Enter presses whichever has focus,
 * so focus always shows what Enter will do. Escape is the caller's (step back, then close). The
 * other keys stay out of the Tab order, and a click on one returns the keyboard to the calculator
 * without moving focus off the key Enter would press. Clicking elsewhere on the page leaves it
 * open. What a key does is the caller's (features/converter/calculator.ts).
 */
export function Calculator({
  display,
  message = null,
  messageId,
  decimalMark,
  onPress,
  onEscape,
  onClose,
  footer,
  focusOnOpen = true,
}: CalculatorProps) {
  const titleId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const size = NUMBER_SIZES[useFitStep(displayRef, DISPLAY_TEXT, NUMBER_SIZES)];
  const keys: KeyDef[] = [
    { key: 'clear', face: 'C', name: 'clear', variant: 'tonal' },
    { key: 'backspace', face: <BackspaceIcon />, name: 'backspace', variant: 'tonal' },
    { key: 'power', face: '^', name: 'to the power of', variant: 'soft' },
    { key: 'divide', face: '÷', name: 'divided by', variant: 'soft' },
    digit('7'),
    digit('8'),
    digit('9'),
    { key: 'multiply', face: '×', name: 'times', variant: 'soft' },
    digit('4'),
    digit('5'),
    digit('6'),
    { key: 'subtract', face: '−', name: 'minus', variant: 'soft' },
    digit('1'),
    digit('2'),
    digit('3'),
    { key: 'add', face: '+', name: 'plus', variant: 'soft' },
    { key: 'exponent', face: 'E', name: 'times ten to the power of', variant: 'tonal' },
    digit('0'),
    {
      key: 'decimal',
      face: decimalMark,
      name: decimalMark === ',' ? 'decimal comma' : 'decimal point',
      variant: 'tonal',
    },
    { key: 'equals', face: '=', name: 'equals', variant: 'primary' },
  ];

  // Past the smallest size, the end of the entry stays in view, where the next key lands.
  useLayoutEffect(() => {
    const line = displayRef.current;
    if (line) line.scrollLeft = line.scrollWidth;
  });

  // Opening moves focus in, onto =, so typing and Enter reach the calculator at once. Layout
  // effects commit with the render; Preact runs plain effects after paint, a frame too late for
  // keys typed straight after the click that opened it.
  useLayoutEffect(() => {
    if (focusOnOpen) groupRef.current?.querySelector<HTMLElement>(`[${STOP}="equals"]`)?.focus();
  }, [focusOnOpen]);

  // Native listeners, like the converter's undo keys: the group is not itself interactive. Bound
  // in a layout effect too, so a key typed straight after another reaches the onPress that knows
  // the latest entry.
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const stops = () => [...group.querySelectorAll<HTMLElement>(`[${STOP}]`)];
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const all = stops();
        const at = all.indexOf(document.activeElement as HTMLElement);
        const step = event.shiftKey ? -1 : 1;
        all[at < 0 ? 0 : (at + step + all.length) % all.length]?.focus();
        return;
      }
      if (
        event.key === 'Enter' &&
        !(document.activeElement as HTMLElement | null)?.hasAttribute(STOP)
      ) {
        event.preventDefault();
        onPress('equals');
        return;
      }
      const key = /^[0-9]$/.test(event.key) ? (event.key as CalculatorKey) : TYPED[event.key];
      if (!key) return;
      event.preventDefault();
      onPress(key);
    };
    // A click anywhere but on a stop leaves focus where it is, or brings it back to = if it had
    // left the calculator, so typing reaches the calculator again.
    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as Element).closest(`[${STOP}]`)) return;
      event.preventDefault();
      if (!group.contains(document.activeElement)) {
        group.querySelector<HTMLElement>(`[${STOP}="equals"]`)?.focus();
      }
    };
    // After a send, focus goes back to =, so the next keys start a new entry and Enter cannot
    // send the same number again. A send with nothing to send leaves focus where it is.
    const onClick = (event: MouseEvent) => {
      const send = (event.target as Element).closest(`[${STOP}="send"]`);
      if (send && send.getAttribute('aria-disabled') !== 'true') {
        group.querySelector<HTMLElement>(`[${STOP}="equals"]`)?.focus();
      }
    };
    group.addEventListener('keydown', onKeyDown);
    group.addEventListener('mousedown', onMouseDown);
    group.addEventListener('click', onClick);
    return () => {
      group.removeEventListener('keydown', onKeyDown);
      group.removeEventListener('mousedown', onMouseDown);
      group.removeEventListener('click', onClick);
    };
  }, [onPress, onEscape]);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-labelledby={titleId}
      className={cx(CARD, 'p-3 shadow-sm')}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id={titleId} className="pl-1 text-sm font-medium text-ink-muted">
          Calculator
        </h2>
        <Button
          variant="ghost"
          square
          aria-label="Close calculator"
          data-calculator-stop="close"
          onClick={onClose}
        >
          <CloseIcon />
        </Button>
      </div>
      {/* The display has a field's size and edge, so it reads as where the typing goes. */}
      <div className="mb-3 rounded-lg border-2 border-edge bg-surface">
        <div className={FIELD_ROW}>
          <div ref={displayRef} className={cx(DISPLAY_TEXT, size)} data-entry>
            {display || <span className="text-ink-muted">0</span>}
          </div>
          {message && (
            <span
              id={messageId}
              className="shrink-0 text-sm font-medium text-danger"
              data-calculator-message
            >
              {message}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map((def) => (
          <Button
            key={def.key}
            variant={def.variant}
            aria-label={def.name}
            aria-describedby={def.key === 'equals' && message ? messageId : undefined}
            tabIndex={def.key === 'equals' ? undefined : -1}
            data-calculator-stop={def.key === 'equals' ? 'equals' : undefined}
            onClick={() => onPress(def.key)}
            className="min-h-12 font-numeric text-lg"
          >
            {def.face}
          </Button>
        ))}
      </div>
      {/* One column per send button, shared equally: two split the row, one fills it. */}
      {footer && <div className="mt-2 grid auto-cols-fr grid-flow-col gap-2">{footer}</div>}
    </div>
  );
}

export interface SendButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'disabled'
> {
  /** "1st" or "2nd" with two boxes ("Use in 1st"); without one it reads "Use", for the table's one box. */
  ordinal?: string | undefined;
  /** The box's unit symbol, once it has one. */
  symbol?: string | undefined;
  /** Shows the check that confirms a send, the one copy uses. */
  confirmed: boolean;
  /** Nothing to send yet. The button stays a Tab stop, so Tab always cycles the same three. */
  unavailable: boolean;
}

/** "Use in 1st": puts the calculator's value into a box. Named by what it shows. */
export function SendButton({ ordinal, symbol, confirmed, unavailable, ...props }: SendButtonProps) {
  return (
    <Button
      variant="secondary"
      className="min-h-12 text-sm"
      data-calculator-stop="send"
      aria-disabled={unavailable || undefined}
      {...props}
    >
      {confirmed && <CopiedIcon />}
      <span>{ordinal ? `Use in ${ordinal}` : 'Use'}</span>
      {symbol && <span className="font-semibold">{symbol}</span>}
    </Button>
  );
}
