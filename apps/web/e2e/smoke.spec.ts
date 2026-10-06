import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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

test('theme choice applies immediately and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Theme').selectOption('sakura');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
});

test('every theme passes axe when applied to the page', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['midnight', 'sakura', 'neon-noir', 'hardhat', 'theorem']) {
    await page.getByLabel('Theme').selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, theme).toEqual([]);
  }
});
