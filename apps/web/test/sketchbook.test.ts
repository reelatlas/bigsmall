import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNT, MOODS, nextMood, particles, SIZE } from '../src/features/sketchbook/burst';
import { DOORS, doorFrames, idleWaitMs, restMs } from '../src/features/sketchbook/motion';
import { BURST_TIMING, SKETCH_MIN_GAP_MS } from '../src/lib/timing';
import {
  bandClip,
  blockClip,
  blocksClip,
  cutClip,
  drawnClip,
  envelope,
  FLICKER_SHARE,
  glitchFrame,
  grainOf,
  halfClip,
  OVER,
  scanFrame,
  scrambleFrame,
  scrambleOrder,
  SLATS,
  slatsClip,
} from '../src/features/sketchbook/frames';
import {
  deckOf,
  draw,
  FAMILIES,
  inOrder,
  SKETCH_BY_ID,
  SKETCHES,
  START,
  startingSketches,
  waveRanks,
} from '../src/features/sketchbook/sketches';

// The sketchbook's catalog, its art, and how it deals sketches out (docs/UX-SPEC.md §1, "About").

const ART = new URL('../src/assets/sketchbook/', import.meta.url);
const ids = SKETCHES.map(({ id }) => id);

/** A seeded random source, so a shuffle is the same every run. */
const seeded = () => {
  let seed = 7;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};

describe('the catalog', () => {
  it('has a file for every sketch and a sketch for every file', () => {
    const files = readdirSync(ART)
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.slice(0, -'.svg'.length));
    expect(files.sort()).toEqual([...ids].sort());
  });

  it('names each sketch once, in a family it lists, and starts the grid from its own sketches', () => {
    expect(new Set(ids).size).toBe(ids.length);
    const families = new Set(FAMILIES.map(({ id }) => id));
    for (const sketch of SKETCHES) expect(families.has(sketch.family), sketch.id).toBe(true);
    for (const id of START) expect(SKETCH_BY_ID.has(id), id).toBe(true);
    // The mark in the middle of the shipped row of three, first to show.
    expect(START[1]).toBe('r6');
  });

  it('draws each sketch on a rounded 32-unit tile, with nothing that could clash on a page or load', () => {
    for (const id of ids) {
      const svg = readFileSync(new URL(`${id}.svg`, ART), 'utf8');
      expect(svg, id).toMatch(
        /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#[0-9a-f]{6}"\/>/,
      );
      // Ids would repeat in the page's sprite; a link, a style, or a script could load or leak.
      expect(svg, id).not.toMatch(/\sid=|href|url\(|<image|<style|<script/);
    }
  });
});

describe('dealing sketches', () => {
  it('shows every sketch in the set before any comes back', () => {
    const random = seeded();
    const deck: string[] = [];
    const refill = () => deckOf(ids, 'shuffled', random);
    const dealt = ids.map(() => draw(deck, refill, new Set(), undefined));
    expect(new Set(dealt).size).toBe(ids.length);
  });

  it('skips a sketch already showing, and when all are, gives one other than the tile’s own', () => {
    const deck = ['a1', 'a2', 'a3'];
    expect(draw(deck, () => ['a1', 'a2', 'a3'], new Set(['a1']), 'a1')).toBe('a2');
    const showing = new Set(['a1', 'a2']);
    expect(draw(['a1'], () => ['a1', 'a2'], showing, 'a1')).toBe('a2');
    expect(draw([], () => [], new Set(), undefined)).toBeNull();
  });

  it('deals in the catalog’s order when asked, and shuffles otherwise', () => {
    expect(deckOf(['k1', 'a2', 'r1'], 'catalog', Math.random)).toEqual(['r1', 'a2', 'k1']);
    const shuffled = deckOf(ids, 'shuffled', seeded());
    expect([...shuffled].sort()).toEqual([...ids].sort());
    expect(shuffled).not.toEqual(ids);
  });

  it('starts the grid in START’s order, then the catalog’s, repeating a set smaller than the grid', () => {
    expect(startingSketches(ids, 3)).toEqual(START.slice(0, 3));
    expect(inOrder(['k1', 'r6', 'a1'])).toEqual(['r6', 'a1', 'k1']);
    expect(startingSketches(['k1', 'k2'], 5)).toEqual(['k1', 'k2', 'k1', 'k2', 'k1']);
    expect(startingSketches([], 4)).toEqual([]);
  });
});

