import { expect, test, type Locator, type Page } from '@playwright/test';
import { bandClip, cutClip, grainOf, halfClip, OVER } from '../src/features/sketchbook/frames';
import {
  REACHING_EFFECTS,
  SKETCH_BY_ID,
  SKETCH_EFFECTS,
  SKETCHBOOK_TUNING,
  SKETCHES,
  STEPPED_EFFECTS,
  type SketchbookTuning,
  type SketchEffect,
} from '../src/features/sketchbook/sketches';
import { SKETCHBOOK_TIMING } from '../src/lib/timing';
import { MARGIN_MS, recordAnimations, startedAnimations, themeTime } from './support';

// The sketchbook (docs/UX-SPEC.md §1, the About page), played on the About page as shipped and on
// /dev/sketchbook-lab, which tunes it.

const { firstMs, holdMs, swapMs } = SKETCHBOOK_TIMING;
const status = (page: Page) => page.locator('[data-playing]').locator('..').getByRole('status');
const tiles = (page: Page) => page.locator('[data-sketch-tile]');
const sketchOf = (tile: Locator) => tile.getAttribute('data-sketch');
const shown = (page: Page) =>
  tiles(page).evaluateAll((all) => all.map((tile) => (tile as HTMLElement).dataset['sketch']));

/**
 * Opens the lab with these settings saved as the lab saves them (its rotation as the sketches left
 * out), without the flip as it opens or the tiles changing by themselves unless asked, so only
 * what a test does changes a tile; then waits for the play.
 */
async function openLab(
  page: Page,
  { set, ...tuning }: Partial<SketchbookTuning> = {},
  timing: Partial<Record<keyof typeof SKETCHBOOK_TIMING, number>> = {},
) {
  await page.addInitScript(
    (saved) => {
      localStorage.setItem('bigsmall:sketchbook-lab', JSON.stringify(saved));
    },
    {
      version: 2,
      tuning: { intro: false, ...tuning },
      timing: { idleMinMs: 0, idleMaxMs: 0, ...timing },
      out: set ? SKETCHES.map(({ id }) => id).filter((id) => !set.includes(id)) : [],
    },
  );
  await page.goto('/dev/sketchbook-lab');
  await page.locator('[data-playing]').waitFor();
}

/** A tile's sketch and its name, read together so a change cannot land between them. */
const named = (tile: Locator) =>
  tile.evaluate((element) => ({
    id: (element as HTMLElement).dataset['sketch'],
    name: element.getAttribute('aria-label'),
  }));

/** A box in device pixels, as a screenshot taken at the device's scale has it. */
interface DeviceRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Pixel checks on screenshots, decoded in the page itself (an image on a canvas), so no pixel data
 * crosses to the test. A pixel "differs" by more than `tolerance` of 255 in a channel: an
 * antialiased seam shows a quarter of the canvas through, 50 or more on a dark tile.
 */
