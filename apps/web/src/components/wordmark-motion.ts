import type { WORDMARK_TIMING } from '../lib/timing';
import { flapDuration, flapFrame, nextPhrase, pace, WORDMARK } from '../lib/wordmark';

/**
 * Puts the wordmark in motion (docs/UX-SPEC.md §1, "The wordmark at play"). While a mouse is over the
 * header the phrase changes at a leisurely pace, and the faster the pointer moves the faster it
 * goes, easing back as it slows; a tap on a touch screen plays it for a few seconds; when the
 * pointer leaves it settles back to "bigsmall" and stops. Wordmark.astro starts it on the first
 * hover or tap, and never under reduced motion.
 */
export function play(
  zone: HTMLElement,
  line: HTMLElement,
  first: PointerEvent,
  timing: typeof WORDMARK_TIMING,
): void {
  const box = line.parentElement!;
  const name = document.createElement('span');
  name.className = 'sr-only';
  name.textContent = WORDMARK;

  let showing = WORDMARK;
  let from = WORDMARK;
  let to = WORDMARK;
  let changing = false;
  let changeAt = 0;
  let settledAt = 0;
  let hovering = false;
  let tapUntil = 0;
  let speed = 0;
  let last: { x: number; y: number; t: number } | null = null;
  let frame = 0;

  // Hold the box at the wordmark's size so nothing around it moves, float the live line over it,
  // clip it there (a flip briefly shows the longer of two phrases), and give screen readers the
  // name in its place. Released when it settles home, so a theme with another font measures
  // afresh next time.
  const hold = () => {
    if (box.style.width) return;
    const { width, height } = box.getBoundingClientRect();
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
    box.classList.add('overflow-hidden');
    line.classList.add('absolute', 'left-0', 'origin-left');
    line.setAttribute('aria-hidden', 'true');
    box.append(name);
  };
  const release = () => {
    box.style.width = '';
    box.style.height = '';
    box.classList.remove('overflow-hidden');
    line.classList.remove('absolute', 'left-0', 'origin-left');
    line.removeAttribute('aria-hidden');
    line.style.transform = '';
    name.remove();
  };

  // A phrase longer than the wordmark shrinks to its width rather than running into the art.
  const fit = (text: string) => {
    line.style.transform = '';
    line.textContent = text;
    const scale = Math.min(1, box.clientWidth / Math.max(line.scrollWidth, 1));
    line.style.transform = scale < 1 ? `scale(${scale})` : '';
  };

  const begin = (now: number, next: string) => {
    from = line.textContent ?? showing;
    to = next;
    changing = true;
    changeAt = now;
    fit(next);
    line.textContent = from;
  };

  const tick = (now: number) => {
    speed *= 0.92;
    const f = pace(speed);
    const step = Math.max(4, timing.stepMs * f);
    const active = hovering || now < tapUntil;
    if (changing) {
      const elapsed = now - changeAt;
      if (elapsed >= flapDuration(from, to, step)) {
        line.textContent = to;
        showing = to;
        changing = false;
        settledAt = now;
      } else {
        const text = flapFrame(from, to, elapsed, step, Math.max(16, timing.flipMs * f));
        if (line.textContent !== text) line.textContent = text;
      }
    } else if (active) {
      if (now - settledAt >= Math.max(timing.fastMs, timing.restMs * f)) {
        begin(now, nextPhrase(showing));
      }
    } else if (showing !== WORDMARK) {
      begin(now, WORDMARK);
    } else {
      release();
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const run = () => {
    hold();
    // The first change comes soon after the pointer arrives.
    if (!changing) settledAt = performance.now() - timing.restMs + timing.firstMs;
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const onEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    last = null;
    run();
  };
  const onLeave = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') hovering = false;
  };
  // Speed rises at once with a quick movement and decays every frame, so the pace eases back.
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    if (last) {
      const dt = Math.max(event.timeStamp - last.t, 1);
      const moved = Math.hypot(event.clientX - last.x, event.clientY - last.y) / dt;
      speed = Math.max(speed, speed * 0.6 + moved * 0.4);
    }
    last = { x: event.clientX, y: event.clientY, t: event.timeStamp };
  };
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    tapUntil = performance.now() + timing.tapMs;
    run();
  };

  zone.addEventListener('pointerenter', onEnter);
  zone.addEventListener('pointerleave', onLeave);
  zone.addEventListener('pointermove', onMove);
  zone.addEventListener('pointerdown', onDown);
  // The event that loaded this module counts too.
  if (first.pointerType === 'mouse') onEnter(first);
  else onDown(first);
}
