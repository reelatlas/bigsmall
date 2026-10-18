import { expect, test, type Locator, type Page } from '@playwright/test';
import { islandReady } from './support';

// The tidy lab (/dev/tidy-lab; docs/DESIGN-SYSTEM.md, "Tuning labs"): the three ways a side panel
// can open, each moving the column by its own rule, measured; and About's rhythm drawn at the
// About page's own gaps.

const rect = async (locator: Locator) => (await locator.boundingBox())!;

/** The window's content edge (the body's, inside the scrollbar's gutter) and the page's frame. */
async function windowFrame(page: Page) {
  return page.evaluate(() => ({
    edge: document.body.getBoundingClientRect().right,
    frame: parseFloat(getComputedStyle(document.querySelector('main')!).paddingRight),
  }));
}

test('each way of opening a panel moves the column by its rule', async ({ page, isMobile }) => {
  test.skip(isMobile, 'from md the panel opens beside the box; below, every way stacks it');
  await page.goto('/dev/tidy-lab');
  await islandReady(page.locator('astro-island', { has: page.locator('[data-stage]') }).first());
  const { edge, frame } = await windowFrame(page);
  const limit = edge - frame;
  for (const way of ['pair', 'margin', 'drawer']) {
    const stage = page.locator(`[data-stage="${way}"]`);
    const column = stage.locator('[data-column]');
    const frameBox = await rect(stage.locator('[data-stage-frame]'));
    const before = await rect(column);
    // With no panel the column is centered in the page column, on every way.
    const centered = frameBox.x + (frameBox.width - before.width) / 2;
    expect(Math.abs(before.x - centered), way).toBeLessThanOrEqual(1);
    await stage.getByRole('button', { name: 'Units' }).click();
    const panel = way === 'drawer' ? page.locator('[data-drawer]') : stage.locator('[data-panel]');
    await expect(panel).toBeVisible();
    const after = await rect(column);
    const panelBox = await rect(panel);
    const panelRight = panelBox.x + panelBox.width;
    if (way === 'pair') {
      // The pair centered: the column slid by half the panel and its 16 px step.
      const pairCenter = (after.x + panelRight) / 2;
      expect(Math.abs(pairCenter - (frameBox.x + frameBox.width / 2))).toBeLessThanOrEqual(1);
      expect(Math.abs(before.x - after.x - (panelBox.width + 16) / 2)).toBeLessThanOrEqual(1);
    } else if (way === 'margin') {
      // Centered still, or slid only as far as the panel lacked to the window's frame.
      expect(panelRight).toBeLessThanOrEqual(limit + 1);
      expect(after.x).toBeLessThanOrEqual(before.x + 1);
      const stayed = Math.abs(after.x - before.x) <= 1;
      const flush = Math.abs(panelRight - limit) <= 1;
      expect(stayed || flush).toBe(true);
    } else {
      // Nothing in the page moved; the drawer sits at the window's frame.
      expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(panelRight - limit)).toBeLessThanOrEqual(1);
    }
    await panel.getByRole('button', { name: 'Close units' }).click();
    await expect(panel).toHaveCount(0);
    const closed = await rect(column);
    expect(Math.abs(closed.x - before.x), way).toBeLessThanOrEqual(1);
  }
});

test('the rhythm’s bands are the About page’s own gaps', async ({ page }) => {
  await page.goto('/about/');
  const about = await page.evaluate(() => {
    const sketchbook = document.querySelector('section[aria-labelledby="sketchbook"]')!;
    const tabs = sketchbook.nextElementSibling!;
    return {
      toSketchbook: parseFloat(getComputedStyle(sketchbook).marginTop),
      toTabs: parseFloat(getComputedStyle(tabs).marginTop),
    };
  });
  await page.goto('/dev/tidy-lab');
  await islandReady(page.locator('astro-island', { has: page.locator('[data-stack]') }).first());
  const band = (id: string) => page.locator(`[data-gap="about:${id}"]`);
  const label = (id: string) => page.locator(`[data-px="about:${id}"]`);
  expect(
    Math.abs((await rect(band('to-sketchbook'))).height - about.toSketchbook),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs((await rect(band('to-tabs'))).height - about.toTabs)).toBeLessThanOrEqual(1);
  await expect(label('to-sketchbook')).toHaveText(`${Math.round(about.toSketchbook)} px`);
  await expect(label('to-tabs')).toHaveText(`${Math.round(about.toTabs)} px`);
});
