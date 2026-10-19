import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_LIGHT, THEMES } from '../src/lib/themes';
import {
  applyTheme,
  box,
  expectNoA11yViolations,
  pageHeader,
  pickTheme,
  ready,
  row,
  settled,
  sketchbookReady,
  tokenColor,
  windowOf,
} from './support';

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

test('the page keeps the scrollbar’s room, so a panel that brings one moves the page by nothing and the column by what the panel lacks alone', async ({
  page,
}) => {
  // A classic scrollbar (Windows, Linux) takes layout width when it appears, and a centered
  // page would step left by half of it (docs/LEARNINGS.md, 2026-10-18). Headless Chromium
  // draws none, so the rule is read, and the page's edge is held across a panel opening; the
  // content column itself slides only by what the panel lacks at the window's frame, the margin
  // first (docs/UX-SPEC.md §1, "Units and Display"; a trial, 2026-10-18), and by nothing else.
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/?a=meter&v=1');
  await ready(page);
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter),
  ).toBe('stable');
  const edges = async () => ({
    page: await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().left),
    column: await pageHeader(page).evaluate((el) => el.getBoundingClientRect().left),
    columnRight: await pageHeader(page).evaluate((el) => el.getBoundingClientRect().right),
    limit: await page.evaluate(
      () =>
        document.body.getBoundingClientRect().right -
        parseFloat(getComputedStyle(document.querySelector('main')!).paddingRight),
    ),
  });
  const before = await edges();
  await page.getByRole('button', { name: 'Calculator', exact: true }).click();
  const calculator = page.getByRole('group', { name: 'Calculator' });
  await expect(calculator).toBeVisible();
  const after = await edges();
  expect(after.page).toBe(before.page);
  const panel = (await calculator.boundingBox())!.width;
  const lacked = Math.max(0, before.columnRight + 16 + panel - before.limit);
  expect(Math.abs(before.column - after.column - lacked)).toBeLessThanOrEqual(1);
});

test('an unknown address shows the not-found page, with the way back', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expectNoA11yViolations(page);
  // Its section sits a section step under the header, the step About's first section takes
  // (docs/DESIGN-SYSTEM.md, "Sections step by the frame").
  const step = (selector: string) =>
    page.evaluate(
      (s) => parseFloat(getComputedStyle(document.querySelector(s)!).marginTop),
      selector,
    );
  const notFound = await step('main > section');
  await page.getByRole('link', { name: 'Go to the converter' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/about');
  expect(await step('main > section')).toBe(notFound);
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
  await sketchbookReady(page);
  await walkTabStops(page);
});

/**
 * Tabs through every stop on the page, until focus comes round to the first again, and fails on
 * any that shows no focus indicator.
 */
async function walkTabStops(page: Page) {
  const missing: string[] = [];
  // The accent as painted: a shell's edge takes it to show focus in its field or menu.
  const accent = await tokenColor(page, '--accent');
  const mark = 'data-first-stop';
  let marked = false;
  let round = false;
  for (let press = 0; press < 80; press += 1) {
    await page.keyboard.press('Tab');
    // Shell edges fade in; read the indicator once transitions have finished.
    await settled(page);
    // A stop passes with its own outline, or with an accent edge on the shell it sits in
    // (fields and the theme menu show focus that way). Astro's dev toolbar is not ours. The first
    // stop is marked, so the walk knows when it has come round to it.
    const result = await page.evaluate(
      ([accent, mark, marked]) => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        if (element.closest('astro-dev-toolbar')) return null;
        if (element.hasAttribute(mark)) return 'round' as const;
        if (!marked) element.setAttribute(mark, '');
        const name =
          element.getAttribute('aria-label') ?? element.textContent?.trim() ?? element.tagName;
        const style = getComputedStyle(element);
        if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2) {
          return { ok: true, name };
        }
        for (let node = element.parentElement; node; node = node.parentElement) {
          const edge = getComputedStyle(node);
          if (parseFloat(edge.borderTopWidth) >= 2 && edge.borderTopColor === accent) {
            return { ok: true, name };
          }
        }
        return { ok: false, name };
      },
      [accent, mark, marked] as const,
    );
    if (result === null) continue;
    if (result === 'round') {
      round = true;
      break;
    }
    marked = true;
    if (!result.ok) missing.push(result.name);
  }
  expect(round, 'the walk came round to the first stop').toBe(true);
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
  // The page's frame is one value on every side at each screen class: the head's padding the
  // sides' and the foot's the head's (docs/UX-SPEC.md §1, "Footer"), at the project's width and
  // a phone's.
  const frame = () =>
    page.evaluate(() => {
      const main = getComputedStyle(document.querySelector('main')!);
      return {
        side: main.paddingLeft,
        top: main.paddingTop,
        bottom: main.paddingBottom,
        foot: getComputedStyle(document.querySelector('body > footer')!).paddingBottom,
      };
    });
  for (const width of [page.viewportSize()?.width ?? 1280, 390]) {
    await windowOf(page, width, 844);
    const at = await frame();
    expect(at.top, `${width}px`).toBe(at.side);
    expect(at.foot, `${width}px`).toBe(at.side);
    // The content ends 48 px above the foot on every screen (docs/DESIGN-SYSTEM.md, "The page's
    // two ends mirror"; Sean, 2026-10-18: the foot hugged a long page's last card, and three frames
    // read too big on a desktop).
    expect(parseFloat(at.bottom), `${width}px`).toBe(48);
    // Material's layout margins: 16 px on a compact screen, 24 from sm.
    expect(parseFloat(at.side), `${width}px`).toBe(width >= 640 ? 24 : 16);
  }
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

