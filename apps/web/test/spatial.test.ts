import { describe, expect, it } from 'vitest';
import { nextInDirection, type Box } from '../src/lib/spatial';

/** The calculator's layout in miniature: close at the top right, a 4 × 5 keypad, "Use" across the bottom. */
type Named = Box & { name: string };
const box = (name: string, left: number, top: number, width = 50, height = 48): Named => ({
  name,
  left,
  top,
  right: left + width,
  bottom: top + height,
});
const FACES = ['C', '⌫', '^', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+'];
const keys = [...FACES, 'E', '0', '.', '='].map((name, index) =>
  box(name, (index % 4) * 58, 60 + Math.floor(index / 4) * 56),
);
const close = box('close', 186, 0, 44, 44);
const use = box('Use', 0, 340, 224);
const all = [close, ...keys, use];
const at = (name: string) => all.find((each) => each.name === name)!;
const go = (from: string, direction: Parameters<typeof nextInDirection>[2], goalX?: number) =>
  nextInDirection(at(from), all, direction, goalX)?.name ?? null;

describe('nextInDirection', () => {
  it('moves along a row and stops at its ends', () => {
    expect(go('8', 'right')).toBe('9');
    expect(go('8', 'left')).toBe('7');
    expect(go('7', 'left')).toBeNull();
    expect(go('×', 'right')).toBeNull();
  });

  it('moves up and down a column', () => {
    expect(go('5', 'up')).toBe('8');
    expect(go('5', 'down')).toBe('2');
    expect(go('=', 'up')).toBe('+');
  });

  it('reaches the controls above and below the keypad from any column', () => {
    expect(go('C', 'up')).toBe('close');
    expect(go('÷', 'up')).toBe('close');
    expect(go('close', 'down')).toBe('÷');
    expect(go('0', 'down')).toBe('Use');
    expect(go('Use', 'down')).toBeNull();
    expect(go('close', 'up')).toBeNull();
  });

  it('keeps to the column it came from through a wide box', () => {
    const fromEquals = at('=');
    const goal = (fromEquals.left + fromEquals.right) / 2;
    expect(go('Use', 'up', goal)).toBe('=');
    const fromZero = at('0');
    expect(go('Use', 'up', (fromZero.left + fromZero.right) / 2)).toBe('0');
  });
});
