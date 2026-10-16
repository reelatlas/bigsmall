import { categories, units } from '@bigsmall/core';
import { expect, test } from '@playwright/test';

// Every formula on the About page (docs/UX-SPEC.md §1, "About"): folded by category, Show all and
// Hide all, and Copy all as plain text.

test('the About page lists every formula, folded; Show all opens them, Hide all closes them', async ({
  page,
}) => {
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
  const groups = section.locator('details');
  await expect(groups).toHaveCount(categories.length);
  await expect(section.locator('li[data-plain]')).toHaveCount(units.length);
  await expect(section.locator('details[open]')).toHaveCount(0);
  const toggle = section.getByRole('button', { name: 'Show all' });
  await toggle.click();
  await expect(section.locator('details[open]')).toHaveCount(categories.length);
  await expect(section.getByRole('button', { name: 'Hide all' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(section.getByText('1 mi = 1609.344 m')).toBeVisible();
  // One category closed on its own: the button offers Show all again.
  await section.locator('summary').first().click();
  await expect(section.getByRole('button', { name: 'Show all' })).toBeVisible();
  await section.getByRole('button', { name: 'Show all' }).click();
  await section.getByRole('button', { name: 'Hide all' }).click();
  await expect(section.locator('details[open]')).toHaveCount(0);
});

test('Copy all puts every formula on the clipboard as plain text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/about/');
  const section = page.getByRole('region', { name: 'Every formula' });
  await section.getByRole('button', { name: 'Copy all as text' }).click();
  await expect(section.getByRole('button', { name: 'Copied' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('bigsmall: every conversion factor and formula');
  expect(copied).toContain('## Length (base unit: meter, m)');
  expect(copied).toContain('- mile (mi): 1 mi = 1609.344 m, exact. Source:');
  expect(copied.split('\n').filter((line) => line.startsWith('- '))).toHaveLength(units.length);
});
