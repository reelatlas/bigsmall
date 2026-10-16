import { flash } from '../../lib/flash';
import { BURST_TIMING } from '../../lib/timing';

/**
 * The Flip button's answer to a press (docs/UX-SPEC.md §1, "About"; Sean, 2026-10-15): calm
 * particles drift through it while the tiles change, so the press shows it landed. Each press
 * takes a mood at random, other than the last one's, in the theme's colors: bubbles rising,
 * feathers falling, sparkles twinkling, confetti tumbling, hearts floating up, ripples spreading
 * from where it was pressed, fireflies wandering, little marks (the logo's big and small circles)
 * rising, or blossoms drifting on a breeze. A press while one plays adds to it, so they blend.
 * Under reduced motion the button's fill takes the accent's soft tint and fades back instead
 * (lib/flash.ts), a change of color with no movement.
 */

export const MOODS = [
  'bubbles',
  'feathers',
  'sparkles',
  'confetti',
  'hearts',
  'ripples',
  'fireflies',
  'marks',
  'blossoms',
] as const;
export type Mood = (typeof MOODS)[number];

/** A color token a particle takes. */
type Tint = 'accent' | 'accent-soft' | 'art-1' | 'art-2' | 'art-3';

/** A point in the button, as fractions of its width and height: where a press landed. */
export interface At {
  x: number;
  y: number;
}

/**
 * One particle: where it starts across the button and down it (0 to 1), its size in px, when it
 * starts after the press and how long it lasts in ms, how far it drifts sideways in px, how far
 * it turns in degrees, the points a firefly wanders through in px, and its fill and edge.
 */
export interface Particle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  turn: number;
  wander: ReadonlyArray<readonly [number, number]>;
  fill: Tint;
  edge: Tint | null;
}

/** How many particles a press makes in each mood. */
export const COUNT: Readonly<Record<Mood, number>> = {
  bubbles: 14,
  feathers: 12,
  sparkles: 16,
  confetti: 18,
  hearts: 11,
  ripples: 4,
  fireflies: 12,
  marks: 8,
  blossoms: 11,
};

/** The smallest and largest particle of each mood, in px; a ripple grows to the whole button. */
export const SIZE: Readonly<Record<Mood, readonly [number, number]>> = {
  bubbles: [6, 13],
  feathers: [11, 18],
  sparkles: [6, 12],
  confetti: [6, 11],
  hearts: [9, 15],
  ripples: [0, 0],
  fireflies: [4, 7],
  marks: [11, 16],
  blossoms: [10, 15],
};

/** Each mood's colors, a particle taking one at random. */
const TINTS: Readonly<Record<Mood, readonly Tint[]>> = {
  bubbles: ['accent-soft'],
  feathers: ['art-1', 'art-2'],
  sparkles: ['art-1', 'accent'],
  confetti: ['accent', 'art-1', 'art-2', 'art-3'],
  hearts: ['accent', 'art-1', 'art-2'],
  ripples: ['accent'],
  fireflies: ['art-2', 'art-1'],
  marks: ['accent'],
  blossoms: ['art-1', 'art-2', 'accent-soft'],
};

/** More particles than this in a button at once, and the oldest go, however fast the presses. */
const MOST = 90;

const between = (random: () => number, [least, most]: readonly [number, number]) =>
  least + random() * (most - least);

/**
 * The particles of one press in a mood, a ripple's from where the press landed (`at`). Pure;
 * tested in node.
 */
export function particles(
  mood: Mood,
  random: () => number,
  at: At = { x: 0.5, y: 0.5 },
): Particle[] {
  const { leastMs, mostMs } = BURST_TIMING[mood];
  const tints = TINTS[mood];
  return Array.from({ length: COUNT[mood] }, (_, index) => ({
    x: mood === 'ripples' ? at.x : between(random, [0.06, 0.94]),
    y: mood === 'ripples' ? at.y : between(random, [0.15, 0.85]),
    size: between(random, SIZE[mood]),
    // Ripples spread one after another; the rest start anywhere in the spread.
    delay:
      mood === 'ripples'
        ? (index * BURST_TIMING.spreadMs) / COUNT[mood]
        : between(random, [0, BURST_TIMING.spreadMs]),
    duration: between(random, [leastMs, mostMs]),
    drift: between(random, [-10, 10]),
    turn: between(random, [180, 540]) * (random() < 0.5 ? -1 : 1),
    wander: Array.from(
      { length: 4 },
      () => [between(random, [-14, 14]), between(random, [-9, 9])] as const,
    ),
    fill: tints[Math.floor(random() * tints.length)] ?? 'accent',
    edge: mood === 'bubbles' ? 'accent' : null,
  }));
}