const PIXELS = {
  /** Pixels outside every rect that are not the canvas color, exactly. */
  async outside(
    page: Page,
    png: Buffer,
    rects: DeviceRect[],
    canvas: [number, number, number],
  ): Promise<number> {
    return page.evaluate(
      ([b64, rects, canvas]) =>
        new Promise<number>((resolve) => {
          const image = new Image();
          image.onload = () => {
            const sheet = document.createElement('canvas');
            sheet.width = image.naturalWidth;
            sheet.height = image.naturalHeight;
            const context = sheet.getContext('2d')!;
            context.drawImage(image, 0, 0);
            const { data } = context.getImageData(0, 0, sheet.width, sheet.height);
            let count = 0;
            for (let y = 0; y < sheet.height; y++) {
              for (let x = 0; x < sheet.width; x++) {
                if (rects.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1)) continue;
                const i = (y * sheet.width + x) * 4;
                if (data[i] !== canvas[0] || data[i + 1] !== canvas[1] || data[i + 2] !== canvas[2])
                  count++;
              }
            }
            resolve(count);
          };
          image.src = `data:image/png;base64,${b64}`;
        }),
      [png.toString('base64'), rects, canvas] as const,
    );
  },
  /** The color at a point, and the image's size. */
  async at(page: Page, png: Buffer, x: number, y: number): Promise<[number, number, number]> {
    return page.evaluate(
      ([b64, x, y]) =>
        new Promise<[number, number, number]>((resolve) => {
          const image = new Image();
          image.onload = () => {
            const sheet = document.createElement('canvas');
            sheet.width = image.naturalWidth;
            sheet.height = image.naturalHeight;
            const context = sheet.getContext('2d')!;
            context.drawImage(image, 0, 0);
            const { data } = context.getImageData(x, y, 1, 1);
            resolve([data[0]!, data[1]!, data[2]!]);
          };
          image.src = `data:image/png;base64,${b64}`;
        }),
      [png.toString('base64'), x, y] as const,
    );
  },
  /**
   * Pixels differing between two screenshots of the same size by more than `tolerance`; with
   * `rows`, the rows in which more than a quarter of the pixels differ instead: a seam runs the
   * width of a tile, while a clipped layer draws a shape's antialiased edge a hair differently,
   * single pixels along the edge.
   */
  async differing(page: Page, a: Buffer, b: Buffer, tolerance = 8, rows = false): Promise<number> {
    return page.evaluate(
      ([first, second, tolerance, rows]) =>
        new Promise<number>((resolve) => {
          const load = (b64: string) =>
            new Promise<HTMLImageElement>((done) => {
              const image = new Image();
              image.onload = () => done(image);
              image.src = `data:image/png;base64,${b64}`;
            });
          void Promise.all([load(first), load(second)]).then(([one, two]) => {
            const read = (image: HTMLImageElement) => {
              const sheet = document.createElement('canvas');
              sheet.width = image.naturalWidth;
              sheet.height = image.naturalHeight;
              const context = sheet.getContext('2d')!;
              context.drawImage(image, 0, 0);
              return context.getImageData(0, 0, sheet.width, sheet.height).data;
            };
            const [p, q] = [read(one), read(two)];
            if (p.length !== q.length) {
              resolve(Number.POSITIVE_INFINITY);
              return;
            }
            const width = one.naturalWidth;
            let count = 0;
            let seams = 0;
            let inRow = 0;
            for (let i = 0; i < p.length; i += 4) {
              if (
                Math.abs(p[i]! - q[i]!) > tolerance ||
                Math.abs(p[i + 1]! - q[i + 1]!) > tolerance ||
                Math.abs(p[i + 2]! - q[i + 2]!) > tolerance
              ) {
                count++;
                inRow++;
              }
              if ((i / 4 + 1) % width === 0) {
                if (inRow > width / 4) seams++;
                inRow = 0;
              }
            }
            resolve(rows ? seams : count);
          });
        }),
      [a.toString('base64'), b.toString('base64'), tolerance, rows] as const,
    );
  },
  /**
   * Pixels differing between two screenshots of the same size by more than `tolerance`, counted
   * only inside the rects, or only outside them all: what a change painted over a neighbor, or
   * past every tile.
   */
  async differingWhere(
    page: Page,
    a: Buffer,
    b: Buffer,
    rects: DeviceRect[],
    where: 'inside' | 'outside',
    tolerance = 8,
  ): Promise<number> {
    return page.evaluate(
      ([first, second, rects, where, tolerance]) =>
        new Promise<number>((resolve) => {
          const load = (b64: string) =>
            new Promise<HTMLImageElement>((done) => {
              const image = new Image();
              image.onload = () => done(image);
              image.src = `data:image/png;base64,${b64}`;
            });
          void Promise.all([load(first), load(second)]).then(([one, two]) => {
            const read = (image: HTMLImageElement) => {
              const sheet = document.createElement('canvas');
              sheet.width = image.naturalWidth;
              sheet.height = image.naturalHeight;
              const context = sheet.getContext('2d')!;
              context.drawImage(image, 0, 0);
              return context.getImageData(0, 0, sheet.width, sheet.height).data;
            };
            const [p, q] = [read(one), read(two)];
            if (p.length !== q.length) {
              resolve(Number.POSITIVE_INFINITY);
              return;
            }
            const width = one.naturalWidth;
            let count = 0;
            for (let i = 0; i < p.length; i += 4) {
              const x = (i / 4) % width;
              const y = Math.floor(i / 4 / width);
              const inside = rects.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
              if (inside !== (where === 'inside')) continue;
              if (
                Math.abs(p[i]! - q[i]!) > tolerance ||
                Math.abs(p[i + 1]! - q[i + 1]!) > tolerance ||
                Math.abs(p[i + 2]! - q[i + 2]!) > tolerance
              ) {
                count++;
              }
            }
            resolve(count);
          });
        }),
      [a.toString('base64'), b.toString('base64'), rects, where, tolerance] as const,
    );
  },
};

