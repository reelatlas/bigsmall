import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { COPIED_MIN_MS, COPIED_MS } from './timing';

/**
 * Which of several copy buttons last copied, so it can show a check in place of its icon.
 * With a mouse, the check stays while the pointer rests on that button and reverts when it
 * leaves, after at least COPIED_MIN_MS. Without one (keyboard, touch), it reverts after
 * COPIED_MS. Copying from another button moves the check there.
 */
export function useCopied<K extends string>() {
  const [copied, setCopied] = useState<K | null>(null);
  const shownAt = useRef(0);
  const hovered = useRef<K | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const revertAfter = (ms: number, unlessHovered: K | null) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (unlessHovered === null || hovered.current !== unlessHovered) setCopied(null);
    }, ms);
  };

  const markCopied = (key: K) => {
    setCopied(key);
    shownAt.current = performance.now();
    revertAfter(COPIED_MS, key);
  };

  /** Spread onto each copy button so the check follows the mouse. */
  const pointerProps = (key: K) => ({
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') hovered.current = key;
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'mouse') return;
      if (hovered.current === key) hovered.current = null;
      if (copied === key) {
        revertAfter(Math.max(0, COPIED_MIN_MS - (performance.now() - shownAt.current)), null);
      }
    },
  });

  return { copied, markCopied, pointerProps };
}