/** A mood other than `last`, at random. */
export function nextMood(last: Mood | undefined, random: () => number): Mood {
  const choices = MOODS.filter((mood) => mood !== last);
  return choices[Math.floor(random() * choices.length)] ?? 'bubbles';
}

/** A sparkle's four points. */
const STAR = 'polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)';

/** The moods drawn as small pictures rather than shapes of CSS, on a 32-unit grid. */
const PICTURES: Partial<Record<Mood, (fill: string) => string>> = {
  hearts: (fill) =>
    `<path d="M16 28C7 21.5 3 16.5 3 11.2C3 7 6.2 4 10 4C12.6 4 14.8 5.3 16 7.4C17.2 5.3 19.4 4 22 4C25.8 4 29 7 29 11.2C29 16.5 25 21.5 16 28Z" style="fill:${fill}"/>`,
  marks: (fill) =>
    `<circle cx="13" cy="15" r="8.5" style="fill:${fill}"/>` +
    '<circle cx="21.5" cy="21.5" r="5.7" style="fill:var(--surface)"/>' +
    '<circle cx="21.5" cy="21.5" r="3.9" style="fill:var(--art-2)"/>',
  blossoms: (fill) =>
    [0, 72, 144, 216, 288]
      .map(
        (angle) =>
          `<circle cx="16" cy="8.5" r="6" transform="rotate(${angle} 16 16)" style="fill:${fill}"/>`,
      )
      .join('') + '<circle cx="16" cy="16" r="4" style="fill:var(--art-2)"/>',
};