/**
 * Each tile's box in device pixels relative to the grid's screenshot, a device pixel wider on
 * every side: at a scale that is not whole (a Pixel's 2.625) a tile's edge falls between device
 * pixels, and the pixel it straddles is partly the tile's at rest.
 */
async function deviceBoxes(page: Page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-playing]')!.getBoundingClientRect();
    const scale = window.devicePixelRatio;
    const boxes = [...document.querySelectorAll('[data-sketch-tile]')].map((tile) => {
      const r = tile.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    });
    const tiles = boxes.map((r) => ({
      x0: Math.floor((r.left - grid.left) * scale) - 1,
      y0: Math.floor((r.top - grid.top) * scale) - 1,
      x1: Math.ceil((r.left + r.width - grid.left) * scale) + 1,
      y1: Math.ceil((r.top + r.height - grid.top) * scale) + 1,
    }));
    return { scale, tiles, boxes };
  });
}

/** The tile's layers styled as one frame of a change would style them, by layer index. */
const styleLayers = (tile: Locator, plan: Record<number, Record<string, string>>) =>
  tile.evaluate((element, plan) => {
    const id = (element as HTMLElement).dataset['sketch'];
    const layers = [...element.querySelectorAll('svg')];
    for (const layer of layers) layer.removeAttribute('style');
    for (const [index, style] of Object.entries(plan)) {
      const layer = layers[Number(index)]!;
      layer.querySelector('use')!.setAttribute('href', `#sketch-${id}`);
      for (const [property, value] of Object.entries(style)) {
        layer.style.setProperty(property, value);
      }
    }
  }, plan);

test('hovering a tile changes it once, as shipped, and again on the next hover', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'hover needs a mouse; a tap changes a tile instead');
  await openLab(page);
  const tile = tiles(page).first();
  const first = await sketchOf(tile);
  await tile.hover();
  await expect(tile).not.toHaveAttribute('data-sketch', first!);
  const second = await sketchOf(tile);
  await page.waitForTimeout(holdMs + swapMs + MARGIN_MS);
  await expect(tile).toHaveAttribute('data-sketch', second!);
  await page.mouse.move(0, 0);
  await tile.hover();
  await expect(tile).not.toHaveAttribute('data-sketch', second!);
});

test('with Keep changing on, a hovered tile keeps changing until the mouse leaves', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'hover needs a mouse');
  await openLab(page, { cycle: true });
  const tile = tiles(page).first();
  const first = await sketchOf(tile);
  await tile.hover();
  await expect(tile).not.toHaveAttribute('data-sketch', first!);
  const second = await sketchOf(tile);
  await expect(tile).not.toHaveAttribute('data-sketch', second!);

  // Once the mouse leaves, the change under way lands and the tile rests.
  await page.mouse.move(0, 0);
  await expect(tile).not.toHaveAttribute('data-next');
  const rested = await sketchOf(tile);
  await page.waitForTimeout(holdMs + swapMs + MARGIN_MS);
  await expect(tile).toHaveAttribute('data-sketch', rested!);
});

