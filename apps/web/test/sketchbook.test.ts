import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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
