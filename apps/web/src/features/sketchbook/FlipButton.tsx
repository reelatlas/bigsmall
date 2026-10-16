import { useRef } from 'react';
import { Button } from '../../components/Button';
import { burst, type Mood } from './burst';

/**
 * The sketchbook's Flip (Sean, 2026-10-15, in place of Shuffle): changes every tile, and answers
 * the press with a few calm particles inside the button, behind its label, or with a flash of its
 * fill under reduced motion (burst.ts).
 */
export function FlipButton({
  particles,
  onFlip,
}: {
  /** A mood of particles, or any, a new one each press (SketchbookTuning). */
  particles: Mood | 'any';
  onFlip: () => void;
}) {
  const layer = useRef<HTMLSpanElement>(null);
  return (
    <Button
      variant="secondary"
      className="relative min-w-28 overflow-hidden"
      onClick={(event) => {
        const button = event.currentTarget;
        const box = button.getBoundingClientRect();
        // From Enter or Space (no pointer, detail 0), the middle of the button.
        const at =
          event.detail === 0
            ? { x: 0.5, y: 0.5 }
            : {
                x: (event.clientX - box.left) / box.width,
                y: (event.clientY - box.top) / box.height,
              };
        if (layer.current) burst(layer.current, button, at, particles);
        onFlip();
      }}
    >
      <span
        ref={layer}
        aria-hidden="true"
        data-burst
        className="pointer-events-none absolute inset-0"
      />
      <span className="relative">Flip</span>
    </Button>
  );
}
