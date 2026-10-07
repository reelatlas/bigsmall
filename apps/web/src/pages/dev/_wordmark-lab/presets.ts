import type { WordmarkSettings } from '../../../lib/wordmark-motion';

/**
 * The version shipping now: WORDMARK_TIMING (lib/timing.ts) and WORDMARK_TUNING (lib/wordmark.ts)
 * hold its settings.
 */
export const SHIPPED = 'v1';

/**
 * Settings that shipped before, kept so a tuning can be compared with an earlier one or rolled
 * back (docs/DESIGN-SYSTEM.md, "Tuning labs"). When tuned settings ship, the ones they replace
 * join this list under SHIPPED's name, and SHIPPED moves on to the next version.
 */
export const PRESETS: ReadonlyArray<{ id: string; label: string; settings: WordmarkSettings }> = [
  {
    id: 'v0',
    label: 'v0, the first ship (2026-10-06)',
    settings: {
      timing: { restMs: 1800, fastMs: 110, firstMs: 250, stepMs: 45, flipMs: 40, tapMs: 4000 },
      tuning: {
        mix: {
          big: 8,
          small: 8,
          both: 4,
          letters: 10,
          pairs: 8,
          analogies: 18,
          idioms: 10,
          equations: 14,
          constants: 6,
          conversions: 6,
          name: 6,
          art: 2,
        },
        gain: 3.5,
        decay: 0.92,
        response: 0.4,
        artAway: 0.2,
        artBack: 0.5,
        smallest: 'text-sm',
        twoLinesFrom: 'text-base',
      },
    },
  },
];
