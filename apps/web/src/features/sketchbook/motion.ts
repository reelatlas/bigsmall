import {
  deckOf,
  draw,
  SKETCH_BY_ID,
  SKETCH_EFFECTS,
  SPRING_EASING,
  waveRanks,
  type SketchbookSettings,
  type SketchEasing,
  type SketchEffect,
} from './sketches';

/**
 * The sketchbook at play (docs/UX-SPEC.md §14, the About page). Hovering a tile with a mouse
 * changes it to the next sketch, and keeps changing it while the mouse stays; a click, a tap,
 * Enter, or Space changes it at once; Shuffle changes every tile in a wave. A change runs on the
 * Web Animations API between the tile's two layers, the sketch showing and the one arriving,
 * which then takes its place. Under reduced motion nothing changes by itself: a press
 * cross-fades, and Shuffle changes every tile at once.
 */

/** Where a sketch's symbol is on the page (SketchSprite.astro). */
export const sketchHref = (id: string) => `#sketch-${id}`;

/** A point in a tile, as fractions of its width and height: where a press landed. */
export interface Point {
  x: number;
  y: number;
}

const MIDDLE: Point = { x: 0.5, y: 0.5 };

/** Controls besides the pointer and the keys, for Shuffle and /dev/sketchbook-lab. */
export interface SketchbookPlayer {
  /** Changes a tile now, from a point in it, cutting short a change under way. */
  next(tile: HTMLElement, at?: Point): Promise<void>;
  /** Changes every tile, in a wave. */
  shuffle(): void;
  /** Plays every tile as if hovered. */
  pin(on: boolean): void;
  /** Plays as under reduced motion, whatever the system asks. */
  still(on: boolean): void;
  /** Takes in changed settings: restarts the idle changes at their new pace. */
  update(): void;
  stop(): void;
}

interface TileState {
  hovered: boolean;
  /** Where the mouse is over the tile, for an iris that opens from it. */
  at: Point;
  timer: number | undefined;
  running: Animation[];
  /** Settles when the change under way has. */
  done: Promise<void> | null;
}

/** A change, layer by layer: the sketch showing (front) leaves, the next (back) arrives. */
interface Frames {
  front: Keyframe[];
  back: Keyframe[];
  /** The tile clips the layers to its corners while they move (a slide). */
  clip: boolean;
}

/** How each effect moves the layers; `size` is the tile's width in px. */
export function frames(effect: SketchEffect, size: number, at: Point): Frames {
  const turn = (axis: 'rotateX' | 'rotateY'): Frames => {
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
  }
}

/** The curve a change follows, read from the tile's theme. */
function easingOf(easing: SketchEasing, tile: HTMLElement): string {
  if (easing === 'spring') return SPRING_EASING;
  const token = easing === 'ease' ? '--motion-ease' : '--motion-glide';
  return getComputedStyle(tile).getPropertyValue(token).trim() || 'linear';
}

