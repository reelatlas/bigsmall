import type { WORDMARK_TIMING } from './timing';
import {
  ART_STEPS,
  fitSteps,
  flapFrame,
  flapPlan,
  lineBreaks,
  nextArtGlyph,
  nextPhrase,
  pace,
  WORDMARK,
  WORDMARK_SIZES,
  type FitStep,
  type WordmarkTuning,
} from './wordmark';

/** What the play runs on: WORDMARK_TIMING and WORDMARK_TUNING, or the lab's live copies. */
export interface WordmarkSettings {
  timing: Record<keyof typeof WORDMARK_TIMING, number>;
  tuning: WordmarkTuning;
}

/** Controls besides the pointer, for /dev/wordmark-lab. */
export interface WordmarkPlayer {
  /** Play as if hovered. */
  pin(on: boolean): void;
  /** Keep the phrase showing now, hovered or not. */
  hold(on: boolean): void;
  /** Change to this phrase now. */
  show(text: string): void;
  /** A pointer speed reading in px/ms, as a movement gives. */
  push(speed: number): void;
  /** The pace now: 1 at rest, smaller as it quickens. */
  pace(): number;
}

/**
 * The live line while playing: over the held box, centered on it, sized by a step. The lab's
 * sheet sets phrases the same way.
 */
export const PLAYING_LINE =
  'absolute inset-y-0 left-0 flex origin-left items-center text-left whitespace-pre';
/** Frames are timed against a 60 Hz frame, so the pace eases back alike on faster screens. */
const FRAME_MS = 1000 / 60;

/** Sets a step on a line: its size in place of any other, and tight leading for two lines. */
export function setStep(line: HTMLElement, step: FitStep): void {
  line.classList.remove(...WORDMARK_SIZES);
  line.classList.add(step.size);
  line.classList.toggle('leading-tight', step.lines === 2);
}

/** The width of a line's text, however the line itself is laid out. */
export function textWidth(line: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(line);
  return range.getBoundingClientRect().width;
}

/** A phrase as set: the step that fits (null when none does), and its text, broken for two lines. */
export interface Fitted {
  step: FitStep | null;
  text: string;
}

/**
 * Sets `phrase` on `line` the first way in `steps` that fits `room` px, two lines at their most
 * balanced break. When none fits, it takes the last step on one line, squeezed to fit, so nothing
 * is cut off; the lab marks such phrases and a browser test fails on them.
 */
export function fitPhrase(
  line: HTMLElement,
  phrase: string,
  room: number,
  steps: readonly FitStep[],
): Fitted {
  line.style.transform = '';
  const fits = (width: number) => width <= room + 0.5;
  for (const step of steps) {
    setStep(line, step);
    if (step.lines === 1) {
      line.textContent = phrase;
      if (fits(textWidth(line))) return { step, text: phrase };
      continue;
    }
    let best = { text: phrase, width: Infinity };
    for (const text of lineBreaks(phrase)) {
      line.textContent = text;
      const width = textWidth(line);
      if (width < best.width) best = { text, width };
    }
    line.textContent = best.text;
    if (fits(best.width)) return { step, text: best.text };
  }
  const last = steps[steps.length - 1];
  if (last) setStep(line, { size: last.size, lines: 1 });
  line.textContent = phrase;
  line.style.transform = `scale(${room / textWidth(line)})`;
  return { step: null, text: phrase };
}

/** A change ready to play: the glyphs it lands on, broken for two lines, and their flips. */
export interface Change {
  glyphs: string[];
  plan: string[][];
}

/**
 * Sets `phrase` on `line` to fit `room` (fitPhrase) and plans its flips (flapPlan) in the line's
 * font, letting a flip glyph be as much wider than its letter as the phrase leaves room for, less
 * a little for kerning. Every frame of the change then fits where the phrase does.
 */
export function prepare(
  line: HTMLElement,
  phrase: string,
  room: number,
  steps: readonly FitStep[],
): Change {
  const glyphs = [...fitPhrase(line, phrase, room, steps).text];
  const stretch = Math.max(1, (room / Math.max(textWidth(line), 1)) * 0.97);
  return { glyphs, plan: flapPlan(glyphs, glyphWidths(line), stretch) };
}

