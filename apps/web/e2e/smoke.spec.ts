import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const THEMES: Array<[id: string, name: string]> = [
  ['midnight', 'Midnight'],
  ['sakura', 'Sakura'],
  ['neon-noir', 'Neon noir'],
  ['hardhat', 'Hardhat'],
  ['theorem', 'Theorem'],
];

/** The theme menu is a native radio group inside a fluid shell driven by the inline script. */
async function pickTheme(page: Page, name: string) {
  await page.getByRole('button', { name: /^Theme/ }).click();
  await page.getByRole('radio', { name }).check({ force: true });
}

/** Theme tokens transition; axe must see the settled colors, not a frame in between. */
async function settled(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
}

for (const path of ['/', '/dev/gallery']) {
  test(`${path} renders with no WCAG violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('a conversion loads from the URL', async ({ page }) => {
  await page.goto('/?a=mile&b=kilometer&v=1&s=a');
  await expect(page.getByRole('combobox', { name: 'Second value' })).toHaveValue('1.609344');
});

test('theme choice applies immediately, closes the menu, and survives reload', async ({ page }) => {
  await page.goto('/');
  await pickTheme(page, 'Sakura');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(page.getByRole('button', { name: /^Theme/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(page.getByRole('button', { name: 'Theme Sakura' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(page.getByRole('button', { name: 'Theme Sakura' })).toBeVisible();
});

test('the theme menu closes on Escape and on a click outside', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /^Theme/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('every theme passes axe when applied to the page', async ({ page }) => {
  await page.goto('/');
  for (const [id, name] of THEMES) {
    await pickTheme(page, name);
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
    await settled(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, id).toEqual([]);
  }
});