test('each tile changes by itself, on its own time', async ({ page }) => {
  await openLab(page, {}, { idleMinMs: 300, idleMaxMs: 700 });
  const before = await shown(page);
  await expect
    .poll(async () => (await shown(page)).every((id, index) => id !== before[index]))
    .toBe(true);
});

test('a click, a tap, Enter, and Space change a tile at once, its name following', async ({
  page,
  isMobile,
}) => {
  await openLab(page);
  const tile = tiles(page).nth(1);
  const before = await sketchOf(tile);
  if (isMobile) await tile.tap();
  else await tile.click();
  await expect(tile).not.toHaveAttribute('data-sketch', before!);
  const now = await named(tile);
  expect(now.name).toBe(SKETCH_BY_ID.get(now.id!)?.name);
  if (isMobile) return;

  // From the keys, with the mouse away so no hover changes it too.
  await page.mouse.move(0, 0);
  await expect(tile).not.toHaveAttribute('data-next');
  for (const key of ['Enter', 'Space']) {
    const was = await sketchOf(tile);
    await tile.focus();
    await page.keyboard.press(key);
    await expect(tile, key).not.toHaveAttribute('data-sketch', was!);
  }
});

test('every effect lands on the next sketch and leaves the tile at rest', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'one viewport is enough');
  await openLab(page);
  const tile = tiles(page).first();
  for (const effect of SKETCH_EFFECTS) {
    await page.getByLabel('Effect', { exact: true }).selectOption(effect);
    await tile.focus();
    const was = await sketchOf(tile);
    await page.keyboard.press('Enter');
    await expect(tile, effect).not.toHaveAttribute('data-sketch', was!);
    await expect(tile, effect).not.toHaveAttribute('data-next');
    // Every layer back at rest: no style of the change's, no animation left running.
    const layers = await tile.evaluate((element) =>
      [...element.querySelectorAll('svg')].map(
        (layer) =>
          `${layer.getAttribute('style') ?? ''}${layer.getAnimations().length ? ' animating' : ''}`,
      ),
    );
    expect(layers, effect).toEqual(layers.map(() => ''));
  }
});

test('Flip changes every tile, and no two show the same sketch', async ({ page }) => {
  await openLab(page);
  const before = await shown(page);
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect
    .poll(async () => (await shown(page)).every((id, index) => id !== before[index]))
    .toBe(true);
  const after = await shown(page);
  expect(new Set(after).size).toBe(after.length);
});

test('only sketches in the rotation are dealt, and the sheet chooses them', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'one viewport is enough');
  // Two tiles and six sketches: every press deals one of the six.
  await openLab(page, { set: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'], columns: 2, rows: 1 });
  const count = page.locator('[data-rotation-count]');
  await expect(count).toContainText('6 of');
  const tile = tiles(page).first();
  await tile.focus();
  for (let press = 0; press < 8; press++) {
    const was = await sketchOf(tile);
    await page.keyboard.press('Enter');
    await expect(tile).not.toHaveAttribute('data-sketch', was!);
    expect(await sketchOf(tile)).toMatch(/^k\d$/);
  }
  await page.getByLabel(`${SKETCH_BY_ID.get('k1')!.name}: In the rotation`).uncheck();
  await expect(count).toContainText('5 of');
});

test('under reduced motion nothing changes by itself, and a press cross-fades', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLab(page, { intro: true }, { idleMinMs: 300, idleMaxMs: 500 });
  const tile = tiles(page).first();
  const before = await sketchOf(tile);
  if (!isMobile) await tile.hover();
  await page.waitForTimeout(firstMs + swapMs + holdMs + MARGIN_MS);
  await expect(tile).toHaveAttribute('data-sketch', before!);

  await recordAnimations(page);
  if (isMobile) await tile.tap();
  else await tile.click();
  await expect(tile).not.toHaveAttribute('data-sketch', before!);
  // The sketch showing fades out as the next fades in, for a change's length.
  expect(await startedAnimations(page, '[data-layer]', 'opacity')).toEqual([swapMs, swapMs]);
  expect(await startedAnimations(page, '[data-layer]', 'transform')).toEqual([]);
});

