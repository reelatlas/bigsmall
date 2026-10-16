import { FRAME_MS, SKETCH_MIN_GAP_MS } from '../../lib/timing';
import {
  bandClip,
  blockClip,
  blocksClip,
  cutClip,
  drawnClip,
  glitchFrame,
  scanFrame,
  scrambleFrame,
  scrambleOrder,
  slatsClip,
} from './frames';
import {
  deckOf,
  draw,
  SKETCH_BY_ID,
  SKETCH_EFFECTS,
  SPRING_EASING,
  STEPPED_EFFECTS,
  waveRanks,
  type SketchbookSettings,
  type SketchEasing,
  type SketchEffect,
} from './sketches';

/**
 * The sketchbook at play (docs/UX-SPEC.md §1, the About page). Each tile changes by itself on its
 * own time; hovering one with a mouse changes it to the next sketch, once, or on while the mouse
 * stays with `cycle` (the lab's Keep changing); a click, a tap, Enter, or Space changes it at
 * once; Flip changes every tile in a wave. A change runs between the tile's layers: the sketch
 * showing (front), the one arriving (back), and pieces the stepped effects, Flap, and Doors cut a
 * tile into. The moving effects, Flap, and Doors run on the Web Animations API; the stepped ones
 * draw a frame every frameMs, planned in frames.ts. Under reduced motion nothing changes by
 * itself: a press cross-fades, and Flip changes every tile at once.
 */

/** Where a sketch's symbol is on the page (SketchSprite.astro). */
export const sketchHref = (id: string) => `#sketch-${id}`;

/** A point in a tile, as fractions of its width and height: where a press landed. */
interface Point {
  x: number;
  y: number;
}

const MIDDLE: Point = { x: 0.5, y: 0.5 };

type Timing = SketchbookSettings['timing'];

/**
 * The pause before a playing tile's next change: Hold, never so short that a change starts
 * sooner than SKETCH_MIN_GAP_MS after the last began.
 */
export function restMs({ holdMs, swapMs }: Pick<Timing, 'holdMs' | 'swapMs'>): number {
  return Math.max(holdMs, SKETCH_MIN_GAP_MS - swapMs);
}

/**
 * How long a tile waits to change by itself: a random time between the least and the most, never
 * under SKETCH_MIN_GAP_MS; null when both are 0, which turns it off.
 */
export function idleWaitMs(
  { idleMinMs, idleMaxMs }: Pick<Timing, 'idleMinMs' | 'idleMaxMs'>,
  random: () => number,
): number | null {
  const [least, most] = [Math.min(idleMinMs, idleMaxMs), Math.max(idleMinMs, idleMaxMs)];
  if (most <= 0) return null;
  return Math.max(SKETCH_MIN_GAP_MS, least + random() * (most - least));
}

/** Controls besides the pointer and the keys, for Flip and /dev/sketchbook-lab. */
export interface SketchbookPlayer {
  /** Flip: changes every tile, in a wave, and says what they brought. */
  flip(): void;
  /** Plays every tile as if hovered. */
  pin(on: boolean): void;
  /** Plays as under reduced motion, whatever the system asks. */
  still(on: boolean): void;
  /** Takes in changed settings: each tile's next change by itself is drawn afresh. */
  update(): void;
  stop(): void;
}

/** A tile's layers: the sketch showing, the one arriving, and the pieces some effects need. */
interface Layers {
  front: SVGSVGElement;
  back: SVGSVGElement;
  pieces: SVGSVGElement[];
}

/** A change under way: run to its end at once, or dropped. */
interface Run {
  finish(): void;
  cancel(): void;
}

interface TileState {
  hovered: boolean;
  /** Where the mouse is over the tile, for an iris that opens from it. */
  at: Point;
  timer: number | undefined;
  run: Run | null;
  /** Settles when the change under way has. */
  done: Promise<void> | null;
  /** Its next change by itself, while the tiles change by themselves. */
  idle: number | undefined;
}

type Moving = Exclude<SketchEffect, 'glitch' | 'scramble' | 'scan' | 'flap' | 'doors'>;

