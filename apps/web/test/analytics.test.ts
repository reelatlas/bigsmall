import { afterEach, describe, expect, it, vi } from 'vitest';
import { inputShape, track } from '../src/lib/analytics';

// The tracker loads only on the production site and an ad blocker may stop it: a count without it
// does nothing, and a tracker that throws never breaks the page (ADR 0019).
describe('track', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing without a window or a tracker', () => {
    expect(() => track('URL copied')).not.toThrow();
    vi.stubGlobal('window', {});
    expect(() => track('URL copied')).not.toThrow();
  });

  it('hands the event and its properties to the tracker', () => {
    const umami = { track: vi.fn() };
    vi.stubGlobal('window', { umami });
    track('Value copied', { from: 'us-cup', to: 'milliliter' });
    expect(umami.track).toHaveBeenCalledWith('Value copied', { from: 'us-cup', to: 'milliliter' });
  });

  it('swallows a tracker that throws', () => {
    vi.stubGlobal('window', {
      umami: {
        track: () => {
          throw new Error('blocked');
        },
      },
    });
    expect(() => track('Units opened')).not.toThrow();
  });
});

// An input the box could not read is counted by its shape alone (ADR 0019, 2026-10-19): digits,
// letters, spaces, and the marks a quantity is written with, never the text.
describe('inputShape', () => {
  it('keeps the shape and nothing else', () => {
    expect(inputShape("5'11 cm")).toBe("9'9 a");
    expect(inputShape('five eleven')).toBe('a a');
    expect(inputShape('  1,80m  ')).toBe('9,9a');
    expect(inputShape('45° 30′ 15″')).toBe('9° 9′ 9″');
    expect(inputShape('5:30/km')).toBe('9:9/a');
    expect(inputShape('someone@example.com')).toBe('axa.a');
    expect(inputShape('١٢٣ m')).toBe('9 a');
  });

  it('is at most 24 characters', () => {
    expect(inputShape('a '.repeat(40)).length).toBe(24);
  });
});