test('under reduced motion Flip changes every tile at once, never in a wave', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // A wave this slow never has every tile changing at once: the first lands before the last starts.
  await openLab(page, {}, { waveMs: 600 });
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect
    .poll(() =>
      tiles(page).evaluateAll((all) => all.every((tile) => tile.hasAttribute('data-next'))),
    )
    .toBe(true);
});

test('a press and Flip say what they brought, for a screen reader', async ({ page, isMobile }) => {
  await openLab(page);
  const tile = tiles(page).first();
  const before = await sketchOf(tile);
  if (isMobile) await tile.tap();
  else await tile.click();
  await expect(tile).not.toHaveAttribute('data-sketch', before!);
  await expect(tile).not.toHaveAttribute('data-next');
  const now = await named(tile);
  await expect(status(page)).toHaveText(now.name!);

  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  // Flip has spoken once the press's sentence is gone: a sketch's own name can hold a comma
  // ("Big b, small s"), so a comma alone does not say so. Then the tiles name what it said.
  await expect(status(page)).not.toHaveText(now.name!);
  const said = await status(page).textContent();
  await expect
    .poll(() =>
      tiles(page).evaluateAll((all) =>
        all.map((each) => each.getAttribute('aria-label')).join(', '),
      ),
    )
    .toBe(said);
});

test('the lab loads an earlier version’s settings to compare or roll back', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'one viewport is enough');
  await openLab(page);
  const latest = page.getByLabel('Changes by itself, latest', { exact: true });
  // openLab saves the tiles still, so the lab starts at 0.
  await expect(latest).toHaveValue('0');
  await page.getByLabel('Earlier version').selectOption('v2');
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(latest).toHaveValue('5800');
  await page.getByRole('button', { name: /^Reset to shipped/ }).click();
  await expect(latest).toHaveValue(String(SKETCHBOOK_TIMING.idleMaxMs));
});

test('the lab copies its settings as code', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'one viewport is enough');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openLab(page);
  await page.getByLabel('Hold', { exact: true }).fill('1200');
  await page.getByRole('button', { name: 'Copy settings' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('holdMs: 1200,');
  for (const key of Object.keys(SKETCHBOOK_TIMING)) expect(copied, key).toContain(`  ${key}: `);
  expect(copied).toContain('export const SKETCHBOOK_TUNING');
  for (const key of Object.keys(SKETCHBOOK_TUNING)) expect(copied, key).toContain(`  ${key}: `);
  expect(copied).toContain("effect: 'mixed',");
  expect(copied).toContain('set: SKETCHES.map(({ id }) => id),');
});

