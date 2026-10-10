import { useId, useLayoutEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useFitStep } from '../lib/fit-step';
import { CARD, cx, FIELD_ROW, NO_ANSWER, NUMBER_SIZES, PANEL_TITLE } from '../lib/recipes';
import { nextInDirection, type Box, type Direction } from '../lib/spatial';
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

/** The arrow keys, which move focus between the calculator's buttons by where they sit. */
const ARROWS: Readonly<Record<string, Direction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

/** Where an element sits on screen, for spatial navigation. */
function boxOf(element: HTMLElement): Box & { element: HTMLElement } {
  const { left, right, top, bottom } = element.getBoundingClientRect();
  return { element, left, right, top, bottom };
}

/**
 * The card while focus is inside it, where the keys go: its edge turns accent, 2 px like a
 * focused box (its 1 px border and a 1 px ring, so nothing moves), easing as the shells' edges do.
 */
const ACTIVE =
  'transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-1 focus-within:ring-accent';

/** The display's text: one line, sized down like a long number in a field, its end kept in view. */
const DISPLAY_TEXT = 'min-w-0 flex-1 overflow-hidden font-numeric whitespace-pre text-ink';

/** Marks what Tab moves between: close, =, and each send button. Enter presses the one focused. */
const STOP = 'data-calculator-stop';

/** The = key of the calculator inside `container`, where opening puts focus. */
function equalsIn(container: ParentNode | null | undefined): HTMLElement | null {
  return container?.querySelector<HTMLElement>(`[${STOP}="equals"]`) ?? null;
}

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
  /** Under the keys: the button that sends the value to the box, the row's width. */
  footer?: ReactNode;
}

