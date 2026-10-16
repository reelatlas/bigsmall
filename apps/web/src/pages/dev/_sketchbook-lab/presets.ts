import { SKETCHES, type SketchbookSettings } from '../../../features/sketchbook/sketches';

/**
 * The version on the About page now: SKETCHBOOK_TIMING (lib/timing.ts) and SKETCHBOOK_TUNING
 * (features/sketchbook/sketches.ts) hold its settings, as Sean tuned them (2026-10-15).
 */
export const SHIPPED = 'v2';

/**
 * Settings that shipped before, kept so a tuning can be compared with an earlier one or rolled
 * back (docs/DESIGN-SYSTEM.md, "Tuning labs"). When tuned settings ship, the ones they replace
 * join this list under SHIPPED's name, and SHIPPED moves on to the next version.
 */
export const PRESETS: ReadonlyArray<{ id: string; label: string; settings: SketchbookSettings }> = [
  {
    id: 'v1',
    label: 'v1, the first ship (2026-10-15)',
    settings: {
      timing: {
        firstMs: 40,
        holdMs: 900,
        swapMs: 420,
        frameMs: 24,
        waveMs: 60,
        idleMinMs: 1600,
        idleMaxMs: 2250,
      },
      tuning: {
        effect: 'mixed',
        easing: 'ease',
        strength: 1,
        wave: 'random',
        cycle: false,
        intro: true,
        order: 'shuffled',
        columns: 3,
        rows: 1,
        tile: 32,
        gap: 4,
        set: SKETCHES.map(({ id }) => id),
      },
    },
  },
];