test('the About page plays the sketchbook as shipped, from the footer, its name leading home', async ({
  page,
}) => {
  await page.goto('/');
  // On the converter's own page the name is a heading alone.
  await expect(page.getByRole('link', { name: 'bigsmall' })).toHaveCount(0);
  await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await page.locator('[data-playing]').waitFor();
  await expect(tiles(page)).toHaveCount(SKETCHBOOK_TUNING.columns * SKETCHBOOK_TUNING.rows);
  await expect(page.getByRole('button', { name: 'Flip', exact: true })).toBeVisible();
  // The footer here holds the privacy line and no link back: the name in the header leads home.
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText('Visits are counted anonymously without cookies by Umami.');
  await expect(footer.getByRole('link', { name: 'About' })).toHaveCount(0);
  await expect(footer.getByRole('link', { name: 'Umami' })).toHaveAttribute(
    'href',
    'https://umami.is',
  );
  await expect(footer.getByRole('link', { name: 'Formspark' })).toHaveAttribute(
    'href',
    /formspark\.io/,
  );
  await page.getByRole('link', { name: 'bigsmall' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('Flip answers a press with particles in the button, and with a flash under reduced motion', async ({
  page,
}) => {
  await openLab(page);
  const flip = page.getByRole('button', { name: 'Flip', exact: true });
  const particles = flip.locator('[data-burst] > *');
  await flip.click();
  await expect(particles.first()).toBeAttached();
  // A press while they play adds to them.
  const count = await particles.count();
  await flip.click();
  await expect.poll(() => particles.count()).toBeGreaterThan(count);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(particles).toHaveCount(0);
  await recordAnimations(page);
  await flip.click();
  // Read at once: particles made wrongly would be gone within seconds, and a wait would miss them.
  expect(await startedAnimations(page, '[data-burst] > *')).toEqual([]);
  expect(await startedAnimations(page, 'button:has([data-burst])', 'backgroundColor')).toEqual([
    await themeTime(page, '--highlight-fade'),
  ]);
});

test('Flip and Pause sit under the middle tile, together as wide as it', async ({ page }) => {
  await page.goto('/about/');
  await page.locator('[data-playing]').waitFor();
  const middle = await tiles(page)
    .nth(Math.floor(SKETCHBOOK_TUNING.columns / 2))
    .boundingBox();
  const flip = await page.getByRole('button', { name: 'Flip', exact: true }).boundingBox();
  const pause = await page.getByRole('button', { name: 'Pause', exact: true }).boundingBox();
  if (!middle || !flip || !pause) throw new Error('the tile or a button has no box');
  expect(Math.abs(flip.x - middle.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(pause.x + pause.width - (middle.x + middle.width))).toBeLessThanOrEqual(1);
  // Pause keeps its 44 px; the two sit 4 px apart, as a toolbar's buttons do.
  expect(pause.width).toBeCloseTo(44, 0);
  expect(pause.x - (flip.x + flip.width)).toBeCloseTo(4, 0);
});

test('Pause holds the tiles from changing by themselves until Play', async ({ page }) => {
  await openLab(page, {}, { idleMinMs: 300, idleMaxMs: 500 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toBeVisible();
  // A change already under way lands; then, for longer than the longest wait, nothing changes.
  await expect
    .poll(() =>
      tiles(page).evaluateAll((all) => all.some((tile) => tile.hasAttribute('data-next'))),
    )
    .toBe(false);
  const held = await shown(page);
  await page.waitForTimeout(2 * 500 + swapMs + MARGIN_MS);
  expect(await shown(page)).toEqual(held);
  await play.click();
  await expect
    .poll(async () => (await shown(page)).some((id, index) => id !== held[index]))
    .toBe(true);
});

test('under reduced motion there is nothing to pause', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about/');
  await page.locator('[data-playing]').waitFor();
  await expect(page.getByRole('button', { name: 'Flip', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeHidden();
});

test('a change stays inside its tile: Glitch paints nothing past the tiles, and its last frame is the settled one', async ({
  page,
}) => {
  // A phone's width, where the bands reached across the gap into the next tile and an iPhone kept
  // slivers of them whenever they were let out (Sean, 2026-10-17). The clock is the test's, so
  // every frame of the change is seen, in order.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.clock.install();
  await openLab(page, { effect: 'glitch' });
  await page.clock.pauseAt(Date.now() + 1000);
  const grid = page.locator('[data-playing]');
  const { tiles: boxes } = await deviceBoxes(page);
  const shot = () => grid.screenshot({ scale: 'device', animations: 'allow' });
  const rest = await shot();
  // The canvas, read from the gap between the first two tiles at rest.
  const canvas = await PIXELS.at(
    page,
    rest,
    Math.round((boxes[0]!.x1 + boxes[1]!.x0) / 2),
    Math.round((boxes[1]!.y0 + boxes[1]!.y1) / 2),
  );
  expect(await PIXELS.outside(page, rest, boxes, canvas)).toBe(0);

  const tile = tiles(page).nth(1);
  const signature = () =>
    tile.evaluate((element) => ({
      next: (element as HTMLElement).dataset['next'] ?? null,
      styles: [...element.querySelectorAll('svg')].map((l) => l.getAttribute('style')).join('|'),
    }));
  // A click with no pointer and no focus: no hover to queue a second change, no focus ring.
  await tile.dispatchEvent('click');
  let last = '';
  let lastFrame: Buffer | null = null;
  let frames = 0;
  for (let elapsed = 0; elapsed <= swapMs + 2 * 16; elapsed += 16) {
    const { next, styles } = await signature();
    if (!next) break;
    if (styles !== last) {
      last = styles;
      lastFrame = await shot();
      frames++;
      expect(await PIXELS.outside(page, lastFrame, boxes, canvas), `frame ${frames}`).toBe(0);
    }
    await page.clock.runFor(16);
  }
  expect(frames).toBeGreaterThan(4);
  await expect(tile).not.toHaveAttribute('data-next');
  const settled = await shot();
  expect(await PIXELS.outside(page, settled, boxes, canvas)).toBe(0);
  // The last frame drawn is the new picture at rest: the settle after it paints nothing new.
  expect(await PIXELS.differing(page, lastFrame!, settled)).toBe(0);
});

test('Blur, the turns, and Squash reach past the tile into the gap, over no neighbor, and leave nothing behind; the rest stay inside', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'one viewport is enough');
  // A phone's width, the gap at its narrowest. The screenshot takes in a quarter of a tile above
  // and below the row, where Squash's bounce and a turn's near edge reach; the rest of the page
  // there (the Flip row) holds still, so a pixel changed from the picture before the change is
  // the change's own.
  await page.setViewportSize({ width: 390, height: 800 });
  await openLab(page);
  const {
    scale,
    region,
    tiles: boxes,
  } = await page.evaluate(() => {
    const grid = document.querySelector('[data-playing]')!.getBoundingClientRect();
    const scale = window.devicePixelRatio;
    const margin = grid.height / 4;
    const region = {
      x: grid.left,
      y: grid.top - margin,
      width: grid.width,
      height: grid.height + 2 * margin,
    };
    const tiles = [...document.querySelectorAll('[data-sketch-tile]')].map((tile) => {
      const r = tile.getBoundingClientRect();
      return {
        x0: Math.floor((r.left - region.x) * scale) - 1,
        y0: Math.floor((r.top - region.y) * scale) - 1,
        x1: Math.ceil((r.right - region.x) * scale) + 1,
        y1: Math.ceil((r.bottom - region.y) * scale) + 1,
      };
    });
    return { scale, region, tiles };
  });
  expect(scale).toBeGreaterThan(0);
  const shot = () => page.screenshot({ clip: region, scale: 'device', animations: 'allow' });
  const tile = tiles(page).nth(1);
  const neighbors = [boxes[0]!, boxes[2]!];
  // The change's animations held still and stepped through, so every frame is seen, in order.
  const hold = () =>
    tile.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) animation.pause();
    });
  const seek = (at: number) =>
    tile.evaluate((element, at) => {
      for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = at;
    }, at);
  const release = () =>
    tile.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) animation.finish();
    });
  const STEPS = 12;
  // The reaching changes on the Web Animations API (the stepped ones stay clipped; Glitch has its
  // test above), then three clipped ones.
  const effects: SketchEffect[] = [
    ...[...REACHING_EFFECTS].filter((effect) => !STEPPED_EFFECTS.has(effect)),
    'doors',
    'slide',
    'pop',
  ];
  for (const effect of effects) {
    await page.getByLabel('Effect', { exact: true }).selectOption(effect);
    const before = await shot();
    // A click with no pointer and no focus: no hover to queue a second change, no focus ring.
    await tile.dispatchEvent('click');
    await expect(tile).toHaveAttribute('data-next', /./);
    await hold();
    let reach = 0;
    for (let step = 0; step <= STEPS; step++) {
      await seek((swapMs * step) / STEPS);
      const frame = await shot();
      // A reaching tile, lifted over its neighbors, must leave them as they were: no pixel of
      // theirs moved by more than 96 levels, since Chromium re-rasterizes a resting neighbor's
      // art edges by up to about 70 levels while a sibling composites (the engine's own, measured
      // 2026-10-17) and a change painted over a neighbor moves pixels by far more. A clipped one
      // cannot cross the gap to a neighbor (nothing outside the tile, below).
      if (REACHING_EFFECTS.has(effect)) {
        expect(
          await PIXELS.differingWhere(page, frame, before, neighbors, 'inside', 96),
          `${effect}, step ${step}: painted over a neighbor`,
        ).toBe(0);
      }
      reach = Math.max(reach, await PIXELS.differingWhere(page, frame, before, boxes, 'outside'));
    }
    await release();
    await expect(tile).not.toHaveAttribute('data-next');
    expect(
      await PIXELS.differingWhere(page, await shot(), before, boxes, 'outside'),
      `${effect}: something left past the tiles once settled`,
    ).toBe(0);
    if (REACHING_EFFECTS.has(effect)) {
      expect(reach, `${effect} reaches past its tile`).toBeGreaterThan(0);
    } else {
      expect(reach, `${effect} stays inside its tile`).toBe(0);
    }
  }
});

test('a piece meets the edge it shares without a seam: a band over its hole, Flap’s halves', async ({
  page,
}) => {
  await openLab(page);
  const tile = tiles(page).nth(1);
  const { scale, boxes } = await deviceBoxes(page);
  const grain = grainOf(boxes[1]!, scale);
  const shot = () => tile.screenshot({ scale: 'device', animations: 'allow' });
  const rest = await shot();
  // A frame built by hand as motion.ts builds one, every piece showing the tile's own sketch,
  // unshifted: the picture should be the tile at rest, with no row of it changed. The band's top
  // falls between device pixels at any size before the grain snaps it.
  const band = { top: 0.303, height: 0.08 };
  await styleLayers(tile, {
    0: { 'clip-path': cutClip([band], grain) },
    2: { opacity: '1', 'clip-path': bandClip(band, grain, OVER), transform: 'translateX(0px)' },
  });
  expect(await PIXELS.differing(page, await shot(), rest, 8, true), 'a band over its hole').toBe(0);
  await styleLayers(tile, {
    0: { 'clip-path': halfClip('bottom', grain, OVER) },
    1: { opacity: '1', 'clip-path': halfClip('top', grain) },
  });
  expect(await PIXELS.differing(page, await shot(), rest, 8, true), 'Flap’s halves').toBe(0);
  await styleLayers(tile, {});
});

test('the tiles sit on whole pixels at any width, their edges on device pixels', async ({
  page,
}) => {
  // A third of a width lands on a fraction; the grid rounds its tracks and its inset (global.css,
  // "The sketchbook's grid"), so a settling layer never lands a hair off its rest.
  // Real windows, the scrollbar's room and all: on a classic-scrollbar system a centered column
  // would land on a half pixel where the remainder is odd, which the page column rounds away
  // (global.css, `mx-page`).
  for (const width of [320, 360, 375, 390, 393, 412, 768, 1280, 1281]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/about/');
    await page.locator('[data-playing]').waitFor();
    const edges = await tiles(page).evaluateAll((all) =>
      all.map((tile) => {
        const rect = tile.getBoundingClientRect();
        return [rect.left, rect.width];
      }),
    );
    expect(edges).toHaveLength(3);
    for (const [left, tileWidth] of edges) {
      expect(left! - Math.round(left!), `${width}px: left ${left}`).toBeCloseTo(0, 6);
      expect(tileWidth! - Math.round(tileWidth!), `${width}px: width ${tileWidth}`).toBeCloseTo(
        0,
        6,
      );
    }
  }
});