const widths = new Map<string, Map<string, number>>();
let canvas: CanvasRenderingContext2D | null | undefined;

/** Measures glyphs in an element's font, cached per font. Widths are relative: any size will do. */
function glyphWidths(element: HTMLElement): (glyph: string) => number {
  const style = getComputedStyle(element);
  const font = `${style.fontStyle} ${style.fontWeight} 100px ${style.fontFamily}`;
  const known = widths.get(font) ?? new Map<string, number>();
  widths.set(font, known);
  canvas ??= document.createElement('canvas').getContext('2d');
  return (glyph) => {
    let width = known.get(glyph);
    if (width === undefined) {
      if (canvas) canvas.font = font;
      width = canvas?.measureText(glyph).width ?? 1;
      known.set(glyph, width);
    }
    return width;
  };
}

/**
 * Puts the wordmark in motion (docs/UX-SPEC.md §1, "The wordmark at play"). While a mouse is over
 * the heading (the name and its art) the phrase changes at a leisurely pace, and the faster the
 * pointer moves the faster it goes, easing back as it slows; a tap on a touch screen plays it for
 * a few seconds; when the pointer leaves, the name and the art settle home and it stops. Each
 * phrase takes the largest type size at which it fits the name's width, and every frame of a
 * change fits too, so nothing is cut off or moves. Wordmark.astro starts it on the first hover or
 * tap, never under reduced motion; the lab starts it with its own settings and drives it.
 */
