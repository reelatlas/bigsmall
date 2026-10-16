import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  SKETCH_BY_ID,
  SKETCH_EFFECTS,
  SKETCHBOOK_TUNING,
  type SketchbookTuning,
} from '../src/features/sketchbook/sketches';
import { SKETCHBOOK_TIMING } from '../src/lib/timing';
import { MARGIN_MS, recordAnimations, startedAnimations } from './support';

// The sketchbook (docs/UX-SPEC.md §14, the About page), played on /dev/sketchbook-lab until the
// About page ships.

const { firstMs, holdMs, swapMs } = SKETCHBOOK_TIMING;
const tiles = (page: Page) => page.locator('[data-sketch-tile]');
const sketchOf = (tile: Locator) => tile.getAttribute('data-sketch');
const shown = (page: Page) =>
  tiles(page).evaluateAll((all) => all.map((tile) => (tile as HTMLElement).dataset['sketch']));

/**
 * Opens the lab with these settings saved, and without the shuffle as it opens unless asked, then
 * waits for the play to start.
 */
async function openLab(page: Page, tuning: Partial<SketchbookTuning> = {}) {
  await page.addInitScript(
    (saved) => {
      localStorage.setItem('bigsmall:sketchbook-lab', JSON.stringify({ tuning: saved }));
    },
    { intro: false, ...tuning },
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

test('hovering a tile changes its sketch, and keeps changing it while the mouse stays', async ({
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
  await expect(tile).not.toHaveAttribute('data-sketch', second!);

  // Once the mouse leaves, the change under way lands and the tile rests.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(swapMs + MARGIN_MS);
  const rested = await sketchOf(tile);
  await page.waitForTimeout(holdMs + swapMs + MARGIN_MS);
  await expect(tile).toHaveAttribute('data-sketch', rested!);
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
  await page.waitForTimeout(swapMs + MARGIN_MS);
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

test('Shuffle changes every tile, and no two show the same sketch', async ({ page }) => {
  await openLab(page);
  const before = await shown(page);
  await page.getByRole('button', { name: 'Shuffle', exact: true }).first().click();
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
  await page.getByLabel('Squares in front: In the rotation').uncheck();
  await expect(count).toContainText('5 of');
});

test('under reduced motion nothing changes by itself, and a press cross-fades', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLab(page, { intro: true });
  const tile = tiles(page).first();
  const before = await sketchOf(tile);
  if (!isMobile) await tile.hover();
  await page.waitForTimeout(firstMs + swapMs + holdMs + MARGIN_MS);
  await expect(tile).toHaveAttribute('data-sketch', before!);

  await recordAnimations(page);
  if (isMobile) await tile.tap();
  else await tile.click();
  await expect(tile).not.toHaveAttribute('data-sketch', before!);
  expect(await startedAnimations(page, '[data-layer]', 'opacity')).not.toEqual([]);
  expect(await startedAnimations(page, '[data-layer]', 'transform')).toEqual([]);
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
  expect(copied).toContain("effect: 'glitch',");
  expect(copied).toContain('set: SKETCHES.map(({ id }) => id),');
});
