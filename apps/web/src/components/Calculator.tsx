import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { NUMBER_SIZES, useFitStep } from '../lib/fit-step';
import { Button, type ButtonVariant } from './Button';
import { BackspaceIcon, CheckIcon } from './icons';

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
  wide?: boolean;
}

const digit = (key: CalculatorKey): KeyDef => ({ key, face: key, name: key, variant: 'secondary' });

/** Physical keys that press a calculator key while focus is inside it. */
const TYPED: Readonly<Record<string, CalculatorKey>> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '=': 'equals',
  '.': 'decimal',
  ',': 'decimal',
  Backspace: 'backspace',
};

/** The entry line: right-aligned, one line, sized down like a long number in a field. */
const ENTRY = 'overflow-hidden text-right font-numeric whitespace-pre text-ink';

export interface CalculatorProps {
  /** What was entered, such as "12×3". */
  entry: string;
  /** The running value of arithmetic ("36"), or null when the entry is not arithmetic. */
  running: string | null;
  /** The visitor's decimal mark, "." or ",". */
  decimalMark: string;
  onPress: (key: CalculatorKey) => void;
  /** Escape inside the calculator. */
  onClose: () => void;
  /** Under the keys: the buttons that send the value to a box. */
  footer?: ReactNode;
}

/**
 * A calculator with its own display: digits, the decimal mark, + − × ÷, =, backspace, and clear,
 * as native buttons at least 48 px tall in a labelled group. Typing a digit, an operator, ".",
 * ",", "=", or Backspace while focus is inside presses the matching key; Enter and Space press
 * the focused key, as for any button. What a key does is the caller's
 * (features/converter/calculator.ts).
 */
export function Calculator({
  entry,
  running,
  decimalMark,
  onPress,
  onClose,
  footer,
}: CalculatorProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLDivElement>(null);
  const size = NUMBER_SIZES[useFitStep(entryRef, ENTRY, NUMBER_SIZES)];
  const keys: KeyDef[] = [
    { key: 'clear', face: 'C', name: 'clear', variant: 'secondary', wide: true },
    { key: 'backspace', face: <BackspaceIcon />, name: 'backspace', variant: 'secondary' },
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
    { ...digit('0'), wide: true },
    {
      key: 'decimal',
      face: decimalMark,
      name: decimalMark === ',' ? 'decimal comma' : 'decimal point',
      variant: 'secondary',
    },
    { key: 'equals', face: '=', name: 'equals', variant: 'primary' },
  ];

  // Past the smallest size, the end of the entry stays in view, where the next key lands.
  useLayoutEffect(() => {
    const line = entryRef.current;
    if (line) line.scrollLeft = line.scrollWidth;
  });

  // A native listener, like the converter's undo keys: the group is not itself interactive.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      const key = /^[0-9]$/.test(event.key) ? (event.key as CalculatorKey) : TYPED[event.key];
      if (!key) return;
      event.preventDefault();
      onPress(key);
    };
    group.addEventListener('keydown', onKeyDown);
    return () => group.removeEventListener('keydown', onKeyDown);
  }, [onPress, onClose]);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label="Calculator"
      className="rounded-lg border border-line bg-surface p-3 shadow-sm"
    >
      <div className="mb-3 rounded-md bg-surface-raised px-3 py-2" data-calculator-display>
        <div ref={entryRef} className={`${ENTRY} ${size}`} data-entry>
          {entry || <span className="text-ink-muted">0</span>}
        </div>
        <p className="min-h-5 text-right font-numeric text-sm text-ink-muted" data-running>
          {running === null ? '' : `= ${running}`}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map((def) => (
          <Button
            key={def.key}
            variant={def.variant}
            aria-label={def.name}
            onClick={() => onPress(def.key)}
            className={`min-h-12 font-numeric text-lg ${def.wide ? 'col-span-2' : ''}`}
          >
            {def.face}
          </Button>
        ))}
      </div>
      {footer && <div className="mt-2 grid grid-cols-2 gap-2">{footer}</div>}
    </div>
  );
}

export interface SendButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className'
> {
  /** "1st" or "2nd". */
  ordinal: string;
  /** The box's unit symbol, once it has one. */
  symbol?: string | undefined;
  /** Shows the check that confirms a send, the one copy uses. */
  confirmed: boolean;
}

/** "Use in 1st": puts the calculator's value into a box. Named by what it shows. */
export function SendButton({ ordinal, symbol, confirmed, ...props }: SendButtonProps) {
  return (
    <Button variant="secondary" className="min-h-12 text-sm" {...props}>
      {confirmed && <CheckIcon className="text-success" data-copied />}
      <span>Use in {ordinal}</span>
      {symbol && <span className="font-semibold">{symbol}</span>}
    </Button>
  );
}