export function play(
  zone: HTMLElement,
  settings: WordmarkSettings,
  first?: PointerEvent,
): WordmarkPlayer {
  const line = zone.querySelector<HTMLElement>('[data-wordmark]')!;
  const box = line.parentElement!;
  const artBox = zone.querySelector<HTMLElement>('[data-art-box]');
  const artLine = zone.querySelector<HTMLElement>('[data-art-line]');
  const drawing = zone.querySelector<HTMLElement>('[data-theme-art]');
  const resting = line.className;
  const name = document.createElement('span');
  name.className = 'sr-only';
  name.textContent = WORDMARK;

  let room = 0;
  // The phrase showing, and the one a change lands on.
  let showing = WORDMARK;
  let target = WORDMARK;
  let glyphs: string[] = [];
  let plan: string[][] = [];
  // The art shows its drawing (null) or a symbol; a change flips it when artGlyphs is not empty.
  let artShowing: string | null = null;
  let artTo: string | null = null;
  let artGlyphs: string[] = [];
  let artPlan: string[][] = [];
  let changing = false;
  let landed = 0;
  let turns = 0;
  let settledAt = 0;
  let lastFrame = 0;
  let hovering = false;
  let pinned = false;
  let held = false;
  let tapUntil = 0;
  let speed = 0;
  let last: { x: number; y: number; t: number } | null = null;
  let frame = 0;

  const artVisible = () => !!artBox && artBox.getClientRects().length > 0;
  const showArtLine = (on: boolean) => {
    artLine?.classList.toggle('hidden', !on);
    artLine?.classList.toggle('flex', on);
    drawing?.classList.toggle('invisible', on);
  };

  // Hold the box at the name's size so nothing around it moves, float the live line over it,
  // and give screen readers the name in its place. Nothing clips, so descenders and tall
  // symbols show whole. Released when it settles home, so a theme with another font measures
  // afresh next time.
  const hold = () => {
    if (box.style.width) return;
    const rect = box.getBoundingClientRect();
    room = rect.width;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
    line.className = PLAYING_LINE;
    setStep(line, { size: WORDMARK_SIZES[0], lines: 1 });
    line.setAttribute('aria-hidden', 'true');
    box.append(name);
  };
  const release = () => {
    box.style.width = '';
    box.style.height = '';
    line.className = resting;
    line.style.transform = '';
    line.removeAttribute('aria-hidden');
    name.remove();
  };

  const begin = (next: string) => {
    hold();
    const { tuning } = settings;
    // A change cut short leaves the art where it was going.
    if (changing && artGlyphs.length) {
      artShowing = artTo;
      if (artTo === null) showArtLine(false);
      else if (artLine) artLine.textContent = artTo;
    }
    target = next;
    ({ glyphs, plan } = prepare(line, next, room, fitSteps(tuning.smallest, tuning.twoLinesFrom)));
    // Now and then the art flips to a symbol or back to its drawing, and it comes home with the
    // name. Where the art is hidden (phones), it rests on its drawing.
    artTo = artShowing;
    if (!artVisible()) {
      artTo = null;
      artShowing = null;
      showArtLine(false);
    } else if (next === WORDMARK) artTo = null;
    else if (artShowing === null && Math.random() < tuning.artAway) artTo = nextArtGlyph(null);
    else if (artShowing !== null && Math.random() < tuning.artBack) artTo = null;
    artGlyphs = [];
    if (artTo !== artShowing && artLine && artBox) {
      // Flip to the new symbol, or flip the old one away before the drawing returns.
      showArtLine(true);
      const symbol = artTo ?? artShowing ?? '';
      const artRoom = artBox.getBoundingClientRect().width;
      ({ glyphs: artGlyphs, plan: artPlan } = prepare(artLine, symbol, artRoom, ART_STEPS));
    }
    // Fitting left the landed phrase in place; show the first flip at once, so the phrase is not
    // seen for a frame before its change begins.
    line.textContent = flapFrame(glyphs, plan, 0, 0);
    if (artGlyphs.length && artLine) artLine.textContent = flapFrame(artGlyphs, artPlan, 0, 0);
    changing = true;
    landed = 0;
    turns = 0;
  };

  // Progress through a change accumulates frame by frame, so a position that has landed stays
  // landed when the pace eases back mid-change. The art's positions land after the name's.
  const tick = (now: number) => {
    const { timing, tuning } = settings;
    const elapsed = lastFrame ? now - lastFrame : FRAME_MS;
    lastFrame = now;
    speed *= tuning.decay ** (elapsed / FRAME_MS);
    const f = pace(speed, tuning.gain);
    const active = pinned || held || hovering || now < tapUntil;
    if (changing) {
      landed += elapsed / Math.max(4, timing.stepMs * f);
      turns += elapsed / Math.max(16, timing.flipMs * f);
      const done = Math.floor(landed);
      const turn = Math.floor(turns);
      const text = flapFrame(glyphs, plan, done, turn);
      if (line.textContent !== text) line.textContent = text;
      if (artGlyphs.length && artLine) {
        const artText = flapFrame(
          artGlyphs,
          artPlan,
          artTo === null ? 0 : done - glyphs.length,
          turn,
        );
        if (artLine.textContent !== artText) artLine.textContent = artText;
      }
      if (done >= glyphs.length + artGlyphs.length) {
        changing = false;
        showing = target;
        if (artGlyphs.length) {
          artShowing = artTo;
          if (artTo === null) showArtLine(false);
        }
        settledAt = now;
      }
    } else if (active) {
      if (!held && now - settledAt >= Math.max(timing.fastMs, timing.restMs * f)) {
        begin(nextPhrase(showing, tuning.mix));
      }
    } else if (showing !== WORDMARK || artShowing !== null) {
      begin(WORDMARK);
    } else {
      release();
      frame = 0;
      lastFrame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const run = () => {
    hold();
    // The first change comes soon after the pointer arrives.
    if (!changing) {
      settledAt = performance.now() - settings.timing.restMs + settings.timing.firstMs;
    }
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
      const { response } = settings.tuning;
      speed = Math.max(speed, speed * (1 - response) + moved * response);
    }
    last = { x: event.clientX, y: event.clientY, t: event.timeStamp };
  };
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    tapUntil = performance.now() + settings.timing.tapMs;
    run();
  };

  zone.addEventListener('pointerenter', onEnter);
  zone.addEventListener('pointerleave', onLeave);
  zone.addEventListener('pointermove', onMove);
  zone.addEventListener('pointerdown', onDown);
  // The event that started the play counts too.
  if (first?.pointerType === 'mouse') onEnter(first);
  else if (first) onDown(first);

  return {
    pin: (on) => {
      pinned = on;
      if (on) run();
    },
    hold: (on) => {
      held = on;
      if (on) run();
    },
    show: (text) => {
      run();
      begin(text);
    },
    push: (value) => {
      speed = Math.max(speed, value);
    },
    pace: () => pace(speed, settings.tuning.gain),
  };
}
