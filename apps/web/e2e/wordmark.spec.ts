import { expect, test, type Page } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import { WORDMARK_TIMING } from '../src/lib/timing';
import { WORDMARK_TUNING } from '../src/lib/wordmark';
import { applyTheme, ready, themeToggle } from './support';

// The header wordmark and its art (docs/UX-SPEC.md §1), and /dev/wordmark-lab, which tunes them.

test('hovering the name and its art plays the wordmark, leaving settles it, and its name stays', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'hover needs a mouse; a tap plays it instead');
  await page.goto('/');
  await ready(page);
  const heading = page.getByRole('heading', { level: 1 });
  const line = page.locator('[data-wordmark]');

  await heading.hover();
  await expect(line).not.toHaveText('bigsmall');
  await expect(heading).toHaveAccessibleName('bigsmall');
  // Nothing clips while it plays, so descenders and tall symbols show whole.
  await expect(page.locator('[data-wordmark-box]')).toHaveCSS('overflow', 'visible');
  await page.mouse.move(5, 600);
  await expect(line).toHaveText('bigsmall');
  await expect(heading).toHaveAccessibleName('bigsmall');
});

test('hovering the header menus leaves the wordmark still', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover needs a mouse');
  await page.goto('/');
  await ready(page);
  await themeToggle(page).hover();
  await page.waitForTimeout(WORDMARK_TIMING.firstMs + WORDMARK_TIMING.restMs);
  await expect(page.locator('[data-wordmark]')).toHaveText('bigsmall');
});

test('the wordmark stays still under reduced motion', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover needs a mouse');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await ready(page);
  await page.getByRole('heading', { level: 1 }).hover();
  await page.waitForTimeout(WORDMARK_TIMING.firstMs + WORDMARK_TIMING.restMs);
  await expect(page.locator('[data-wordmark]')).toHaveText('bigsmall');
});

test('the art beside the wordmark follows the theme', async ({ page }) => {
  await page.goto('/');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    await expect(page.locator(`header [data-art="${theme.id}"]`), theme.id).toBeVisible();
    await expect(page.locator('header [data-art]:visible')).toHaveCount(1);
  }
});

/** The lab's sheet of phrases appears once its island runs. */
async function openLab(page: Page) {
  await page.goto('/dev/wordmark-lab');
  await page.locator('[data-sheet-report]').waitFor();
}

test('every phrase fits the name’s width in every theme, on one line or two', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the name is the same width at every viewport');
  await openLab(page);
  await page.getByLabel(/^Include all/).check();
  const report = page.locator('[data-sheet-report]');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    await expect(report).toHaveAttribute('data-theme-fitted', theme.id);
    await expect(report, theme.id).not.toContainText('Too long');
  }
});

test('the art flips to a symbol, and its drawing comes home when play stops', async ({ page }) => {
  await openLab(page);
  await page.getByLabel('Art flips to a symbol').fill('1');
  const pinned = page.getByLabel('Play without hovering');
  await pinned.check();
  const symbol = page.locator('header [data-art-line]');
  await expect(symbol).toBeVisible();
  await expect(page.locator('header [data-theme-art]')).toHaveClass(/invisible/);
  await pinned.uncheck();
  await expect(symbol).toBeHidden();
  await expect(page.locator('[data-wordmark]')).toHaveText('bigsmall');
  await expect(page.locator('header [data-theme-art]')).not.toHaveClass(/invisible/);
});

test('the lab copies its settings as code', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'one viewport is enough');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openLab(page);
  await page.getByLabel('Rest', { exact: true }).fill('2400');
  await page.getByRole('button', { name: 'Copy settings' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('restMs: 2400,');
  expect(copied).toContain('export const WORDMARK_TUNING');
  for (const key of Object.keys(WORDMARK_TUNING)) expect(copied, key).toContain(`  ${key}: `);
  expect(copied).toContain("twoLinesFrom: 'text-base',");
});

test('the lab loads an earlier version’s settings to compare or roll back', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'one viewport is enough');
  await openLab(page);
  const rest = page.getByLabel('Rest', { exact: true });
  await expect(rest).toHaveValue(String(WORDMARK_TIMING.restMs));
  await page.getByLabel('Earlier version').selectOption('v0');
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(rest).toHaveValue('1800');
  await page.getByRole('button', { name: /^Reset to shipped/ }).click();
  await expect(rest).toHaveValue(String(WORDMARK_TIMING.restMs));
});
