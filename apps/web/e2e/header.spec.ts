import { expect, test } from '@playwright/test';
import { THEMES } from '../src/lib/themes';
import {
  applyTheme,
  calculatorButton,
  expectNoA11yViolations,
  MARGIN_MS,
  pickTheme,
  pressTool,
  ready,
  settingsPanel,
  shortcutsButton,
  themeToggle,
  windowOf,
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
  isMobile,
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
  // ← and → leave the open menu on the theme reached and move along the header (Sean, 2026-10-15):
  // to Copy URL where the header shows it; a phone's header hides it (§1), so there the theme
  // menu is the header's one tool and keeps the focus.
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  const reached = await page.locator('html').getAttribute('data-theme');
  await page.keyboard.press('ArrowLeft');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(isMobile ? toggle : page.getByRole('button', { name: 'Copy URL' })).toBeFocused();
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
    // A visually hidden word is a pixel wide, a hair over on a phone's fractional scale.
    expect(Math.round((await word.boundingBox())?.width ?? 0), `${width}px`).toBeLessThanOrEqual(1);
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
  // xl size: no shortcuts button. The windows are sized by the content (windowOf).
  await windowOf(page, 600, 800);
  expect(await headerWidth()).toBeLessThan(576);
  await expect(shortcutsButton(page)).toBeHidden();
  // From 576 px of header it shows (the line it shares, in every theme, is the width tests'
  // below), and the shortcuts map opens inside the window.
  await windowOf(page, 610, 800);
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

// The header keeps one line (Sean, 2026-10-17; docs/UX-SPEC.md §1): under 416 px of window (a
// header under its sm size, 384 px) the icons hide, Copy URL among them, and the theme menu shares
// the name's line down to 352 px (a header under xs, 320 px), where it takes a line of its own,
// flush left; from 416 px Copy URL shows before the theme menu, the menus on the right.
for (const width of [320, 351, 352, 375, 400, 415, 416, 430, 520, 600, 610, 640]) {
  const ownLine = width < 352;
  const copyShown = width >= 416;
  const line = ownLine
    ? 'the theme menu wraps under it'
    : copyShown
      ? 'Copy URL and the theme menu share its line'
      : 'the theme menu alone shares its line';
  test(`at ${width} px the name keeps its art, and ${line}`, async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await windowOf(page, width, 800);
    // The toolbar refits to the new width a frame later: wait until nothing passes the window.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        { message: `${width}px` },
      )
      .toBeLessThanOrEqual(0);
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
        // The first words shown (the theme's name, at rest) and the chevron at the end.
        const first = [...button.querySelectorAll('span')]
          .find((span) => getComputedStyle(span).position !== 'absolute')!
          .getBoundingClientRect();
        const chevron = button.querySelector('svg')!.getBoundingClientRect();
        return {
          // Sideways overflow alone: the scrollbar's room leaves the content short of the window.
          overflow: Math.max(
            0,
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
          ownLine: menus.top >= name.bottom,
          left: Math.round(menus.left - header.left),
          right: Math.round(header.right - menus.right),
          copyShown: copyUrl.width > 0,
          iconsFirst: copyUrl.right <= trigger.left,
          rowGap: Math.round(menus.top - name.bottom),
          padLeft: Math.round(first.left - trigger.left),
          padRight: Math.round(trigger.right - chevron.right),
        };
      });
      expect(m.overflow, theme.id).toBe(0);
      expect(m.ownLine, theme.id).toBe(ownLine);
      expect(m.copyShown, theme.id).toBe(copyShown);
      if (copyShown) expect(m.iconsFirst, theme.id).toBe(true);
      expect(ownLine ? m.left : m.right, theme.id).toBe(0);
      // A theme menu on a line of its own keeps 20 px of air under the name.
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

// The header is as wide as the converter's column (docs/UX-SPEC.md §1; Sean, 2026-10-17):
// its menus end where the box ends, with a side panel open too. The panel opens beside a whole box
// from a 944 px window; narrower, the box gives way and the header with it.
test('the header ends where the box ends, with Units open too, which opens beside a whole box', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'below md the side panel opens between the box and the table');
  const edges = () =>
    page.evaluate(() => {
      const header = document.querySelector('main > header')!.getBoundingClientRect();
      const box = document.querySelector('[data-head]')!.getBoundingClientRect();
      return {
        header: Math.round(header.right),
        box: Math.round(box.right),
        width: Math.round(box.width),
      };
    });
  for (const [width, whole] of [
    [1280, true],
    [1024, true],
    [768, false],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?a=meter&v=1');
    await ready(page);
    let m = await edges();
    expect(m.header, `${width}px`).toBe(m.box);
    expect(m.width, `${width}px`).toBe(576);
    await pressTool(page, 'Units');
    const panel = settingsPanel(page, 'Units');
    await expect(panel).toBeVisible();
    m = await edges();
    expect(m.header, `${width}px, Units open`).toBe(m.box);
    if (whole) expect(m.width, `${width}px, Units open`).toBe(576);
    else expect(m.width, `${width}px, Units open`).toBeLessThan(576);
    // The panel one step from the box's edge, on the box's top line.
    const side = (await panel.boundingBox())!;
    expect(Math.round(side.x) - m.box, `${width}px`).toBe(16);
  }
});
