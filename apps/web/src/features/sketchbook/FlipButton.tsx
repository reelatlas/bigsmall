import { useRef } from 'react';
import { Button } from '../../components/Button';
import { burst } from './burst';

/**
 * The sketchbook's Flip (Sean, 2026-10-15, in place of Shuffle): changes every tile, and answers
 * the press with a few calm particles inside the button, behind its label, or with a flash of its
 * fill under reduced motion (burst.ts).
 */
export function FlipButton({ onFlip }: { onFlip: () => void }) {
  const layer = useRef<HTMLSpanElement>(null);
  return (
    <Button
      variant="secondary"
      className="relative min-w-28 overflow-hidden"
      onClick={(event) => {
        if (layer.current) burst(layer.current, event.currentTarget);
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
