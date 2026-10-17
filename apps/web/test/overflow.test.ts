import { describe, expect, it } from 'vitest';
import { fitTools, roomFor, type FitInput } from '../src/lib/overflow';

// The toolbar's one row (docs/UX-SPEC.md §1, ADR 0023): the category menu, six tools of 44 px, a
// 9 px divider before the last, 4 px between things, and a 44 px More when a tool is left out.
const row = (room: number, fixed = 140): FitInput => ({
  room,
  fixed,
  widths: [44, 44, 44, 44, 44, 44],
  gap: 4,
  divider: { before: 5, width: 9 },
  more: 44,
});

describe('the toolbar’s fit', () => {
  it('shows every tool where the row has room for all, with the divider and no More', () => {
    // 140 + 6 × 44 + 9 + 7 gaps of 4 = 441.
    expect(roomFor(row(441), 6)).toBe(441);
    expect(fitTools(row(441))).toBe(6);
    expect(fitTools(row(1000))).toBe(6);
  });

  it('leaves out the last tools, the divider with the one it sits before, and adds More', () => {
    // Five tools and More: 140 + 5 × 44 + 44 + 6 gaps = 428; the divider goes with clear all.
    expect(roomFor(row(0), 5)).toBe(428);
    expect(fitTools(row(440))).toBe(5);
    expect(fitTools(row(428))).toBe(5);
    expect(fitTools(row(427))).toBe(4);
  });

  it('counts every width and gap, never a guess', () => {
    for (let room = 100; room <= 500; room += 7) {
      const count = fitTools(row(room));
      expect(roomFor(row(room), count) <= room || count === 0).toBe(true);
      if (count < 6) expect(roomFor(row(room), count + 1)).toBeGreaterThan(room);
    }
  });

  it('keeps only the leading control and More in a row too narrow for any tool', () => {
    expect(fitTools(row(150))).toBe(0);
    expect(roomFor(row(150), 0)).toBe(140 + 4 + 44);
  });

  it('takes the leading control’s width as measured, so a wider name leaves room for fewer', () => {
    expect(fitTools(row(441, 140))).toBe(6);
    // 20 px more for the name: not all six fit, and with More taking a place too, four do.
    expect(fitTools(row(441, 160))).toBe(4);
    expect(roomFor(row(441, 160), 4)).toBe(400);
    expect(roomFor(row(441, 160), 5)).toBe(448);
  });
});
