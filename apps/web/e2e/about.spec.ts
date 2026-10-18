import { expect, test } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import {
  aboutPanel,
  aboutTab,
  aboutTabs,
  applyTheme,
  expectNoA11yViolations,
  islandReady,
  pageHeader,
} from './support';

// The About page's tabs (docs/UX-SPEC.md §1, "About"; Sean, 2026-10-18): under the sketchbook,
// Feedback and Every formula as tabs in the page's column, the tab the title.

test('Feedback opens first; a click, the arrows, Home, and End open a tab, and the address follows', async ({
  page,
}) => {
  await page.goto('/about/');
  await expect(aboutTab(page, 'Feedback')).toHaveAttribute('aria-selected', 'true');
  await expect(aboutPanel(page, 'Feedback')).toBeVisible();
  await expect(aboutPanel(page, 'Every formula')).toBeHidden();
  // The tab is the title: no heading doubles it; the sketchbook keeps its own.
  await expect(page.getByRole('heading', { name: 'The sketchbook', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Feedback|Every formula/ })).toHaveCount(0);
  await expectNoA11yViolations(page);

  // The tabs' island, hydrated (docs/LEARNINGS.md, 2026-10-17).
  await islandReady(page.locator('astro-island', { has: aboutTabs(page) }));
  // A switch keeps the row where it sat on the screen, scrolled to the page's foot too: WebKit
  // clamps the scroll as the old panel hides before the new one shows (docs/LEARNINGS.md).
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const rowTop = async () => (await aboutTabs(page).boundingBox())!.y;
  const rowWas = await rowTop();
  await aboutTab(page, 'Every formula').click();
  await expect(aboutTab(page, 'Every formula')).toHaveAttribute('aria-selected', 'true');
  await expect(aboutPanel(page, 'Every formula')).toBeVisible();
  await expect(aboutPanel(page, 'Feedback')).toBeHidden();
  await expect(page).toHaveURL(/#formulas$/);
  expect(Math.abs((await rowTop()) - rowWas)).toBeLessThanOrEqual(1);
  await expect(
    aboutPanel(page, 'Every formula').getByRole('button', { name: 'Show all' }),
  ).toBeVisible();
  await expectNoA11yViolations(page);

  // One Tab stop: ← and → go round the tabs, Home and End to the ends, each opening its panel.
  await aboutTab(page, 'Every formula').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(aboutTab(page, 'Feedback')).toBeFocused();
  await expect(aboutPanel(page, 'Feedback')).toBeVisible();
  await expect(page).toHaveURL(/#feedback$/);
  await page.keyboard.press('ArrowLeft');
  await expect(aboutTab(page, 'Every formula')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(aboutTab(page, 'Feedback')).toBeFocused();
  await page.keyboard.press('End');
  await expect(aboutTab(page, 'Every formula')).toBeFocused();
  await expect(aboutTab(page, 'Feedback')).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('Shift+Tab');
  await expect(aboutTab(page, 'Every formula')).not.toBeFocused();
});

test('a link to #formulas opens that tab with the row in view; the tabs sit on the column’s left edge with the header', async ({
  page,
}) => {
  await page.goto('/about/#formulas');
  await expect(aboutTab(page, 'Every formula')).toHaveAttribute('aria-selected', 'true');
  await expect(aboutPanel(page, 'Every formula')).toBeVisible();
  const list = (await aboutTabs(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(list.y).toBeGreaterThanOrEqual(0);
  expect(list.y + list.height).toBeLessThanOrEqual(viewport.height);
  // The page's column holds the header, the tabs, the formulas' bar, and the footer's privacy
  // line, left-aligned within it, in every theme, whose fonts differ.
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    const tabs = (await aboutTabs(page).boundingBox())!;
    const header = (await pageHeader(page).boundingBox())!;
    expect(Math.round(tabs.x), theme.id).toBe(Math.round(header.x));
    const bar = (await aboutPanel(page, 'Every formula')
      .getByRole('button', { name: 'Show all' })
      .boundingBox())!;
    expect(bar.x, theme.id).toBeGreaterThanOrEqual(tabs.x);
    expect(bar.x - tabs.x, theme.id).toBeLessThan(8);
    const privacy = (await page.getByText(/^Visits are counted/).boundingBox())!;
    expect(Math.round(privacy.x), theme.id).toBe(Math.round(tabs.x));
  }
});

// One layout on every page (docs/UX-SPEC.md §1, "Header"; Sean, 2026-10-18): the header sits where
// it sits on the converter page, the content column centered on both.
test('the header sits where the converter page has it', async ({ page }) => {
  await page.goto('/');
  const home = (await pageHeader(page).boundingBox())!;
  await page.goto('/about/');
  const about = (await pageHeader(page).boundingBox())!;
  expect(Math.abs(about.x - home.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(about.y - home.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(about.width - home.width)).toBeLessThanOrEqual(1);
});
