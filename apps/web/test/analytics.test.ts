import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '../src/lib/analytics';

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
