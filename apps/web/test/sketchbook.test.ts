import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MOODS, nextMood, particles } from '../src/features/sketchbook/burst';
import { BURST_TIMING } from '../src/lib/timing';
import {
  bandClip,
  blockClip,
  blocksClip,
  cutClip,
  drawnClip,
  envelope,
  FLICKER_SHARE,
  glitchFrame,
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

// The sketchbook's catalog, its art, and how it deals sketches out (docs/UX-SPEC.md §14).

const ART = new URL('../src/assets/sketchbook/', import.meta.url);
const ids = SKETCHES.map(({ id }) => id);

/** A random source that counts up, so a shuffle is the same every run. */
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
    expect(START[5]).toBe('r6');
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
    expect(envelope(0, 16)).toBeLessThan(0.1);
    expect(envelope(15, 16)).toBeLessThan(0.1);
    expect(envelope(8, 16)).toBeGreaterThan(0.99);
    const { bands, fringe } = glitchFrame(8, 16, 0, seeded());
    expect(fringe).toBe(0);
    for (const band of bands) {
      expect(Math.abs(band.shift)).toBe(0);
      expect(band.other).toBe(false);
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

describe('the Flip button’s particles', () => {
  it('drift in each of the nine moods within their sizes and lengths, starting within the spread', () => {
    expect(MOODS).toHaveLength(9);
    const random = seeded();
    for (const mood of MOODS) {
      const made = particles(mood, random);
      expect(made.length).toBeGreaterThan(0);
      for (const particle of made) {
        expect(particle.x).toBeGreaterThanOrEqual(0);
        expect(particle.x).toBeLessThanOrEqual(1);
        expect(particle.delay).toBeLessThanOrEqual(BURST_TIMING.spreadMs);
        expect(particle.duration).toBeGreaterThanOrEqual(BURST_TIMING[mood].leastMs);
        expect(particle.duration).toBeLessThanOrEqual(BURST_TIMING[mood].mostMs);
        expect(particle.size).toBeGreaterThanOrEqual(0);
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
