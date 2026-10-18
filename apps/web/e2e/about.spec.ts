import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './support';

// The About page's tabs (docs/UX-SPEC.md §1, "About"; Sean, 2026-10-18): under the sketchbook,
// Feedback and Every formula as tabs in the page's column, the tab the title.

const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true });
const panel = (page: Page, name: string) => page.getByRole('tabpanel', { name, exact: true });

/** The tabs' island, hydrated: Astro drops its `ssr` mark (docs/LEARNINGS.md, 2026-10-17). */
async function hydrated(page: Page) {
  await expect(
    page.locator('astro-island', { has: page.getByRole('tablist', { name: 'About' }) }),
  ).not.toHaveAttribute('ssr');
}

test('Feedback opens first; a click, the arrows, Home, and End open a tab, and the address follows', async ({
  page,
}) => {
  await page.goto('/about/');
  await expect(tab(page, 'Feedback')).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page, 'Feedback')).toBeVisible();
  await expect(panel(page, 'Every formula')).toBeHidden();
  // The tab is the title: no heading doubles it; the sketchbook keeps its own.
  await expect(page.getByRole('heading', { name: 'The sketchbook', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Feedback|Every formula/ })).toHaveCount(0);
  await expectNoA11yViolations(page);

  await hydrated(page);
  // A switch keeps the row where it sat on the screen, scrolled to the page's foot too: WebKit
  // clamps the scroll as the old panel hides before the new one shows (docs/LEARNINGS.md).
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const rowTop = async () => (await page.getByRole('tablist', { name: 'About' }).boundingBox())!.y;
  const rowWas = await rowTop();
  await tab(page, 'Every formula').click();
  await expect(tab(page, 'Every formula')).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page, 'Every formula')).toBeVisible();
  await expect(panel(page, 'Feedback')).toBeHidden();
  await expect(page).toHaveURL(/#formulas$/);
  expect(Math.abs((await rowTop()) - rowWas)).toBeLessThanOrEqual(1);
  await expect(
    panel(page, 'Every formula').getByRole('button', { name: 'Show all' }),
  ).toBeVisible();
  await expectNoA11yViolations(page);

  // One Tab stop: ← and → go round the tabs, Home and End to the ends, each opening its panel.
  await tab(page, 'Every formula').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tab(page, 'Feedback')).toBeFocused();
  await expect(panel(page, 'Feedback')).toBeVisible();
  await expect(page).toHaveURL(/#feedback$/);
  await page.keyboard.press('ArrowLeft');
  await expect(tab(page, 'Every formula')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tab(page, 'Feedback')).toBeFocused();
  await page.keyboard.press('End');
  await expect(tab(page, 'Every formula')).toBeFocused();
  await expect(tab(page, 'Feedback')).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('Shift+Tab');
  await expect(tab(page, 'Every formula')).not.toBeFocused();
});

test('a link to #formulas opens that tab with the row in view; the tabs sit on the column’s left edge with the header', async ({
  page,
}) => {
  await page.goto('/about/#formulas');
  await expect(tab(page, 'Every formula')).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page, 'Every formula')).toBeVisible();
  const list = (await page.getByRole('tablist', { name: 'About' }).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(list.y).toBeGreaterThanOrEqual(0);
  expect(list.y + list.height).toBeLessThanOrEqual(viewport.height);
  // The page's column holds the header and the tabs, left-aligned within it, the panel too.
  const header = (await page.locator('main > header').boundingBox())!;
  expect(Math.round(list.x)).toBe(Math.round(header.x));
  const bar = (await panel(page, 'Every formula')
    .getByRole('button', { name: 'Show all' })
    .boundingBox())!;
  expect(bar.x).toBeGreaterThanOrEqual(list.x);
  expect(bar.x - list.x).toBeLessThan(8);
  // The privacy line in the footer sits on the same column.
  const privacy = (await page.getByRole('contentinfo').locator('p').boundingBox())!;
  expect(Math.round(privacy.x)).toBe(Math.round(list.x));
});
