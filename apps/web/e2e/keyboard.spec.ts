import { expect, test, type Page } from '@playwright/test';
import { box, menu, ready, themeToggle } from './support';

// The page's toolbars and planes (docs/UX-SPEC.md §8, §10, ADR 0014): each toolbar is one Tab
// stop whose arrows move along it, and which keeps the control last used; ↑ and ↓ move between
// the header's toolbar, the converter's, and the box, round from end to end; Escape on a
// toolbar's control goes back to the box. The box's own arrows through its rows are in
// table.spec.ts, the calculator's in calculator.spec.ts.

test.skip(({ isMobile }) => isMobile, 'the arrows and Tab need a keyboard');

const shortcuts = (page: Page) => page.getByRole('button', { name: 'Keyboard shortcuts' });
const tool = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('each toolbar is one Tab stop, which keeps the control last used', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(shortcuts(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(box(page)).toBeFocused();

  // Along the converter's toolbar, round from end to end; Home and End go to its ends.
  await page.keyboard.press('Shift+Tab');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tool(page, 'Calculator')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tool(page, 'Clear all')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tool(page, 'Calculator')).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await expect(tool(page, 'Undo')).toBeFocused();

  // Leaving and coming back by Tab lands on the control last used.
  await page.keyboard.press('Tab');
  await expect(box(page)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(tool(page, 'Undo')).toBeFocused();
});

test('tools that can do nothing yet stay in the order, dimmed, and do nothing', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await expect(tool(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
  await expect(tool(page, 'Clear all')).toHaveAttribute('aria-disabled', 'true');
  await box(page).click();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await expect(tool(page, 'Clear all')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(tool(page, 'Clear all')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tool(page, 'Redo')).toBeFocused();
});

test('the arrows move between the header, the toolbar, and the box, round from end to end', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).click();
  // Up from the box: the toolbar, first reached at the category menu; up again, the header.
  await page.keyboard.press('ArrowUp');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(shortcuts(page)).toBeFocused();
  // In the header, ← and → follow what shows: the shortcuts map, Copy URL, the theme menu.
  await page.keyboard.press('ArrowRight');
  await expect(tool(page, 'Copy URL')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(themeToggle(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(shortcuts(page)).toBeFocused();
  // Up from the header goes round to the box; each toolbar keeps where it was left.
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(box(page)).toBeFocused();
  // Down through the start's two rows of categories, then on round to the header.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(shortcuts(page)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu(page)).toBeFocused();
});

test('with nothing focused, ↑ or ↓ goes into the box, and the next press moves on from there', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.press('ArrowDown');
  await expect(box(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menu(page)).toBeFocused();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('ArrowUp');
  await expect(box(page)).toBeFocused();
});

test('Escape on a toolbar control goes back to the box; with the map open, it closes the map first', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).click();
  await page.keyboard.press('ArrowUp');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(box(page)).toBeFocused();

  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(shortcuts(page)).toBeFocused();
  await expect(shortcuts(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(shortcuts(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(shortcuts(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(box(page)).toBeFocused();
});

test('the shortcuts map shows while the keyboard is on its icon', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const map = page.getByRole('group', { name: 'Keyboard shortcuts' });
  await page.keyboard.press('Tab');
  await expect(shortcuts(page)).toBeFocused();
  await expect(map).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(map).toBeHidden();
  await expect(shortcuts(page)).toHaveAttribute('aria-expanded', 'false');
});

test('in a narrow header the arrows follow what shows, the theme menu first', async ({ page }) => {
  // Under 416 px the menus take their own line, theme menu first, and below sm the map hides.
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('/');
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(themeToggle(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tool(page, 'Copy URL')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(themeToggle(page)).toBeFocused();
});