/** A moving change, layer by layer: the sketch showing (front) leaves, the next (back) arrives. */
interface Moves {
  front: Keyframe[];
  back: Keyframe[];
  /** The tile clips the layers to its corners while they move (a slide). */
  clip: boolean;
}

/** How each moving effect moves the layers; `size` is the tile's width in px. */
function moves(effect: Moving, size: number, at: Point): Moves {
  const turn = (axis: 'rotateX' | 'rotateY'): Moves => {
    // Depth in proportion to the tile, so a flip looks the same at every size.
    const angle = (degrees: number) => `perspective(${size * 4}px) ${axis}(${degrees}deg)`;
    return {
      front: [
        { transform: angle(0) },
        { offset: 0.5, transform: angle(90) },
        { transform: angle(90) },
      ],
      back: [
        { transform: angle(-90), opacity: 1 },
        { offset: 0.5, transform: angle(-90), opacity: 1 },
        { transform: angle(0), opacity: 1 },
      ],
      clip: false,
    };
  };
  switch (effect) {
    case 'flip':
      return turn('rotateY');
    case 'tumble':
      return turn('rotateX');
    case 'pop':
      return {
        front: [
          { transform: 'scale(1)', opacity: 1 },
          { offset: 0.45, transform: 'scale(0.6)', opacity: 0 },
          { transform: 'scale(0.6)', opacity: 0 },
        ],
        back: [
          { transform: 'scale(0.6)', opacity: 0 },
          { offset: 0.45, transform: 'scale(0.6)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        clip: false,
      };
    case 'slide':
      return {
        front: [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
        back: [
          { transform: 'translateY(100%)', opacity: 1 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        clip: true,
      };
    case 'iris': {
      // Open far enough to cover the corner farthest from where it starts, in the tile's widths.
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const;
      const reach = Math.max(...corners.map(([x, y]) => Math.hypot(x - at.x, y - at.y)));
      const circle = (radius: number) => `circle(${radius}% at ${at.x * 100}% ${at.y * 100}%)`;
      return {
        front: [{ opacity: 1 }, { opacity: 1 }],
        back: [
          { clipPath: circle(0), opacity: 1 },
          { clipPath: circle(reach * 100 + 2), opacity: 1 },
        ],
        clip: false,
      };
    }
    case 'blur': {
      const blurred = `blur(${size * 0.08}px)`;
      return {
        front: [
          { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
          { opacity: 0, filter: blurred, transform: 'scale(1.08)' },
        ],
        back: [
          { opacity: 0, filter: blurred, transform: 'scale(0.92)' },
          { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
        ],
        clip: false,
      };
    }
    case 'spin':
      return {
        front: [
          { transform: 'rotate(0deg) scale(1)' },
          { offset: 0.5, transform: 'rotate(180deg) scale(0)' },
          { transform: 'rotate(180deg) scale(0)' },
        ],
        back: [
          { transform: 'rotate(-180deg) scale(0)', opacity: 1 },
          { offset: 0.5, transform: 'rotate(-180deg) scale(0)', opacity: 1 },
          { transform: 'rotate(0deg) scale(1)', opacity: 1 },
        ],
        clip: false,
      };
    case 'fade':
      return {
        front: [{ opacity: 1 }, { opacity: 0 }],
        back: [{ opacity: 0 }, { opacity: 1 }],
        clip: false,
      };
    case 'dive': {
      // Into the small one, which sits low and to the right in most sketches; the next grows
      // out of it.
      const into = { transformOrigin: '70% 70%' };
      return {
        front: [
          { ...into, transform: 'scale(1)', opacity: 1 },
          { ...into, offset: 0.6, transform: 'scale(3)', opacity: 0 },
          { ...into, transform: 'scale(3)', opacity: 0 },
        ],
        back: [
          { ...into, transform: 'scale(0.15)', opacity: 0 },
          { ...into, offset: 0.3, transform: 'scale(0.3)', opacity: 1 },
          { ...into, transform: 'scale(1)', opacity: 1 },
        ],
        clip: true,
      };
    }
    case 'blinds':
      return {
        front: [{ opacity: 1 }, { opacity: 1 }],
        back: [
          { clipPath: slatsClip(0), opacity: 1 },
          { clipPath: slatsClip(1), opacity: 1 },
        ],
        clip: false,
      };
    case 'drop':
      return {
        front: [
          { transform: 'translateY(0)' },
          { offset: 0.4, transform: 'translateY(110%)' },
          { transform: 'translateY(110%)' },
        ],
        back: [
          { transform: 'translateY(-110%)', opacity: 1 },
          { offset: 0.3, transform: 'translateY(-110%)', opacity: 1 },
          { offset: 0.72, transform: 'translateY(0)', opacity: 1 },
          { offset: 0.86, transform: 'translateY(-8%)', opacity: 1 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        clip: true,
      };
    case 'squash': {
      // Flat on its base, as a cartoon squashes, and back up past its height before it settles.
      const base = { transformOrigin: '50% 100%' };
      return {
        front: [
          { ...base, transform: 'scale(1, 1)' },
          { ...base, offset: 0.4, transform: 'scale(1.25, 0)' },
          { ...base, transform: 'scale(1.25, 0)' },
        ],
        back: [
          { ...base, transform: 'scale(1.25, 0)', opacity: 1 },
          { ...base, offset: 0.4, transform: 'scale(1.25, 0)', opacity: 1 },
          { ...base, offset: 0.7, transform: 'scale(0.88, 1.12)', opacity: 1 },
          { ...base, offset: 0.86, transform: 'scale(1.04, 0.96)', opacity: 1 },
          { ...base, transform: 'scale(1, 1)', opacity: 1 },
        ],
        clip: false,
      };
    }
  }
}

/** The curve a change follows, read from the tile's theme. */
function easingOf(easing: SketchEasing, tile: HTMLElement): string {
  if (easing === 'spring') return SPRING_EASING;
  const token = easing === 'ease' ? '--motion-ease' : '--motion-glide';
  return getComputedStyle(tile).getPropertyValue(token).trim() || 'linear';
}

/** Shows a sketch on a layer. */
const show = (layer: SVGSVGElement, id: string) =>
  layer.querySelector('use')?.setAttribute('href', sketchHref(id));

/** A layer's edges split into the theme's accent and art colors, `size` px wide at full strength. */
const split = (strength: number, size: number) => {
  const offset = Math.max(1, strength * size * 0.03);
  return `drop-shadow(${-offset}px 0 var(--accent)) drop-shadow(${offset}px 0 var(--art-1))`;
};

/**
 * Flap, like a split-flap board's card: the top half of the sketch showing falls toward the
 * viewer, uncovering the next one's top, and the next one's bottom half falls after it, each
 * darkening as it turns from the light.
 */
function flap(
  layers: Layers,
  from: string,
  to: string,
  size: number,
  options: KeyframeAnimationOptions,
): Animation[] {
  const [falling, landing] = layers.pieces;
  if (!falling || !landing) return [];
  show(falling, from);
  show(landing, to);
  const turned = (degrees: number) => `perspective(${size * 4}px) rotateX(${degrees}deg)`;
  const top = 'inset(0 0 50% 0)';
  const bottom = 'inset(50% 0 0 0)';
  return [
    layers.back.animate(
      [
        { clipPath: top, opacity: 1 },
        { clipPath: top, opacity: 1 },
      ],
      options,
    ),
    layers.front.animate([{ clipPath: bottom }, { clipPath: bottom }], options),
    falling.animate(
      [
        { clipPath: top, opacity: 1, transform: turned(0), filter: 'brightness(1)' },
        {
          offset: 0.5,
          clipPath: top,
          opacity: 1,
          transform: turned(-90),
          filter: 'brightness(0.6)',
        },
        { clipPath: top, opacity: 0, transform: turned(-90), filter: 'brightness(0.6)' },
      ],
      options,
    ),
    landing.animate(
      [
        { clipPath: bottom, opacity: 1, transform: turned(90), filter: 'brightness(0.6)' },
        {
          offset: 0.5,
          clipPath: bottom,
          opacity: 1,
          transform: turned(90),
          filter: 'brightness(0.6)',
        },
        { clipPath: bottom, opacity: 1, transform: turned(0), filter: 'brightness(1)' },
      ],
      options,
    ),
  ];
}

/**
 * Doors: the sketch showing splits down the middle and its halves swing open toward the viewer,
 * each on its outer edge, darkening as they turn, with the next sketch behind them.
 */
function doors(
  layers: Layers,
  from: string,
  size: number,
  options: KeyframeAnimationOptions,
): Animation[] {
  const [left, right] = layers.pieces;
  if (!left || !right) return [];
  show(left, from);
  show(right, from);
  const swung = (degrees: number) => `perspective(${size * 4}px) rotateY(${degrees}deg)`;
  const leaf = (clipPath: string, transformOrigin: string, degrees: number) => [
    { clipPath, transformOrigin, transform: swung(0), opacity: 1, filter: 'brightness(1)' },
    { clipPath, transformOrigin, transform: swung(degrees), opacity: 1, filter: 'brightness(0.6)' },
  ];
  return [
    layers.front.animate([{ opacity: 0 }, { opacity: 0 }], options),
    layers.back.animate([{ opacity: 1 }, { opacity: 1 }], options),
    left.animate(leaf('inset(0 50% 0 0)', '0% 50%', -90), options),
    right.animate(leaf('inset(0 0 0 50%)', '100% 50%', 90), options),
  ];
}

/**
 * Plays the tiles in `grid` (each a [data-sketch-tile] holding its layers) by the settings in
 * `live`, read at every change, so the lab's changes apply at once. `announce` says a pressed
 * tile's new sketch, or what a flip brought. The grid is marked `data-playing` while it plays,
 * which the browser tests wait for.
 */
export function play(
  grid: HTMLElement,
  live: { readonly current: SketchbookSettings },
  announce: (text: string) => void,
): SketchbookPlayer {
  const states = new WeakMap<HTMLElement, TileState>();
  const timers = new Set<number>();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const random = Math.random;
  let forcedStill = false;
  let pinned = false;
  let stopped = false;
  let deck: string[] = [];
  let lastEffect: SketchEffect | undefined;

  const still = () => forcedStill || reduced.matches;
  const tiles = () => [...grid.querySelectorAll<HTMLElement>('[data-sketch-tile]')];
  const stateOf = (tile: HTMLElement): TileState => {
    let state = states.get(tile);
    if (!state) {
      state = {
        hovered: false,
        at: MIDDLE,
        timer: undefined,
        run: null,
        done: null,
        idle: undefined,
      };
      states.set(tile, state);
    }
    return state;
  };
  const layersOf = (tile: HTMLElement): Layers | null => {
    const front = tile.querySelector<SVGSVGElement>('[data-layer="front"]');
    const back = tile.querySelector<SVGSVGElement>('[data-layer="back"]');
    if (!front || !back) return null;
    return {
      front,
      back,
      pieces: [...tile.querySelectorAll<SVGSVGElement>('[data-layer="piece"]')],
    };
  };
  const later = (run: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      run();
    }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id: number | undefined) => {
    if (id === undefined) return;
    window.clearTimeout(id);
    timers.delete(id);
  };

  /** Every sketch on the grid, arriving ones included, so a draw never repeats one. */
  const showing = () =>
    new Set(
      tiles().flatMap((tile) =>
        [tile.dataset['sketch'], tile.dataset['next']].filter((id): id is string => !!id),
      ),
    );

  /** A sketch from the rotation other than `not`, for a frame that flips through. */
  const another = (not: string) => {
    const { set } = live.current.tuning;
    const others = set.filter((id) => id !== not);
    return others[Math.floor(random() * others.length)] ?? not;
  };

  const effectFor = (): SketchEffect => {
    const { effect } = live.current.tuning;
    if (still()) return 'fade';
    if (effect !== 'mixed') return effect;
    const choices = SKETCH_EFFECTS.filter((each) => each !== 'fade' && each !== lastEffect);
    lastEffect = choices[Math.floor(random() * choices.length)] ?? 'glitch';
    return lastEffect;
  };

  /** One frame of Glitch: the picture showing cut into shifted bands, its edges split. */
  const glitch = (
    layers: Layers,
    from: string,
    to: string,
    k: number,
    count: number,
    size: number,
  ) => {
    const arriving = k >= count / 2;
    const base = arriving ? layers.back : layers.front;
    const sketch = arriving ? to : from;
    if (arriving) {
      layers.front.style.opacity = '0';
      layers.back.style.opacity = '1';
    }
    const { bands, fringe } = glitchFrame(k, count, live.current.tuning.strength, random);
    const edges = fringe > 0.05 ? split(fringe, size) : '';
    base.style.clipPath = cutClip(bands);
    base.style.filter = edges;
    layers.pieces.forEach((piece, index) => {
      const band = bands[index];
      if (!band) {
        piece.style.opacity = '0';
        return;
      }
      show(piece, band.other ? another(sketch) : sketch);
      piece.style.opacity = '1';
      piece.style.clipPath = bandClip(band);
      piece.style.transform = `translateX(${band.shift * size}px)`;
      piece.style.filter = edges;
    });
  };

  /** One frame of Scramble: the blocks landed so far, and the next few flipping through others. */
  const scramble = (layers: Layers, to: string, order: readonly number[], progress: number) => {
    const { landed, flipping } = scrambleFrame(order, progress);
    layers.back.style.opacity = '1';
    layers.back.style.clipPath = blocksClip(landed);
    layers.pieces.forEach((piece, index) => {
      const block = flipping[index];
      if (block === undefined) {
        piece.style.opacity = '0';
        return;
      }
      show(piece, another(to));
      piece.style.opacity = '1';
      piece.style.clipPath = blockClip(block);
    });
  };

  /** One frame of Scan: the next sketch drawn down to a row, the row under it bright. */
  const scan = (layers: Layers, to: string, progress: number, size: number) => {
    const { drawn, row } = scanFrame(progress, random);
    layers.back.style.opacity = '1';
    layers.back.style.clipPath = drawnClip(drawn);
    const [beam] = layers.pieces;
    if (!beam) return;
    if (!row) {
      beam.style.opacity = '0';
      return;
    }
    show(beam, to);
    beam.style.opacity = '1';
    beam.style.clipPath = bandClip(row);
    beam.style.transform = `translateX(${row.shift * size}px)`;
    beam.style.filter = 'brightness(1.5) saturate(1.3)';
  };

  /** A stepped change, a frame every frameMs, the first at once, until swapMs has passed. */
  const stepped = (
    effect: SketchEffect,
    layers: Layers,
    from: string,
    to: string,
    size: number,
  ): { run: Run; ended: Promise<boolean> } => {
    const { swapMs, frameMs } = live.current.timing;
    const pace = Math.max(FRAME_MS, frameMs);
    const count = Math.max(2, Math.round(swapMs / pace));
    const order = scrambleOrder(random);
    const drawFrame = (k: number, progress: number) => {
      if (effect === 'glitch') glitch(layers, from, to, k, count, size);
      else if (effect === 'scramble') scramble(layers, to, order, progress);
      else scan(layers, to, progress, size);
    };
    let resolve: (arrived: boolean) => void = () => {};
    const ended = new Promise<boolean>((settled) => {
      resolve = settled;
    });
    let start = 0;
    let drawn = -1;
    let frame = 0;
    let over = false;
    const end = (arrived: boolean) => {
      if (over) return;
      over = true;
      cancelAnimationFrame(frame);
      resolve(arrived);
    };
    const tick = (now: number) => {
      start ||= now;
      const elapsed = now - start;
      if (elapsed >= swapMs) {
        end(true);
        return;
      }
      const k = Math.min(count - 1, Math.floor(elapsed / pace));
      if (k !== drawn) {
        drawn = k;
        drawFrame(k, elapsed / swapMs);
      }
      frame = requestAnimationFrame(tick);
    };
    drawFrame(0, 0);
    frame = requestAnimationFrame(tick);
    return { run: { finish: () => end(true), cancel: () => end(false) }, ended };
  };

  /**
   * Changes a tile to the next sketch. A change under way is cut short when `cut` (a press), and
   * waited for otherwise (the hover's next change).
   */
  async function change(tile: HTMLElement, at: Point, cut: boolean): Promise<void> {
    const state = stateOf(tile);
    if (state.done) {
      if (cut) state.run?.finish();
      await state.done;
    }
    const { timing, tuning } = live.current;
    deck = deck.filter((id) => tuning.set.includes(id));
    const own = tile.dataset['sketch'];
    const id = draw(deck, () => deckOf(tuning.set, tuning.order, random), showing(), own);
    const layers = layersOf(tile);
    if (!id || !own || id === own || !layers) return;

    show(layers.back, id);
    tile.dataset['next'] = id;
    const effect = effectFor();
    const size = tile.getBoundingClientRect().width;
    let ended: Promise<boolean>;
    if (STEPPED_EFFECTS.has(effect)) {
      const steps = stepped(effect, layers, own, id, size);
      state.run = steps.run;
      ended = steps.ended;
    } else {
      const options: KeyframeAnimationOptions = {
        duration: timing.swapMs,
        easing: easingOf(tuning.easing, tile),
        fill: 'forwards',
      };
      let animations: Animation[];
      if (effect === 'flap') animations = flap(layers, own, id, size, options);
      else if (effect === 'doors') animations = doors(layers, own, size, options);
      else {
        const motion = moves(effect as Moving, size, at);
        if (motion.clip) tile.style.overflow = 'hidden';
        animations = [
          layers.front.animate(motion.front, options),
          layers.back.animate(motion.back, options),
        ];
      }
      state.run = {
        finish: () => animations.forEach((animation) => animation.finish()),
        cancel: () => animations.forEach((animation) => animation.cancel()),
      };
      ended = Promise.all(animations.map((animation) => animation.finished)).then(
        () => true,
        // Cancelled: the page is going, or the lab stopped the play.
        () => false,
      );
    }

    // In one task, so no frame shows between: the front takes the new sketch, every layer goes
    // back to rest.
    const settle = (arrived: boolean) => {
      if (arrived) {
        show(layers.front, id);
        tile.dataset['sketch'] = id;
        tile.setAttribute('aria-label', SKETCH_BY_ID.get(id)?.name ?? id);
      }
      delete tile.dataset['next'];
      for (const layer of [layers.front, layers.back, ...layers.pieces]) {
        for (const animation of layer.getAnimations()) animation.cancel();
        layer.removeAttribute('style');
      }
      tile.style.overflow = '';
      state.run = null;
      state.done = null;
      idleFor(tile);
    };
    state.done = ended.then(settle);
    return state.done;
  }

  const rest = () => restMs(live.current.timing);

  /** While hovered, or pinned, the next change after `ms`, and on after each. */
  function cycle(tile: HTMLElement, ms: number) {
    const state = stateOf(tile);
    cancel(state.timer);
    state.timer = later(async () => {
      if (still() || !(state.hovered || pinned)) return;
      await change(tile, state.at, false);
      if (pinned || (state.hovered && live.current.tuning.cycle)) cycle(tile, rest());
    }, ms);
  }

  /** After a press, a hovered or pinned tile carries on changing. */
  const resume = (tile: HTMLElement) => {
    const state = stateOf(tile);
    if (pinned || (state.hovered && live.current.tuning.cycle)) cycle(tile, rest());
  };

  const tileAt = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLElement>('[data-sketch-tile]') : null;
  const pointIn = (tile: HTMLElement, event: MouseEvent): Point => {
    const box = tile.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  };

  // Hover is a mouse's: a finger's touch changes a tile by its tap alone.
  const onOver = (event: PointerEvent) => {
    const tile = tileAt(event.target);
    if (
      event.pointerType !== 'mouse' ||
      !tile ||
      tile.contains(event.relatedTarget as Node | null)
    ) {
      return;
    }
    const state = stateOf(tile);
    state.hovered = true;
    state.at = pointIn(tile, event);
    cycle(tile, live.current.timing.firstMs);
  };
  const onMove = (event: PointerEvent) => {
    const tile = tileAt(event.target);
    if (tile && event.pointerType === 'mouse') stateOf(tile).at = pointIn(tile, event);
  };
  const onOut = (event: PointerEvent) => {
    const tile = tileAt(event.target);
    if (!tile || tile.contains(event.relatedTarget as Node | null)) return;
    const state = stateOf(tile);
    state.hovered = false;
    if (!pinned) cancel(state.timer);
  };
  const onClick = (event: MouseEvent) => {
    const tile = tileAt(event.target);
    if (!tile) return;
    cancel(stateOf(tile).timer);
    // Enter and Space click with no pointer (detail 0): the change starts from the middle.
    const at = event.detail === 0 ? MIDDLE : pointIn(tile, event);
    void change(tile, at, true).then(() => {
      const id = tile.dataset['sketch'];
      if (id) announce(SKETCH_BY_ID.get(id)?.name ?? id);
      resume(tile);
    });
  };

  /**
   * Flip: every tile changes, in waves; then a press hears the sketches it brought, by name. The
   * flip as the page opens says nothing.
   */
  function flip(say = true) {
    const all = tiles();
    const { tuning, timing } = live.current;
    const ranks = waveRanks(tuning.wave, all.length, tuning.columns, random);
    const step = still() ? 0 : timing.waveMs;
    const landed = all.map(
      (tile, index) =>
        new Promise<void>((done) => {
          cancel(stateOf(tile).timer);
          later(
            () =>
              void change(tile, MIDDLE, true).then(() => {
                resume(tile);
                done();
              }),
            ranks[index]! * step,
          );
        }),
    );
    if (!say) return;
    void Promise.all(landed).then(() =>
      announce(
        all
          .map((tile) => SKETCH_BY_ID.get(tile.dataset['sketch'] ?? '')?.name)
          .filter(Boolean)
          .join(', '),
      ),
    );
  }

  /**
   * Each tile changes by itself on its own time: after every change, whatever made it, it waits
   * a random time between idleMinMs and idleMaxMs, drawn afresh each time, so the tiles drift
   * apart. A tile hovered or changing when its time comes waits for its next.
   */
  function idleFor(tile: HTMLElement) {
    const state = stateOf(tile);
    cancel(state.idle);
    state.idle = undefined;
    const wait = idleWaitMs(live.current.timing, random);
    if (stopped || wait === null) return;
    state.idle = later(() => {
      state.idle = undefined;
      if (still() || document.hidden || state.hovered || state.done) {
        idleFor(tile);
        return;
      }
      // A change that lands draws the next wait itself; one with nothing to show does not.
      void change(tile, MIDDLE, false).then(() => {
        if (state.idle === undefined) idleFor(tile);
      });
    }, wait);
  }

  /** Every tile's next change by itself drawn afresh, for new settings or new tiles. */
  const idleAll = () => {
    for (const tile of tiles()) idleFor(tile);
  };

  const onReduced = () => {
    if (!still()) return;
    for (const tile of tiles()) cancel(stateOf(tile).timer);
  };

  grid.addEventListener('pointerover', onOver);
  grid.addEventListener('pointermove', onMove);
  grid.addEventListener('pointerout', onOut);
  grid.addEventListener('click', onClick);
  reduced.addEventListener('change', onReduced);
  idleAll();
  // Read when it is due, not now: the lab's saved settings arrive after the play starts.
  later(() => {
    if (live.current.tuning.intro && !still()) flip(false);
  }, live.current.timing.firstMs);
  grid.dataset['playing'] = '';

  return {
    flip: () => flip(),
    pin(on) {
      pinned = on;
      const { firstMs, waveMs } = live.current.timing;
      tiles().forEach((tile, index) => {
        const state = stateOf(tile);
        if (on) cycle(tile, firstMs + index * waveMs);
        else if (!state.hovered) cancel(state.timer);
      });
    },
    still(on) {
      forcedStill = on;
      onReduced();
    },
    update: idleAll,
    stop() {
      stopped = true;
      grid.removeEventListener('pointerover', onOver);
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerout', onOut);
      grid.removeEventListener('click', onClick);
      reduced.removeEventListener('change', onReduced);
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      for (const tile of tiles()) stateOf(tile).run?.cancel();
      delete grid.dataset['playing'];
    },
  };
}
