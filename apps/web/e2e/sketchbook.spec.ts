import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  SKETCH_BY_ID,
  SKETCH_EFFECTS,
  SKETCHBOOK_TUNING,
  SKETCHES,
  type SketchbookTuning,
} from '../src/features/sketchbook/sketches';
import { SKETCHBOOK_TIMING } from '../src/lib/timing';
import { MARGIN_MS, recordAnimations, startedAnimations } from './support';

// The sketchbook (docs/UX-SPEC.md §1, the About page), played on the About page as shipped and on
// /dev/sketchbook-lab, which tunes it.

const { firstMs, holdMs, swapMs } = SKETCHBOOK_TIMING;
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
  await page.waitForTimeout(swapMs + MARGIN_MS);
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

test('Flip changes every tile, and no two show the same sketch', async ({ page }) => {
  await openLab(page);
  const before = await shown(page);
  await page.getByRole('button', { name: 'Flip', exact: true }).first().click();
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
  // No footer here: the name in the header leads home.
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
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
  await expect(particles).toHaveCount(0);
  expect(await startedAnimations(page, 'button:has([data-burst])', 'backgroundColor')).not.toEqual(
    [],
  );
});
