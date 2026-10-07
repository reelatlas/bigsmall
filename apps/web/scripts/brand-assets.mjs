// Draws the site's icons and its link preview image into public/ from the default theme's tokens
// (docs/DESIGN-SYSTEM.md, "Brand assets"). Run after changing the mark or the Daylight colors:
//   pnpm --filter @bigsmall/web brand
// The mark is a big circle and a small one on one baseline, read like the name: big, then small.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const out = (name) => fileURLToPath(new URL(`public/${name}`, root));

/** The Daylight theme's tokens, read from its CSS so the assets follow the theme. */
const css = readFileSync(new URL('src/styles/themes/daylight.css', root), 'utf8');
const token = (name) => {
  const value = css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
  if (!value) throw new Error(`daylight.css has no --${name}`);
  return value;
};
const color = {
  tile: token('accent'),
  dot: token('on-accent'),
  canvas: token('canvas'),
  ink: token('ink'),
  muted: token('ink-muted'),
};
const display = token('type-display');

/** The name and the line under it, read from where the site keeps them. */
const read = (file, pattern) => {
  const found = readFileSync(new URL(file, root), 'utf8').match(pattern)?.[1];
  if (!found) throw new Error(`${file} does not match ${pattern}`);
  return found;
};
const site = {
  name: read('src/lib/wordmark.ts', /export const WORDMARK = '([^']+)'/),
  tagline: read('src/lib/site.ts', /tagline: '([^']+)'/),
};

/** The mark on a 32-unit tile. `corner` rounds the tile; iOS rounds its own, so it gets none. */
const mark = (corner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" rx="${corner}" fill="${color.tile}"/>` +
  `<circle cx="11.5" cy="16" r="8" fill="${color.dot}"/>` +
  `<circle cx="25.5" cy="21" r="3" fill="${color.dot}"/>` +
  `</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();

/** Renders HTML at a size and returns the PNG. */
async function png(html, width, height) {
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}svg{display:block;width:100%;height:100%}</style></head><body>${html}</body></html>`,
  );
  return page.screenshot({ type: 'png', omitBackground: true });
}

/** An .ico holding PNG images, which every current browser reads. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

writeFileSync(out('icon.svg'), `${mark(7)}\n`);
const sizes = [16, 32];
const images = [];
for (const size of sizes) images.push({ size, data: await png(mark(7), size, size) });
writeFileSync(out('favicon.ico'), ico(images));
writeFileSync(out('apple-touch-icon.png'), await png(mark(0), 180, 180));

// The link preview: the mark, the name, and what it is, on the page color.
const card = `
  <div style="box-sizing:border-box;width:1200px;height:630px;padding:0 112px;display:flex;align-items:center;gap:64px;background:${color.canvas};font-family:${display}">
    <div style="width:208px;height:208px;flex:none">${mark(7).replace('viewBox', 'width="208" height="208" viewBox')}</div>
    <div>
      <div style="font-size:144px;line-height:1;font-weight:600;letter-spacing:-0.025em;color:${color.ink}">${site.name}</div>
      <div style="margin-top:28px;font-size:44px;line-height:1.25;text-wrap:balance;color:${color.muted}">${site.tagline}</div>
    </div>
  </div>`;
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><body style="margin:0">${card}</body></html>`);
writeFileSync(out('og.png'), await page.screenshot({ type: 'png' }));

await browser.close();
console.log('Wrote icon.svg, favicon.ico, apple-touch-icon.png, and og.png to apps/web/public.');