/** How a particle moves through a button `height` px tall. */
function keyframes(mood: Mood, particle: Particle, height: number): Keyframe[] {
  const { size, drift, turn, wander } = particle;
  const rise = -(height + size);
  const fall = height + 2 * size;
  switch (mood) {
    case 'bubbles':
      return [
        { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
        { offset: 0.15, opacity: 0.9 },
        { offset: 0.6, transform: `translate(${drift}px, ${rise * 0.6}px) scale(0.9)` },
        { transform: `translate(${-drift / 2}px, ${rise}px) scale(1)`, opacity: 0 },
      ];
    case 'feathers':
      return [
        { transform: 'translate(0, 0) rotate(-35deg)', opacity: 0 },
        { offset: 0.2, opacity: 0.9 },
        { offset: 0.35, transform: `translate(${drift}px, ${fall * 0.35}px) rotate(20deg)` },
        { offset: 0.7, transform: `translate(${-drift}px, ${fall * 0.7}px) rotate(-15deg)` },
        { transform: `translate(${drift / 2}px, ${fall}px) rotate(10deg)`, opacity: 0 },
      ];
    case 'sparkles':
      return [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { offset: 0.5, transform: 'scale(1) rotate(45deg)', opacity: 1 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 },
      ];
    case 'confetti':
      // Tumbling as it falls: a turn, and its width flipping through zero like a card in the air.
      return [
        { transform: 'translate(0, 0) rotate(0deg) scaleX(1)', opacity: 0 },
        { offset: 0.1, opacity: 1 },
        {
          offset: 0.35,
          transform: `translate(${drift}px, ${fall * 0.35}px) rotate(${turn * 0.35}deg) scaleX(-1)`,
        },
        {
          offset: 0.7,
          transform: `translate(${-drift}px, ${fall * 0.7}px) rotate(${turn * 0.7}deg) scaleX(1)`,
        },
        { transform: `translate(0, ${fall}px) rotate(${turn}deg) scaleX(-1)`, opacity: 0 },
      ];
    case 'hearts':
      return [
        { transform: 'translate(0, 0) scale(0.5) rotate(-10deg)', opacity: 0 },
        { offset: 0.15, opacity: 1 },
        { offset: 0.5, transform: `translate(${drift}px, ${rise * 0.5}px) scale(1) rotate(8deg)` },
        { transform: `translate(${-drift}px, ${rise}px) scale(0.9) rotate(-6deg)`, opacity: 0 },
      ];
    case 'ripples':
      return [
        { transform: 'translate(-50%, -50%) scale(0.05)', opacity: 0.8 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
      ];
    case 'fireflies': {
      const [first, second, third, last] = wander.map(([x, y]) => `${x}px, ${y}px`);
      return [
        { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
        { offset: 0.25, transform: `translate(${first}) scale(1)`, opacity: 1 },
        { offset: 0.5, transform: `translate(${second}) scale(0.8)`, opacity: 0.35 },
        { offset: 0.75, transform: `translate(${third}) scale(1)`, opacity: 1 },
        { transform: `translate(${last}) scale(0.6)`, opacity: 0 },
      ];
    }
    case 'marks':
      return [
        { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
        { offset: 0.15, opacity: 1 },
        { offset: 0.55, transform: `translate(${drift}px, ${rise * 0.55}px) scale(1)` },
        { transform: `translate(${-drift / 2}px, ${rise}px) scale(0.85)`, opacity: 0 },
      ];
    case 'blossoms':
      // On a breeze: down and across, turning slowly.
      return [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        { offset: 0.15, opacity: 1 },
        {
          offset: 0.5,
          transform: `translate(${Math.abs(drift) + 8}px, ${fall * 0.5}px) rotate(${turn / 2}deg)`,
        },
        {
          transform: `translate(${Math.abs(drift) * 2 + 18}px, ${fall}px) rotate(${turn}deg)`,
          opacity: 0,
        },
      ];
  }
}

/** Where a particle starts in a button `width` × `height` px, before it moves. */
function start(mood: Mood, { x, y, size }: Particle, width: number, height: number) {
  switch (mood) {
    case 'bubbles':
    case 'hearts':
    case 'marks':
      return { left: x * width - size / 2, top: height - size / 2 };
    case 'feathers':
    case 'confetti':
      return { left: x * width - size / 2, top: -size };
    case 'blossoms':
      return { left: x * width - size, top: -size };
    default:
      return { left: x * width - size / 2, top: y * height - size / 2 };
  }
}

let last: Mood | undefined;

/**
 * Plays a press in `layer`, the button's particle layer behind its label: a mood at random
 * (`'any'`), or `mood` when one is chosen (the lab), from `at`, where the press landed. Under reduced motion,
 * a flash of `button` instead.
 */
export function burst(layer: HTMLElement, button: HTMLElement, at: At, mood: Mood | 'any'): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    flash(button);
    return;
  }
  const playing = mood === 'any' ? nextMood(last, Math.random) : mood;
  last = playing;
  const { width, height } = layer.getBoundingClientRect();
  const easing = getComputedStyle(layer).getPropertyValue('--motion-glide').trim() || 'linear';
  // A ripple grows until it reaches the button's farthest corner from the press.
  const reach = 2 * Math.hypot(Math.max(at.x, 1 - at.x) * width, Math.max(at.y, 1 - at.y) * height);
  for (const particle of particles(playing, Math.random, at)) {
    const fill = `var(--${particle.fill})`;
    const picture = PICTURES[playing];
    const size = playing === 'ripples' ? reach : particle.size;
    const tall = playing === 'feathers' ? size * 0.4 : playing === 'confetti' ? size * 0.45 : size;
    const dot = picture
      ? document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      : document.createElement('span');
    if (picture) {
      dot.setAttribute('viewBox', '0 0 32 32');
      dot.innerHTML = picture(fill);
    }
    const { left, top } =
      playing === 'ripples'
        ? { left: particle.x * width, top: particle.y * height }
        : start(playing, particle, width, height);
    Object.assign((dot as HTMLElement).style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${size}px`,
      height: `${tall}px`,
      background: picture ? '' : playing === 'ripples' ? '' : fill,
      border:
        playing === 'ripples'
          ? `1.5px solid ${fill}`
          : particle.edge
            ? `1.5px solid var(--${particle.edge})`
            : '',
      borderRadius:
        playing === 'feathers'
          ? '100% 0'
          : playing === 'confetti'
            ? '20%'
            : picture
              ? ''
              : '9999px',
      boxShadow: playing === 'fireflies' ? `0 0 ${size * 1.5}px ${fill}` : '',
      clipPath: playing === 'sparkles' ? STAR : '',
      opacity: '0',
    });
    layer.append(dot);
    const animation = dot.animate(keyframes(playing, { ...particle, size }, height), {
      duration: particle.duration,
      delay: particle.delay,
      easing,
      fill: 'both',
    });
    animation.finished.then(
      () => dot.remove(),
      () => dot.remove(),
    );
  }
  while (layer.childElementCount > MOST) layer.firstElementChild?.remove();
}
