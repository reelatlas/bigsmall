/**
 * How the visitor last pressed something on the page: a finger or a pen, or a mouse or a key
 * (docs/UX-SPEC.md §8, "On a touch screen"; ADR 0015). Moving focus into the box brings a touch
 * screen's keyboard up, so the converter does it only after a click or a key, never after a tap.
 * Decided per press rather than per device: a tablet's trackpad and keyboard keep the desktop's
 * flow, and a laptop's touch screen gets the phone's.
 */
let touched = false;

if (typeof document !== 'undefined') {
  // In the capture phase, so the press is known before any handler it reaches runs.
  document.addEventListener(
    'pointerdown',
    (event) => {
      touched = event.pointerType === 'touch' || event.pointerType === 'pen';
    },
    true,
  );
  document.addEventListener(
    'keydown',
    () => {
      touched = false;
    },
    true,
  );
}

/** Whether the latest press was a tap, with a finger or a pen, rather than a click or a key. */
export function pressedByTouch(): boolean {
  return touched;
}