test('the privacy line’s links read as the text around them, until hovered or focused', async ({
  page,
  isMobile,
}) => {
  // About's footer holds the privacy line, its two names links in the line's own muted ink with no
  // underline, until hovered or focused, when they take the ink and the accent underline
  // (docs/UX-SPEC.md §1, "Footer"; `INLINE_LINK`).
  await page.goto('/about/');
  const footer = page.getByRole('contentinfo');
  const muted = await footer
    .getByText(/^Visits are counted/)
    .evaluate((line) => getComputedStyle(line).color);
  const ink = await tokenColor(page, '--ink');
  const accent = await tokenColor(page, '--accent');
  expect(muted).not.toBe(ink);
  for (const name of ['Umami', 'Formspark']) {
    const link = footer.getByRole('link', { name });
    await expect(link, name).toHaveCSS('color', muted);
    await expect(link, name).toHaveCSS('text-decoration-color', 'rgba(0, 0, 0, 0)');
    if (isMobile) continue;
    await link.hover();
    await expect(link, name).toHaveCSS('color', ink);
    await expect(link, name).toHaveCSS('text-decoration-color', accent);
    // Once the hover has faded, focus brings both back.
    await page.mouse.move(0, 0);
    await expect(link, name).toHaveCSS('color', muted);
    await link.focus();
    await expect(link, name).toHaveCSS('color', ink);
    await expect(link, name).toHaveCSS('text-decoration-color', accent);
  }
});

test('every control that answers a click shows the hand, and a disabled one the arrow', async ({
  page,
}) => {
  // One rule throughout (docs/DESIGN-SYSTEM.md, "Cursors"; Sean, 2026-10-18): buttons, tabs, menu
  // triggers, summaries, and links show the hand; a disabled control, by the attribute or by
  // aria-disabled, keeps the arrow. Read on the converter with a conversion on screen (the rows'
  // copy buttons), on About (the tabs, the summaries, Send), and on the gallery (every variant,
  // disabled ones among them).
  for (const path of ['/?a=mile&v=1', '/about', '/dev/gallery']) {
    await page.goto(path);
    if (path.startsWith('/?')) await ready(page);
    const wrong = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          'button, [role="button"], [role="tab"], summary, a[href]',
        ),
      ]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => {
          const disabled = el.matches(':disabled, [aria-disabled="true"]');
          const cursor = getComputedStyle(el).cursor;
          const want = disabled ? 'default' : 'pointer';
          const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30);
          return cursor === want
            ? null
            : `${el.tagName.toLowerCase()} "${name}" shows ${cursor}, not ${want}`;
        })
        .filter(Boolean),
    );
    expect(wrong, path).toEqual([]);
  }
});