describe('waves', () => {
  it('ranks a grid’s tiles diagonally, by rows, from the middle, or at random', () => {
    expect(waveRanks('rows', 6, 3, Math.random)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(waveRanks('diagonal', 6, 3, Math.random)).toEqual([0, 1, 2, 1, 2, 3]);
    const center = waveRanks('center', 9, 3, Math.random);
    expect(center[4]).toBe(0);
    expect(Math.min(...center.filter((_, index) => index !== 4))).toBeGreaterThan(0);
    expect([...waveRanks('random', 6, 3, seeded())].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('the stepped changes', () => {
  it('glitch in bands that never overlap and never cover more than a quarter of the tile', () => {
    const random = seeded();
    for (let k = 0; k < 48; k++) {
      const { bands, fringe } = glitchFrame(k % 16, 16, 1, random);
      const total = bands.reduce((sum, band) => sum + band.height, 0);
      expect(total).toBeLessThanOrEqual(FLICKER_SHARE + 1e-9);
      const sorted = [...bands].sort((a, b) => a.top - b.top);
      sorted.forEach((band, index) => {
        expect(band.top).toBeGreaterThanOrEqual(0);
        expect(band.top + band.height).toBeLessThanOrEqual(1 + 1e-9);
        const above = sorted[index - 1];
        if (above) expect(band.top).toBeGreaterThanOrEqual(above.top + above.height - 1e-9);
      });
      expect(fringe).toBeGreaterThanOrEqual(0);
      expect(fringe).toBeLessThanOrEqual(1);
    }
  });

  it('glitch hardest in the middle, where the picture changes, and not at all at no strength', () => {
    expect(envelope(8, 16)).toBeGreaterThan(0.99);
    const { bands, fringe } = glitchFrame(8, 16, 0, seeded());
    expect(fringe).toBe(0);
    expect(bands).toEqual([]);
  });

  it('glitch not at all at its first frame and its last, so the settle after it paints nothing new', () => {
    for (const count of [2, 3, 16, 20, 41]) {
      expect(envelope(0, count), `${count}`).toBeCloseTo(0, 12);
      expect(envelope(count - 1, count), `${count}`).toBeCloseTo(0, 12);
      expect(glitchFrame(count - 1, count, 1, seeded()).bands).toEqual([]);
      // Every frame between glitches; the middle hardest.
      for (let k = 1; k < count - 1; k++) {
        expect(envelope(k, count), `${k} of ${count}`).toBeGreaterThan(0);
      }
    }
  });

  it('scramble every block in, flipping no more than a quarter of them at once', () => {
    const order = scrambleOrder(seeded());
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    for (let step = 0; step <= 20; step++) {
      const { landed, flipping } = scrambleFrame(order, step / 20);
      expect(flipping.length).toBeLessThanOrEqual(FLICKER_SHARE * 16);
      expect(landed.filter((block) => flipping.includes(block))).toEqual([]);
    }
    expect(scrambleFrame(order, 0).landed).toEqual([]);
    expect(scrambleFrame(order, 1).landed).toHaveLength(16);
    expect(scrambleFrame(order, 1).flipping).toEqual([]);
  });

  it('scan row by row to the bottom, the bright row a sixteenth of the tile', () => {
    expect(scanFrame(0, Math.random).drawn).toBe(0);
    expect(scanFrame(1, Math.random)).toEqual({ drawn: 1, row: null });
    expect(scanFrame(0.5, Math.random).row?.height).toBe(1 / 16);
  });

  it('write clip-paths that cut bands out as holes and join blocks into one shape', () => {
    expect(cutClip([])).toBe(
      'polygon(evenodd, -10% -10%, 110% -10%, 110% 110%, -10% 110%, -10% -10%)',
    );
    expect(cutClip([{ top: 0.25, height: 0.1 }])).toContain(
      '-10% 25%, 110% 25%, 110% 35%, -10% 35%, -10% 25%, -10% -10%',
    );
    expect(bandClip({ top: 0.25, height: 0.1 })).toBe('inset(25% -10% 65% -10%)');
    expect(blockClip(5)).toBe('inset(25% 50% 50% 25%)');
    expect(blocksClip([])).toBe('inset(50%)');
    expect(blocksClip([0])).toBe(
      'polygon(evenodd, 0% 0%, 0% 0%, 25% 0%, 25% 25%, 0% 25%, 0% 0%, 0% 0%)',
    );
    expect(drawnClip(0.25)).toBe('inset(0 0 75% 0)');
  });

  it('put the pieces’ edges on device pixels, the piece on top reaching one past the edge it shares', () => {
    // A 108 px tile at (17, 100) on a 3× screen: a band from 30.3% lands at 132.724 CSS px on the
    // page, 398.17 device px, so its edge snaps to 398, 32.667 px into the tile.
    const grain = grainOf({ left: 17, top: 100, width: 108, height: 108 }, 3);
    const band = { top: 0.303, height: 0.08 };
    expect(cutClip([band], grain)).toContain('-10% 32.667px, 110% 32.667px, 110% 41.333px');
    // The band over its hole: one device pixel (a third of a CSS px) past each edge.
    expect(bandClip(band, grain)).toBe('inset(32.667px -10% 66.667px -10%)');
    expect(bandClip(band, grain, OVER)).toBe('inset(32.333px -10% 66.333px -10%)');
    expect(drawnClip(0.303, grain)).toBe('inset(0 0 75.333px 0)');
    expect(blockClip(5, grain, OVER)).toBe('inset(26.667px 53.667px 53.667px 26.667px)');
    expect(blocksClip([5], grain)).toContain('27px 27px, 54px 27px, 54px 54px, 27px 54px');
    // Flap: the front's bottom half, under everything, reaches over the middle; the back's top
    // half, and the halves that turn, keep it exact.
    expect(halfClip('bottom', grain, OVER)).toBe('inset(53.667px 0 0 0)');
    expect(halfClip('bottom', grain)).toBe('inset(54px 0 0 0)');
    expect(halfClip('top', grain)).toBe('inset(0 0 54px 0)');
    // Every edge on a device pixel, at a scale that is not whole too, from a tile at a fraction.
    const odd = { left: 16.4, top: 203.2, width: 103, height: 103 };
    for (const dpr of [1, 1.25, 2, 2.625, 3]) {
      const fine = grainOf(odd, dpr);
      for (const fraction of [0, 0.303, 0.5, 0.75, 1]) {
        const top = Number.parseFloat(fine.top(fraction));
        const device = (odd.top + top) * dpr;
        expect(Math.abs(device - Math.round(device)), `${dpr}× top ${fraction}`).toBeLessThan(0.01);
        const left = Number.parseFloat(fine.left(fraction, OVER));
        const past = (odd.left + left) * dpr;
        expect(Math.abs(past - Math.round(past)), `${dpr}× left ${fraction}`).toBeLessThan(0.01);
        // Over reaches one device pixel further out (the lengths are written to 3 decimals).
        expect(
          Number.parseFloat(fine.top(fraction)) - Number.parseFloat(fine.top(fraction, OVER)),
        ).toBeCloseTo(1 / dpr, 2);
      }
    }
    // Without a grain, percentages, exact: the frames' shapes.
    expect(bandClip(band)).toBe('inset(30.3% -10% 61.7% -10%)');
    expect(halfClip('top')).toBe('inset(0 0 50% 0)');
    expect(halfClip('bottom')).toBe('inset(50% 0 0 0)');
  });

  it('open blinds from shut to whole with one count of points, so the change animates', () => {
    const points = (clip: string) => clip.split(',').length;
    expect(points(slatsClip(0))).toBe(points(slatsClip(1)));
    const open = slatsClip(1);
    for (let slat = 1; slat < SLATS; slat++) {
      const edge = `${Number(((slat / SLATS) * 100).toFixed(3))}%`;
      // Each slat open reaches the next one's top: no gap between them.
      expect(open.split(`100% ${edge}`).length - 1).toBe(2);
    }
  });
});

describe('Doors', () => {
  it('swing each half open on its outer edge, ending hidden, its depth the tile’s own', () => {
    for (const half of DOORS) {
      const frames = doorFrames(half);
      expect(frames[0]).toMatchObject({ transform: 'rotateY(0deg)', opacity: 1 });
      // Hidden at the end whatever an engine draws edge-on: WebKit drew the right half, through a
      // perspective() of its own, still half open there (docs/LEARNINGS.md).
      expect(frames.at(-1)).toMatchObject({ transform: `rotateY(${half.degrees}deg)`, opacity: 0 });
      expect(frames.some((frame) => String(frame.transform ?? '').includes('perspective'))).toBe(
        false,
      );
    }
  });
});

describe('the Flip button’s particles', () => {
  it('drift in each of the nine moods within their sizes and lengths, starting within the spread', () => {
    expect(MOODS).toHaveLength(9);
    const random = seeded();
    for (const mood of MOODS) {
      const at = { x: 0.3, y: 0.7 };
      const made = particles(mood, random, at);
      expect(made, mood).toHaveLength(COUNT[mood]);
      const [least, most] = SIZE[mood];
      for (const particle of made) {
        expect(particle.x).toBeGreaterThanOrEqual(0);
        expect(particle.x).toBeLessThanOrEqual(1);
        expect(particle.y).toBeGreaterThanOrEqual(0);
        expect(particle.y).toBeLessThanOrEqual(1);
        expect(particle.delay).toBeGreaterThanOrEqual(0);
        expect(particle.delay).toBeLessThanOrEqual(BURST_TIMING.spreadMs);
        expect(particle.duration).toBeGreaterThanOrEqual(BURST_TIMING[mood].leastMs);
        expect(particle.duration).toBeLessThanOrEqual(BURST_TIMING[mood].mostMs);
        expect(particle.size, mood).toBeGreaterThanOrEqual(least);
        expect(particle.size, mood).toBeLessThanOrEqual(most);
        // Ripples spread from where the press landed.
        if (mood === 'ripples') expect([particle.x, particle.y]).toEqual([at.x, at.y]);
      }
    }
  });

  it('never take the same mood twice in a row', () => {
    const random = seeded();
    let last = nextMood(undefined, random);
    for (let press = 0; press < 30; press++) {
      const mood = nextMood(last, random);
      expect(mood).not.toBe(last);
      last = mood;
    }
  });
});

describe('the sketchbook’s pace', () => {
  // The lab's ranges: changes of 100 to 2000 ms, holds of 100 to 4000, waits of 0 to 10000.
  it('never starts a playing tile’s next change sooner than the gap after the last began', () => {
    for (let swapMs = 100; swapMs <= 2000; swapMs += 50) {
      for (let holdMs = 100; holdMs <= 4000; holdMs += 100) {
        expect(swapMs + restMs({ holdMs, swapMs })).toBeGreaterThanOrEqual(SKETCH_MIN_GAP_MS);
      }
    }
  });

  it('waits at least the gap before a tile changes by itself, and never with both waits at 0', () => {
    const random = seeded();
    for (let idleMinMs = 0; idleMinMs <= 10000; idleMinMs += 250) {
      for (let idleMaxMs = 0; idleMaxMs <= 10000; idleMaxMs += 250) {
        const wait = idleWaitMs({ idleMinMs, idleMaxMs }, random);
        if (idleMinMs === 0 && idleMaxMs === 0) expect(wait).toBeNull();
        else expect(wait).toBeGreaterThanOrEqual(SKETCH_MIN_GAP_MS);
      }
    }
    expect(idleWaitMs({ idleMinMs: 2250, idleMaxMs: 6550 }, () => 0)).toBe(2250);
    expect(idleWaitMs({ idleMinMs: 2250, idleMaxMs: 6550 }, () => 1)).toBe(6550);
  });
});
