import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_LIGHT, THEMES } from '../src/lib/themes';
import { applyTheme, box, expectNoA11yViolations, pickTheme, ready, row, settled } from './support';

// Checks that span the site: every page and every theme pass axe, every Tab stop shows focus,
// and reduced motion stills every theme. Each feature's flows have a file of their own.

const PAGES = ['/', '/about', '/dev/gallery', '/dev/wordmark-lab', '/dev/sketchbook-lab'];

for (const path of PAGES) {
  test(`${path} renders with no WCAG violations`, async ({ page }) => {
    // The gallery holds every component in every theme: axe takes its time over it, the more so
    // on CI's dev server.
    test.slow(path === '/dev/gallery', 'the gallery is every component in every theme');
    await page.goto(path);
    if (path === '/') await ready(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test('no text field on any page is under 16 px, the size a phone zooms into', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'the phone project reads the sizes');
  // iOS zooms into a focused field whose text is under 16 px (docs/LEARNINGS.md, 2026-10-17):
  // every drawn text field on every page, the labs' and the gallery's too, is 16 or more.
  for (const path of PAGES) {
    await page.goto(path);
    if (path === '/') await ready(page);
    const small = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]), textarea, select',
        ),
      ]
        .filter((el) => el.getClientRects().length > 0)
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(small, path).toEqual([]);
  }
});

test('an unknown address shows the not-found page, with the way back', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.getByRole('link', { name: 'Go to the converter' }).click();
  await expect(page).toHaveURL('/');
});

test('pages tell search engines and link previews what they are; dev pages stay out of search', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bigsmall.work/',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://bigsmall.work/og.png',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await page.goto('/about');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /^https:\/\/bigsmall\.work\/about\/?$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  for (const path of ['/dev/gallery', '/dev/wordmark-lab', '/dev/sketchbook-lab']) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]'), path).toHaveCount(0);
  }
});

test('a conversion loads from the URL', async ({ page }) => {
  await page.goto('/?a=mile&v=1');
  await expect(box(page)).toHaveValue('1');
  // Two places, as a fresh visit writes values.
  await expect(row(page, 'kilometer')).toContainText('1.61');
});

test('every theme passes axe on the converter', async ({ page }) => {
  // A conversion on screen, so the table's rows are checked too.
  await page.goto('/?a=mile&v=1');
  await ready(page);
  await expectNoA11yViolations(page);
  for (const theme of THEMES.filter((t) => t.id !== DEFAULT_LIGHT)) {
    await pickTheme(page, theme.name);
    await expect(page.locator('html'), theme.id).toHaveAttribute('data-theme', theme.id);
    await expectNoA11yViolations(page);
  }
});

test('every Tab stop shows a visible focus indicator', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/?a=mile&v=1');
  await ready(page);
  await walkTabStops(page);
});

test('every Tab stop on the About page shows a visible focus indicator', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a keyboard walk needs a keyboard');
  await page.goto('/about/');
  await page.locator('[data-playing]').waitFor();
  await walkTabStops(page);
});

/** Tabs through the page's first stops and fails on any that shows no focus indicator. */
async function walkTabStops(page: Page) {
  const missing: string[] = [];
  for (let stop = 0; stop < 10; stop += 1) {
    await page.keyboard.press('Tab');
    // Shell edges fade in; read the indicator once transitions have finished.
    await settled(page);
    // A stop passes with its own outline, or with an accent edge on the shell it sits in
    // (fields and the theme menu show focus that way). Astro's dev toolbar is not ours.
    const result = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      if (element.closest('astro-dev-toolbar')) return null;
      const name =
        element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.tagName;
      const style = getComputedStyle(element);
      if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2) {
        return { ok: true, name };
      }
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent)';
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      for (let node = element.parentElement; node; node = node.parentElement) {
        const edge = getComputedStyle(node);
        if (parseFloat(edge.borderTopWidth) >= 2 && edge.borderTopColor === accent) {
          return { ok: true, name };
        }
      }
      return { ok: false, name };
    });
    if (result && !result.ok) missing.push(result.name);
  }
  expect(missing).toEqual([]);
}

test('reduced motion zeroes the motion tokens in every theme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const theme of THEMES) {
    await applyTheme(page, theme);
    for (const token of ['--motion-fast', '--motion-base', '--motion-slow']) {
      const duration = await page.evaluate(
        (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
        token,
      );
      // Zero either way: the production build's minifier writes 0ms as 0s.
      expect(duration, `${theme.id} ${token}`).toMatch(/^0m?s$/);
    }
  }
});

test('the footer sits at the window’s bottom on a short page, and after the content on a long one', async ({
  page,
}) => {
  const place = () =>
    page.evaluate(() => {
      const footer = document.querySelector('body > footer')?.getBoundingClientRect();
      const main = document.querySelector('main')?.getBoundingClientRect();
      return {
        footerTop: (footer?.top ?? 0) + scrollY,
        footerBottom: (footer?.bottom ?? 0) + scrollY,
        mainBottom: (main?.bottom ?? 0) + scrollY,
        window: innerHeight,
        page: document.documentElement.scrollHeight,
      };
    });
  await page.goto('/no-such-page');
  const short = await place();
  expect(short.page).toBeLessThanOrEqual(short.window);
  expect(Math.abs(short.footerBottom - short.window)).toBeLessThanOrEqual(1);
  // A table taller than the window: the footer follows it.
  await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 480 });
  await page.goto('/?a=mile&v=1');
  await ready(page);
  const long = await place();
  expect(long.page).toBeGreaterThan(long.window);
  expect(Math.abs(long.footerTop - long.mainBottom)).toBeLessThanOrEqual(1);
});

test('the footer links to the About page, quietly until hovered or focused', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const about = page.getByRole('contentinfo').getByRole('link', { name: 'About' });
  await expect(about).toHaveCSS('text-decoration-color', 'rgba(0, 0, 0, 0)');
  if (isMobile) return;
  await about.hover();
  await expect(about).not.toHaveCSS('text-decoration-color', 'rgba(0, 0, 0, 0)');
  // Once the hover's underline has faded out, focus brings it back.
  await page.mouse.move(0, 0);
  await expect(about).toHaveCSS('text-decoration-color', 'rgba(0, 0, 0, 0)');
  await about.focus();
  await expect(about).not.toHaveCSS('text-decoration-color', 'rgba(0, 0, 0, 0)');
});
