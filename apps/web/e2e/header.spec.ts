import { expect, test } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import {
  applyTheme,
  calculatorButton,
  expectNoA11yViolations,
  MARGIN_MS,
  pickTheme,
  ready,
  shortcutsButton,
  themeToggle,
} from './support';

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
  // ← and → leave the open menu on the theme reached and move along the header (Sean, 2026-10-15).
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  const reached = await page.locator('html').getAttribute('data-theme');
  await page.keyboard.press('ArrowLeft');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Copy URL' })).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-theme', reached!);
});

test('the theme menu shows the name alone at rest and reads "Theme" while open, at any width', async ({
  page,
}) => {
  await page.goto('/');
  const toggle = themeToggle(page);
  const name = page.locator('[data-theme-name]');
  const word = toggle.getByText('Theme', { exact: true });
  // As the category menu does (Sean, 2026-10-17): the name alone at rest, the word only for
  // screen readers; open, the word in its place, muted, the list's fill marking the theme.
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(name, `${width}px`).toBeVisible();
    expect((await word.boundingBox())?.width ?? 0, `${width}px`).toBeLessThanOrEqual(1);
    await toggle.click();
    await expect(name, `${width}px`).toBeHidden();
    expect((await word.boundingBox())!.width, `${width}px`).toBeGreaterThan(10);
    await page.keyboard.press('Escape');
    await expect(name, `${width}px`).toBeVisible();
  }
});

test("the shortcuts button switches by the header's own width, where all of it fits", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the shortcuts button is hidden on touch-first devices');
  await page.goto('/');
  // The page's own header: on the dev server, as on CI, Astro's dev toolbar draws headers too.
  const header = page.locator('main > header');
  const headerWidth = () => header.evaluate((el) => el.getBoundingClientRect().width);
  // The page's 16 px gutters aside, a 600 px window leaves the header under 576 px, its container
  // xl size: no shortcuts button.
  await page.setViewportSize({ width: 600, height: 800 });
  expect(await headerWidth()).toBeLessThan(576);
  await expect(shortcutsButton(page)).toBeHidden();
  // From 576 px of header it shows (the line it shares, in every theme, is the width tests'
  // below), and the shortcuts map opens inside the window.
  await page.setViewportSize({ width: 610, height: 800 });
  expect(await headerWidth()).toBeGreaterThanOrEqual(576);
  await expect(shortcutsButton(page)).toBeVisible();
  await shortcutsButton(page).click();
  await expect(page.getByText('Pick a unit or value')).toBeVisible();
  // The open card, which grows left from the button.
  const card = shortcutsButton(page).locator('xpath=ancestor::*[@data-shell]/*[1]');
  const box = (await card.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(610);
});

test('the shortcuts map opens on a click, never on hover, and closes on Escape or a second click', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  await page.goto('/');
  const toggle = shortcutsButton(page);

  // A resting mouse opens nothing (Sean, 2026-10-15); a click does.
  await toggle.hover();
  await page.waitForTimeout(MARGIN_MS * 2);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Pick a unit or value')).toBeVisible();
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
  // The mouse leaving keeps it open; a second click closes it.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(MARGIN_MS * 2);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expectNoA11yViolations(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // Reached with the keyboard it stays shut; Enter opens it, Escape closes it.
  await toggle.focus();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('the shortcuts map is hidden on touch-first devices', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop shows the shortcuts map');
  await page.goto('/');
  await expect(shortcutsButton(page)).toBeHidden();
});

test('shortcuts name ⌘ and ⌥ on Apple devices, Ctrl and Alt elsewhere', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  const undo = page.getByRole('button', { name: 'Undo' });
  const calculator = calculatorButton(page);

  await page.goto('/');
  await ready(page);
  await expect(page.locator('[data-mod-key]').first()).toHaveText('Ctrl');
  await expect(page.locator('[data-alt-key]').first()).toHaveText('Alt');
  await expect(undo).toHaveAttribute('title', 'Undo (Ctrl+Z)');
  await expect(calculator).toHaveAttribute('title', 'Calculator (Alt+C)');
  // The site's shortcuts, then a line, then the toolbar's, from the calculator on.
  const lined = page.locator('#shortcuts-panel [data-starts-group]');
  await expect(lined).toHaveCount(1);
  await expect(lined).toContainText('Open calculator');
  await expect(page.locator('#shortcuts-panel')).not.toContainText('Reorder');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'macOS' }) });
  });
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-mod-key]').first()).toHaveText('⌘');
  await expect(page.locator('[data-alt-key]').first()).toHaveText('⌥');
  await expect(undo).toHaveAttribute('title', 'Undo (⌘Z)');
  await expect(calculator).toHaveAttribute('title', 'Calculator (⌥C)');
});

// Under 416 px the header's menus take a line of their own, theme menu first and flush left; from
// 416 px every theme's name, art, and menus share one line, the menus on the right.
for (const width of [320, 375, 400, 414, 416, 430, 520, 600, 610, 640]) {
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
        const button = document.querySelector('[data-theme-name]')!.closest('button')!;
        const trigger = button.getBoundingClientRect();
        // The first words shown (the label in a header of 576 px or more, else the name) and the
        // chevron at the end.
        const first = [...button.querySelectorAll('span')]
          .find((span) => getComputedStyle(span).position !== 'absolute')!
          .getBoundingClientRect();
        const chevron = button.querySelector('svg')!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ownLine: menus.top >= name.bottom,
          left: Math.round(menus.left - header.left),
          right: Math.round(header.right - menus.right),
          themeFirst: trigger.right <= copyUrl.left,
          rowGap: Math.round(menus.top - name.bottom),
          padLeft: Math.round(first.left - trigger.left),
          padRight: Math.round(trigger.right - chevron.right),
        };
      });
      expect(m.overflow, theme.id).toBe(0);
      expect(m.ownLine, theme.id).toBe(ownLine);
      expect(m.themeFirst, theme.id).toBe(ownLine);
      expect(ownLine ? m.left : m.right, theme.id).toBe(0);
      // A wrapped row of menus keeps 20 px of air under the name.
      if (ownLine) expect(m.rowGap, theme.id).toBe(20);
      // The trigger's padding is the same at both ends, to its first words and after its chevron.
      expect(m.padLeft, theme.id).toBe(m.padRight);
    }
  });
}

test('the shortcuts map is the converter page’s alone', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the shortcuts map is hidden on touch-first devices');
  await page.goto('/');
  await expect(shortcutsButton(page)).toBeVisible();
  for (const path of ['/about/', '/not-a-page']) {
    await page.goto(path);
    await expect(themeToggle(page), path).toBeVisible();
    await expect(shortcutsButton(page), path).toHaveCount(0);
  }
});

test('off the converter’s page the name leads home on a 44 px target in every theme, moving nothing', async ({
  page,
}) => {
  const heights = new Map<string, number>();
  const heading = page.getByRole('heading', { level: 1 });
  // On the converter's page the name is no link: the heading's height there is the name's own.
  await page.goto('/');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    heights.set(theme.id, (await heading.boundingBox())?.height ?? 0);
  }
  await page.goto('/about/');
  const home = page.getByRole('link', { name: 'bigsmall' });
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    expect((await home.boundingBox())?.height, theme.id).toBeGreaterThanOrEqual(44);
    expect((await heading.boundingBox())?.height, theme.id).toBeCloseTo(heights.get(theme.id)!, 1);
  }
});
