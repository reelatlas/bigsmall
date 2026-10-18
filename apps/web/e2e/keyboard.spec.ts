import { categories } from '@bigsmall/core';
import { expect, test, type Page } from '@playwright/test';
import { blur, box, menu, ready, shortcutsButton, themeToggle } from './support';

// The page's toolbars and planes (docs/UX-SPEC.md §8, §10, ADR 0014): each toolbar is one Tab
// stop whose arrows move along it, and which keeps the control last used; ↑ and ↓ move between
// the header's toolbar, the converter's, and the box, stopping at either end; Escape on a
// toolbar's control goes back to the box. The box's own arrows through its rows are in
// table.spec.ts, the calculator's in calculator.spec.ts.

test.skip(({ isMobile }) => isMobile, 'the arrows and Tab need a keyboard');

const tool = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('each toolbar is one Tab stop, which keeps the control last used', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(shortcutsButton(page)).toBeFocused();
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
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tool(page, 'Clear all')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
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

test('the arrows move between the header, the toolbar, and the box, stopping at either end', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  await box(page).click();
  // Up from the box: the toolbar, first reached at the category menu; up again, the header.
  await page.keyboard.press('ArrowUp');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(shortcutsButton(page)).toBeFocused();
  // In the header, ← and → follow what shows: the shortcuts map, Copy URL, the theme menu.
  await page.keyboard.press('ArrowRight');
  await expect(tool(page, 'Copy URL')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(themeToggle(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(shortcutsButton(page)).toBeFocused();
  // The header is the top: up from it does nothing (Sean, 2026-10-15). Down, each toolbar keeps
  // where it was left.
  await page.keyboard.press('ArrowUp');
  await expect(shortcutsButton(page)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(box(page)).toBeFocused();
  // Down into the start's categories, four across, through each row; past the last row, the
  // bottom: focus stays in the box, the cursor on the last row.
  for (let row = 0; row <= Math.ceil(categories.length / 4); row += 1) {
    await page.keyboard.press('ArrowDown');
  }
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveAttribute('aria-activedescendant', /.+/);
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

  await blur(page);
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
  await expect(shortcutsButton(page)).toBeFocused();
  await expect(shortcutsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(shortcutsButton(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(shortcutsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(shortcutsButton(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(box(page)).toBeFocused();
});

test('typing on a toolbar’s control, the header’s too, lands in the box', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(shortcutsButton(page)).toBeFocused();
  await page.keyboard.type('5');
  await expect(box(page)).toBeFocused();
  await expect(box(page)).toHaveValue('5');
  await page.keyboard.press('ArrowUp');
  await expect(menu(page)).toBeFocused();
  await page.keyboard.type('0');
  await expect(box(page)).toHaveValue('50');
});

test('the shortcuts map opens with Enter, never as the keyboard passes, and closes as focus moves on', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const map = page.getByRole('group', { name: 'Keyboard shortcuts' });
  const ring = () => shortcutsButton(page).evaluate((icon) => getComputedStyle(icon).outlineStyle);
  // Reached with Tab it stays shut, the icon showing its ring, which its shell does not clip
  // (Sean, 2026-10-15).
  await page.keyboard.press('Tab');
  await expect(shortcutsButton(page)).toBeFocused();
  await expect(map).toBeHidden();
  expect(await ring()).not.toBe('none');
  const clip = () =>
    shortcutsButton(page).evaluate(
      (icon) => getComputedStyle(icon.closest('[data-shell] > *')!).overflow,
    );
  expect(await clip()).toBe('visible');
  // Enter opens it: the icon switched on, as a toolbar's button is while its panel is open; the
  // open map's accent edge shows where focus is, the icon drawing no ring.
  await page.keyboard.press('Enter');
  await expect(map).toBeVisible();
  expect(await ring()).toBe('none');
  // The fill eases in with the button's own transition, so wait for it to settle.
  const soft = await shortcutsButton(page).evaluate((icon) => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(icon).getPropertyValue('--accent-soft');
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect
    .poll(() => shortcutsButton(page).evaluate((icon) => getComputedStyle(icon).backgroundColor))
    .toBe(soft);
  await page.keyboard.press('Escape');
  await expect(map).toBeHidden();
  await expect(shortcutsButton(page)).toBeFocused();
  // Open again, moving on along the toolbar closes it.
  await page.keyboard.press('Enter');
  await expect(map).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(map).toBeHidden();
  await expect(shortcutsButton(page)).toHaveAttribute('aria-expanded', 'false');
});

test('in a narrow header the arrows follow what shows: the theme menu alone, or Copy URL before it', async ({
  page,
}) => {
  // Under 416 px the header hides its icons, Copy URL among them (docs/UX-SPEC.md §1), and the
  // theme menu is its one tool; from 416 px Copy URL shows before it, while a header under 576 px
  // still hides the shortcuts button.
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('/');
  await ready(page);
  await expect(tool(page, 'Copy URL')).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(themeToggle(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(themeToggle(page)).toBeFocused();

  await page.setViewportSize({ width: 500, height: 800 });
  await page.goto('/');
  await ready(page);
  await expect(shortcutsButton(page)).toBeHidden();
  await tool(page, 'Copy URL').focus();
  await page.keyboard.press('ArrowRight');
  await expect(themeToggle(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tool(page, 'Copy URL')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(themeToggle(page)).toBeFocused();
});
