import { expect, test } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import { PEEK_CLOSE_MS } from '../src/lib/timing';
import { applyTheme, expectNoA11yViolations, pickTheme, ready, themeToggle } from './support';

// The header's menus (docs/UX-SPEC.md §10) and how the header wraps on narrow screens (§1).

test('theme choice applies immediately, closes the menu, and survives reload', async ({ page }) => {
  await page.goto('/');
  await pickTheme(page, 'Sakura');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(themeToggle(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Theme Sakura' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(page.getByRole('button', { name: 'Theme Sakura' })).toBeVisible();
});

test('the theme menu closes on Escape, a click outside, and focus leaving it', async ({ page }) => {
  await page.goto('/');
  const toggle = themeToggle(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // Tab out of the open menu: it must not stay drawn over the control that now has focus.
  await toggle.click();
  await page.keyboard.press('Tab');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('arrow keys preview themes in the open menu; Enter keeps the choice and closes it', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = themeToggle(page);
  await toggle.click();
  await expect(page.getByRole('radio', { name: 'Daylight' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('html')).toHaveAttribute('data-theme', THEMES[1]!.id);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('html')).toHaveAttribute('data-theme', THEMES[2]!.id);
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('the shortcuts map opens on hover, stays when clicked, and closes on Escape', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Keyboard shortcuts' });

  await toggle.hover();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Confirm input or selection')).toBeVisible();
  // The open edge goes with the panel: a fading edge would leave a green square behind.
  const shell = toggle.locator('xpath=ancestor::*[@data-shell]/*[1]');
  const edgeFades = await shell.evaluate((el) => {
    const style = getComputedStyle(el);
    const durations = style.transitionDuration.split(',').map((d) => parseFloat(d));
    return style.transitionProperty
      .split(',')
      .some(
        (property, i) =>
          ['border-color', 'all'].includes(property.trim()) &&
          (durations[i % durations.length] ?? 0) > 0,
      );
  });
  expect(edgeFades).toBe(false);
  await page.mouse.move(5, 5);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(PEEK_CLOSE_MS * 2);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expectNoA11yViolations(page);

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('the shortcuts map is hidden on touch-first devices', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop shows the shortcuts map');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).toBeHidden();
});

test('shortcuts name ⌘ on Apple devices and Ctrl elsewhere', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  const undo = page.getByRole('button', { name: 'Undo' });

  await page.goto('/');
  await ready(page);
  await expect(page.locator('[data-mod-key]').first()).toHaveText('Ctrl');
  await expect(undo).toHaveAttribute('title', 'Undo (Ctrl+Z)');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'macOS' }) });
  });
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-mod-key]').first()).toHaveText('⌘');
  await expect(undo).toHaveAttribute('title', 'Undo (⌘Z)');
});

// Under 416 px the header's menus take a line of their own, theme menu first and flush left;
// from 416 px every theme's name, art, and menus share one line, the menus on the right.
for (const width of [320, 375, 414, 430, 520]) {
  const ownLine = width < 416;
  test(`at ${width} px the name keeps its art, and the menus ${ownLine ? 'wrap under it, theme first' : 'share its line'}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await ready(page);
    for (const theme of THEMES) {
      await applyTheme(page, theme);
      await expect(page.locator(`header [data-art="${theme.id}"]`), theme.id).toBeVisible();
      const m = await page.evaluate(() => {
        const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const header = box('main > header');
        const name = box('main > header h1');
        const menus = box('[data-header-menus]');
        const copyUrl = box('[aria-label="Copy URL"]');
        const shown = document.querySelector('[data-theme-name]')!;
        const trigger = shown.closest('button')!.getBoundingClientRect();
        const content = shown.parentElement!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ownLine: menus.top >= name.bottom,
          left: Math.round(menus.left - header.left),
          right: Math.round(header.right - menus.right),
          themeFirst: trigger.right <= copyUrl.left,
          rowGap: Math.round(menus.top - name.bottom),
          padLeft: Math.round(content.left - trigger.left),
          padRight: Math.round(trigger.right - content.right),
        };
      });
      expect(m.overflow, theme.id).toBe(0);
      expect(m.ownLine, theme.id).toBe(ownLine);
      expect(m.themeFirst, theme.id).toBe(ownLine);
      expect(ownLine ? m.left : m.right, theme.id).toBe(0);
      // A wrapped row of menus keeps 20 px of air under the name.
      if (ownLine) expect(m.rowGap, theme.id).toBe(20);
      // The theme's name sits in the middle of its trigger, with no wide gap after it.
      if (width < 640) expect(Math.abs(m.padLeft - m.padRight), theme.id).toBeLessThanOrEqual(10);
    }
  });
}
