import { expect, test } from '@playwright/test';
import { islandReady } from './support';

// The owner's page (/dev/owner; docs/DEPLOYMENT.md, "Our own visits"): one press leaves this
// browser's visits out of Umami's counts by the key its tracker reads, the setting holds across
// a reload, and a second press counts them again.

test('the switch sets and clears the key Umami reads, and the setting holds', async ({ page }) => {
  await page.goto('/dev/owner');
  await islandReady(page.locator('astro-island').first());
  const status = page.getByRole('status');
  const button = page.getByRole('button', { name: /my visits in this browser/ });
  await expect(status).toHaveText('This browser’s visits are counted.');
  await expect(button).toHaveText('Stop counting my visits in this browser');

  await button.click();
  await expect(status).toHaveText('This browser’s visits are not counted.');
  expect(await page.evaluate(() => localStorage.getItem('umami.disabled'))).toBe('1');
  await expect(button).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await islandReady(page.locator('astro-island').first());
  await expect(status).toHaveText('This browser’s visits are not counted.');

  await button.click();
  await expect(status).toHaveText('This browser’s visits are counted.');
  expect(await page.evaluate(() => localStorage.getItem('umami.disabled'))).toBeNull();
});
