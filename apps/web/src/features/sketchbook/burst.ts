import { flash } from '../../lib/flash';
import { BURST_TIMING } from '../../lib/timing';

/**
 * The Flip button's answer to a press (docs/UX-SPEC.md §1, "About"; Sean, 2026-10-15): a few calm
 * particles drift through it while the tiles change, so the press shows it landed. Each press
 * takes a mood at random, other than the last one's: bubbles rising, feathers falling, or
 * sparkles twinkling, in the theme's colors. A press while one plays adds to it, so they blend.
 * Under reduced motion the button's fill takes the accent's soft tint and fades back instead
 * (lib/flash.ts), a change of color with no movement.
 */

export const MOODS = ['bubbles', 'feathers', 'sparkles'] as const;
export type Mood = (typeof MOODS)[number];

/** A color token a particle takes. */
type Tint = 'accent' | 'accent-soft' | 'art-1' | 'art-2';

/**
 * One particle: where it starts across the button and down it (0 to 1), its size in px, when it
 * starts after the press and how long it lasts in ms, how far it drifts sideways in px, and its
 * fill and edge.
 */
export interface Particle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  fill: Tint;
  edge: Tint | null;
}

/** How many particles a press makes in each mood. */
const COUNT: Readonly<Record<Mood, number>> = { bubbles: 10, feathers: 8, sparkles: 12 };

/** The smallest and largest particle of each mood, in px. */
const SIZE: Readonly<Record<Mood, readonly [number, number]>> = {
  bubbles: [4, 9],
  feathers: [8, 13],
  sparkles: [4, 8],
};

/** More particles than this in a button at once, and the oldest go, however fast the presses. */
const MOST = 40;

const between = (random: () => number, [least, most]: readonly [number, number]) =>
  least + random() * (most - least);

/** The particles of one press in a mood. Pure; tested in node. */
export function particles(mood: Mood, random: () => number): Particle[] {
  const { leastMs, mostMs } = BURST_TIMING[mood];
  return Array.from({ length: COUNT[mood] }, () => {
    const pick = random() < 0.5;
    return {
      x: between(random, [0.08, 0.92]),
      y: between(random, [0.15, 0.85]),
      size: between(random, SIZE[mood]),
      delay: between(random, [0, BURST_TIMING.spreadMs]),
      duration: between(random, [leastMs, mostMs]),
      drift: between(random, [-8, 8]),
      fill:
        mood === 'bubbles'
          ? 'accent-soft'
          : pick
            ? 'art-1'
            : mood === 'feathers'
              ? 'art-2'
              : 'accent',
      edge: mood === 'bubbles' ? 'accent' : null,
    };
  });
}

/** A mood other than `last`, at random. */
export function nextMood(last: Mood | undefined, random: () => number): Mood {
  const choices = MOODS.filter((mood) => mood !== last);
  return choices[Math.floor(random() * choices.length)] ?? 'bubbles';
}

/** A sparkle's four points. */
const STAR = 'polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)';

/** How a particle moves through a button `height` px tall. */
function keyframes(mood: Mood, { size, drift }: Particle, height: number): Keyframe[] {
  if (mood === 'bubbles') {
    const rise = -(height + size);
    return [
      { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
      { offset: 0.15, opacity: 0.9 },
      { offset: 0.6, transform: `translate(${drift}px, ${rise * 0.6}px) scale(0.9)` },
      { transform: `translate(${-drift / 2}px, ${rise}px) scale(1)`, opacity: 0 },
    ];
  }
  if (mood === 'feathers') {
    const fall = height + 2 * size;
    return [
      { transform: 'translate(0, 0) rotate(-35deg)', opacity: 0 },
      { offset: 0.2, opacity: 0.9 },
      { offset: 0.35, transform: `translate(${drift}px, ${fall * 0.35}px) rotate(20deg)` },
      { offset: 0.7, transform: `translate(${-drift}px, ${fall * 0.7}px) rotate(-15deg)` },
      { transform: `translate(${drift / 2}px, ${fall}px) rotate(10deg)`, opacity: 0 },
    ];
  }
  return [
    { transform: 'scale(0) rotate(0deg)', opacity: 0 },
    { offset: 0.5, transform: 'scale(1) rotate(45deg)', opacity: 1 },
    { transform: 'scale(0) rotate(90deg)', opacity: 0 },
  ];
}

let last: Mood | undefined;

/**
 * Plays a press in `layer`, the button's particle layer behind its label: bubbles start at its
 * foot, feathers above its top, sparkles anywhere in it. Under reduced motion, a flash of
 * `button` instead.
 */
export function burst(layer: HTMLElement, button: HTMLElement): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    flash(button);
    return;
  }
  const mood = nextMood(last, Math.random);
  last = mood;
  const { width, height } = layer.getBoundingClientRect();
  const easing = getComputedStyle(layer).getPropertyValue('--motion-glide').trim() || 'linear';
  for (const particle of particles(mood, Math.random)) {
    const { size } = particle;
    const dot = document.createElement('span');
    const top =
      mood === 'bubbles' ? height - size / 2 : mood === 'feathers' ? -size : particle.y * height;
    Object.assign(dot.style, {
      position: 'absolute',
      left: `${particle.x * width - size / 2}px`,
      top: `${top - (mood === 'sparkles' ? size / 2 : 0)}px`,
      width: `${size}px`,
      height: `${mood === 'feathers' ? size * 0.4 : size}px`,
      background: `var(--${particle.fill})`,
      border: particle.edge ? `1.5px solid var(--${particle.edge})` : '',
      borderRadius: mood === 'feathers' ? '100% 0' : '9999px',
      clipPath: mood === 'sparkles' ? STAR : '',
      opacity: '0',
    });
    layer.append(dot);
    const animation = dot.animate(keyframes(mood, particle, height), {
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