/**
 * A calculator with its own display. While it is open it holds the keyboard: focus moves in,
 * every typed key presses its key (digits, ". ,", "+ - * / ^", "e", "=", Backspace) and brings
 * focus back to =, the arrow keys move focus between its buttons by where they sit, Tab and
 * Shift+Tab cycle through close, =, and each send button, and Enter presses whichever has focus,
 * so focus always shows what Enter will do. Escape is the caller's (step back, then close). The
 * other keys stay out of the Tab order, and a click on one returns the keyboard to the calculator
 * without moving focus off the key Enter would press. Clicking elsewhere on the page leaves it
 * open. What a key does is the caller's (features/converter/calculator.ts).
 *
 * The card is three parts, one after another: the title row, the display, and the keys with the
 * footer. A host that makes the card a subgrid lines them up with rows of its own (TableLayout
 * from md: the display level with the box).
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
  /**
   * The column the arrows keep to while moving up and down, as a text editor keeps the caret's,
   * so ↓ to the send button and back ↑ returns to the key it left. Any other move forgets it.
   */
  const goalX = useRef<number | null>(null);
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
    if (focusOnOpen) equalsIn(groupRef.current)?.focus();
  }, [focusOnOpen]);

  // Native listeners, like the converter's undo keys: the group is not itself interactive. Bound
  // in a layout effect too, so a key typed straight after another reaches the onPress that knows
  // the latest entry.
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const stops = () => [...group.querySelectorAll<HTMLElement>(`[${STOP}]`)];
    const equals = () => equalsIn(group);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        goalX.current = null;
        const all = stops();
        const at = active ? all.indexOf(active) : -1;
        const step = event.shiftKey ? -1 : 1;
        if (at >= 0) {
          all[(at + step + all.length) % all.length]?.focus();
          return;
        }
        // From a key the arrows reached, on to the next stop in reading order, or back to the one before.
        const follows = (stop: HTMLElement) =>
          !!active &&
          (active.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
        const next = event.shiftKey
          ? (all.filter((stop) => !follows(stop)).at(-1) ?? all.at(-1))
          : (all.find(follows) ?? all[0]);
        next?.focus();
        return;
      }
      const direction = ARROWS[event.key];
      if (direction) {
        event.preventDefault();
        const from = active && group.contains(active) ? active : equals();
        if (!from) return;
        const buttons = [...group.querySelectorAll<HTMLElement>('button')].map(boxOf);
        const start = boxOf(from);
        const vertical = direction === 'up' || direction === 'down';
        const goal = vertical ? (goalX.current ?? (start.left + start.right) / 2) : undefined;
        const at = buttons.find((each) => each.element === from) ?? start;
        const next = nextInDirection(at, buttons, direction, goal);
        if (!next) return;
        next.element.focus();
        goalX.current = goal ?? null;
        return;
      }
      // Enter on a button presses it, as native buttons do; Enter anywhere else inside works it out.
      if (event.key === 'Enter' && !(active instanceof HTMLButtonElement)) {
        event.preventDefault();
        onPress('equals');
        return;
      }
      const key = /^[0-9]$/.test(event.key) ? (event.key as CalculatorKey) : TYPED[event.key];
      if (!key) return;
      event.preventDefault();
      onPress(key);
      // Typing works on the display, so Enter after it should work the sum out: focus goes back to =.
      goalX.current = null;
      if (active !== equals()) equals()?.focus();
    };
    // A click anywhere but on a stop leaves focus where it is, or brings it back to = if it had
    // left the calculator, so typing reaches the calculator again.
    const onMouseDown = (event: MouseEvent) => {
      if ((event.target as Element).closest(`[${STOP}]`)) return;
      event.preventDefault();
      if (!group.contains(document.activeElement)) {
        equalsIn(group)?.focus();
      }
    };
    // After a send, focus goes back to =, so the next keys start a new entry and Enter cannot
    // send the same number again. A send with nothing to send leaves focus where it is.
    const onClick = (event: MouseEvent) => {
      const send = (event.target as Element).closest(`[${STOP}="send"]`);
      if (send && send.getAttribute('aria-disabled') !== 'true') {
        equalsIn(group)?.focus();
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
      className={cx(CARD, 'p-3 shadow-sm', ACTIVE)}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id={titleId} className={cx('pl-1', PANEL_TITLE)}>
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
      <div className="rounded-lg border-2 border-edge bg-surface">
        <div className={FIELD_ROW}>
          <div ref={displayRef} className={cx(DISPLAY_TEXT, size)} data-entry>
            {display || <span className="text-ink-muted">0</span>}
          </div>
          {message && (
            <span id={messageId} className={cx('shrink-0', NO_ANSWER)} data-calculator-message>
              {message}
            </span>
          )}
        </div>
      </div>
      {/*
        The keys and the footer, one part, 12 px under the display. The gaps are the title row's
        bottom margin and this top margin, never the display's own, so in a host's rows (subgrid)
        the display stays exactly as tall as its row.
      */}
      <div className="mt-3">
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
    </div>
  );
}

export interface SendButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'disabled'
> {
  /** The box's unit symbol, once it has one. */
  symbol?: string | undefined;
  /** Shows the check that confirms a send, the one copy uses. */
  confirmed: boolean;
  /** Nothing to send yet. The button stays a Tab stop, so Tab always cycles the same three. */
  unavailable: boolean;
}

/**
 * "Use": puts the calculator's value into the box. Named by what it shows, "Use mL". A send done
 * shows the copy check after the label, drawing itself in, as a labelled button's confirmation does
 * (docs/DESIGN-SYSTEM.md, "Motion"; Sean, 2026-10-10).
 */
export function SendButton({ symbol, confirmed, unavailable, ...props }: SendButtonProps) {
  return (
    <Button
      variant="secondary"
      className="min-h-12 text-sm"
      data-calculator-stop="send"
      aria-disabled={unavailable || undefined}
      {...props}
    >
      <span>Use</span>
      {symbol && <span className="font-semibold">{symbol}</span>}
      {confirmed && <CopiedIcon className="check-draw text-success" />}
    </Button>
  );
}
