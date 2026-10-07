import { useEffect, useRef, type ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';
import { BackspaceIcon } from './icons';

export type KeypadKey =
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
  key: KeypadKey;
  /** What the key shows; the decimal key shows the visitor's own mark. */
  face: ReactNode;
  /** What a screen reader says. */
  name: string;
  variant: ButtonVariant;
  wide?: boolean;
}

const digit = (key: KeypadKey): KeyDef => ({ key, face: key, name: key, variant: 'secondary' });

/** Physical keys that press a keypad key while focus is inside it. */
const TYPED: Readonly<Record<string, KeypadKey>> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '=': 'equals',
  '.': 'decimal',
  ',': 'decimal',
  Backspace: 'backspace',
};

export interface KeypadProps {
  /** The visitor's decimal mark, "." or ",". */
  decimalMark: string;
  onPress: (key: KeypadKey) => void;
  /** Escape inside the keypad. */
  onClose: () => void;
  /** Above the keys, such as the switch for which box the keypad fills. */
  children?: ReactNode;
}

/**
 * A calculator keypad: digits, the decimal mark, + − × ÷, =, backspace, and clear, as native
 * buttons at least 48 px tall in a labelled group. Typing a digit, an operator, ".", ",", "=", or
 * Backspace while focus is inside presses the matching key; Enter and Space press the focused
 * key, as for any button. What a key does to a box is the caller's (features/converter/keypad.ts).
 */
export function Keypad({ decimalMark, onPress, onClose, children }: KeypadProps) {
  const groupRef = useRef<HTMLDivElement>(null);
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
      const key = /^[0-9]$/.test(event.key) ? (event.key as KeypadKey) : TYPED[event.key];
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
      {children}
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
    </div>
  );
}
