import { describe, expect, it } from 'vitest';
import { flapDuration, flapFrame, nextPhrase, pace, WORDMARK } from '../src/lib/wordmark';

/** A repeatable stand-in for Math.random. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe('nextPhrase', () => {
  it('never repeats the phrase showing now', () => {
    const random = seeded(1);
    let current = WORDMARK;
    for (let n = 0; n < 500; n += 1) {
      const next = nextPhrase(current, random);
      expect(next).not.toBe(current);
      current = next;
    }
  });

  it('has a great many combinations, of every kind', () => {
    const random = seeded(7);
    const seen = new Set<string>();
    for (let n = 0; n < 3000; n += 1) seen.add(nextPhrase('', random));
    expect(seen.size).toBeGreaterThan(400);
    const all = [...seen];
    expect(all.some((p) => p.endsWith('small') && !p.startsWith('big'))).toBe(true);
    expect(all.some((p) => p.startsWith('big') && !p.endsWith('small'))).toBe(true);
    expect(all.some((p) => p.includes('='))).toBe(true);
    expect(all).toContain('giganano');
    // Look-alike letters keep the wordmark's shape.
    expect(
      all.some((p) => p.length === WORDMARK.length && p !== WORDMARK && p.endsWith('all')),
    ).toBe(true);
  });
});

describe('flapFrame', () => {
  it('lands left to right, one position every step, and ends on the new phrase', () => {
    const step = 40;
    expect(flapFrame('bigsmall', 'E = mc²', 0, step, 30)).toHaveLength(8);
    const partway = flapFrame('bigsmall', 'E = mc²', 2 * step + 1, step, 30);
    expect(partway.slice(0, 2)).toBe('E ');
    expect(partway.slice(2, 3)).not.toBe('=');
    const end = flapDuration('bigsmall', 'E = mc²', step);
    expect(flapFrame('bigsmall', 'E = mc²', end, step, 30)).toBe('E = mc²');
  });

  it('flips to a new glyph every flip interval, not every frame', () => {
    const a = flapFrame('bigsmall', 'smallbig', 10, 400, 100);
    const b = flapFrame('bigsmall', 'smallbig', 60, 400, 100);
    const c = flapFrame('bigsmall', 'smallbig', 160, 400, 100);
    expect(a).toBe(b);
    expect(c).not.toBe(b);
  });
});

describe('pace', () => {
  it('is the resting pace for a still pointer and quickens with speed', () => {
    expect(pace(0)).toBe(1);
    expect(pace(1)).toBeLessThan(0.25);
    expect(pace(3)).toBeLessThan(pace(1));
  });
});
