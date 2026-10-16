import type { SketchbookSettings } from '../../../features/sketchbook/sketches';

/**
 * The version on the About page now: SKETCHBOOK_TIMING (lib/timing.ts) and SKETCHBOOK_TUNING
 * (features/sketchbook/sketches.ts) hold its settings, as Sean tuned them (2026-10-15).
 */
export const SHIPPED = 'v1';

/**
 * Settings that shipped before, kept so a tuning can be compared with an earlier one or rolled
 * back (docs/DESIGN-SYSTEM.md, "Tuning labs"). When tuned settings ship, the ones they replace
 * join this list under SHIPPED's name, and SHIPPED moves on to the next version. v1 is the first.
 */
export const PRESETS: ReadonlyArray<{ id: string; label: string; settings: SketchbookSettings }> =
  [];