/**
 * Plays the tiles in `grid` (each a [data-sketch-tile] holding a front and a back layer) by the
 * settings in `live`, read at every change, so the lab's changes apply at once. `announce` says a
 * pressed tile's new sketch, or that the grid shuffled. The grid is marked `data-playing` while
 * it plays, which the browser tests wait for.
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
  let idle: number | undefined;
  let deck: string[] = [];
  let lastEffect: SketchEffect | undefined;

  const still = () => forcedStill || reduced.matches;
  const tiles = () => [...grid.querySelectorAll<HTMLElement>('[data-sketch-tile]')];
  const stateOf = (tile: HTMLElement): TileState => {
    let state = states.get(tile);
    if (!state) {
      state = { hovered: false, at: MIDDLE, timer: undefined, running: [], done: null };
      states.set(tile, state);
    }
    return state;
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

  const effectFor = (): SketchEffect => {
    const { effect } = live.current.tuning;
    if (still()) return 'fade';
    if (effect !== 'mixed') return effect;
    const choices = SKETCH_EFFECTS.filter((each) => each !== 'fade' && each !== lastEffect);
    lastEffect = choices[Math.floor(random() * choices.length)] ?? 'flip';
    return lastEffect;
  };

  /**
   * Changes a tile to the next sketch. A change under way is cut short when `cut` (a press), and
   * waited for otherwise (the hover's next change).
   */
  async function change(tile: HTMLElement, at: Point, cut: boolean): Promise<void> {
    const state = stateOf(tile);
    if (state.done) {
      if (cut) for (const animation of state.running) animation.finish();
      await state.done;
    }
    const { timing, tuning } = live.current;
    deck = deck.filter((id) => tuning.set.includes(id));
    const own = tile.dataset['sketch'];
    const id = draw(deck, () => deckOf(tuning.set, tuning.order, random), showing(), own);
    const front = tile.querySelector<SVGSVGElement>('[data-layer="front"]');
    const back = tile.querySelector<SVGSVGElement>('[data-layer="back"]');
    if (!id || id === own || !front || !back) return;

    back.querySelector('use')?.setAttribute('href', sketchHref(id));
    tile.dataset['next'] = id;
    const motion = frames(effectFor(), tile.getBoundingClientRect().width, at);
    const options: KeyframeAnimationOptions = {
      duration: timing.swapMs,
      easing: easingOf(tuning.easing, tile),
      fill: 'forwards',
    };
    if (motion.clip) tile.style.overflow = 'hidden';
    state.running = [front.animate(motion.front, options), back.animate(motion.back, options)];

    // In one task, so no frame shows between: the front takes the new sketch, the layers go back.
    const settle = (arrived: boolean) => {
      if (arrived) {
        front.querySelector('use')?.setAttribute('href', sketchHref(id));
        tile.dataset['sketch'] = id;
        tile.setAttribute('aria-label', SKETCH_BY_ID.get(id)?.name ?? id);
      }
      delete tile.dataset['next'];
      for (const animation of state.running) animation.cancel();
      state.running = [];
      tile.style.overflow = '';
      state.done = null;
    };
    state.done = Promise.all(state.running.map((animation) => animation.finished)).then(
      () => settle(true),
      // Cancelled: the page is going, or the lab stopped the play.
      () => settle(false),
    );
    return state.done;
  }

  /** While hovered, or pinned, the next change after `ms`, and on after each. */
  function cycle(tile: HTMLElement, ms: number) {
    const state = stateOf(tile);
    cancel(state.timer);
    state.timer = later(async () => {
      if (still() || !(state.hovered || pinned)) return;
      await change(tile, state.at, false);
      if (pinned || (state.hovered && live.current.tuning.cycle)) {
        cycle(tile, live.current.timing.holdMs);
      }
    }, ms);
  }

  /** After a press, a hovered or pinned tile carries on changing. */
  const resume = (tile: HTMLElement) => {
    const state = stateOf(tile);
    if (pinned || (state.hovered && live.current.tuning.cycle)) {
      cycle(tile, live.current.timing.holdMs);
    }
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

  function shuffle() {
    const all = tiles();
    const { tuning, timing } = live.current;
    const ranks = waveRanks(tuning.wave, all.length, tuning.columns, random);
    const step = still() ? 0 : timing.waveMs;
    all.forEach((tile, index) => {
      cancel(stateOf(tile).timer);
      later(() => void change(tile, MIDDLE, true).then(() => resume(tile)), ranks[index]! * step);
    });
    announce('Shuffled');
  }

  /** Above 0, a tile nobody is hovering changes by itself every idleMs. */
  function idleLoop() {
    cancel(idle);
    const ms = live.current.timing.idleMs;
    if (ms <= 0) return;
    idle = later(() => {
      if (!still() && !document.hidden) {
        const free = tiles().filter((tile) => !stateOf(tile).hovered && !stateOf(tile).done);
        const tile = free[Math.floor(random() * free.length)];
        if (tile) void change(tile, MIDDLE, false);
      }
      idleLoop();
    }, ms);
  }

  const onReduced = () => {
    if (!still()) return;
    for (const tile of tiles()) cancel(stateOf(tile).timer);
  };

  grid.addEventListener('pointerover', onOver);
  grid.addEventListener('pointermove', onMove);
  grid.addEventListener('pointerout', onOut);
  grid.addEventListener('click', onClick);
  reduced.addEventListener('change', onReduced);
  idleLoop();
  // Read when it is due, not now: the lab's saved settings arrive after the play starts.
  later(() => {
    if (live.current.tuning.intro && !still()) shuffle();
  }, live.current.timing.firstMs);
  grid.dataset['playing'] = '';

  return {
    next: (tile, at = MIDDLE) => change(tile, at, true),
    shuffle,
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
    update: idleLoop,
    stop() {
      grid.removeEventListener('pointerover', onOver);
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerout', onOut);
      grid.removeEventListener('click', onClick);
      reduced.removeEventListener('change', onReduced);
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      for (const tile of tiles()) for (const animation of stateOf(tile).running) animation.cancel();
      delete grid.dataset['playing'];
    },
  };
}
