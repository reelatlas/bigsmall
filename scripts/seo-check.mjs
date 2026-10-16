// The SEO contract (docs/SEO.md), checked on the built site: every page in the sitemap, and every
// page left out of it. A page added later is held to the same rules by being built.
// Usage: node scripts/seo-check.mjs   (run after `pnpm build`)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = join('apps', 'web', 'dist');
const SITE = 'https://bigsmall.work';
const TITLE_MOST = 60;
const DESCRIPTION = { least: 50, most: 160 };

const read = (path) => readFileSync(join(DIST, path), 'utf8');
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
const tags = (html, pattern) => [...html.matchAll(pattern)].map((m) => m[0]);
const decode = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** The built file for a path: /about/ is about/index.html. */
const fileFor = (path) => (path.endsWith('/') ? `${path}index.html` : `${path}.html`).slice(1);

/** Every page the build wrote, as the path it is served at. */
function builtPages(dir = DIST) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === '_astro' ? [] : builtPages(full);
    if (!name.endsWith('.html')) return [];
    const path = `/${relative(DIST, full).split(sep).join('/')}`;
    return [path.endsWith('index.html') ? path.slice(0, -'index.html'.length) : path.slice(0, -5)];
  });
}

const failures = [];
const fail = (path, message) => failures.push(`${path}: ${message}`);

const listed = locs(read('sitemap-index.xml'))
  .flatMap((map) => locs(read(new URL(map).pathname.slice(1))))
  .map((loc) => new URL(loc).pathname);
if (listed.length === 0) fail('/sitemap-index.xml', 'lists no pages');

const titles = new Map();
for (const path of listed) {
  const html = read(fileFor(path));
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const metas = tags(html, /<meta [^>]*>/g);
  const meta = (key, value) => {
    const tag = metas.find((m) => attr(m, key) === value);
    return tag ? decode(attr(tag, 'content') ?? '') : null;
  };
  const canonicals = tags(html, /<link [^>]*rel="canonical"[^>]*>/g).map((t) => attr(t, 'href'));
  const at = `${SITE}${path}`;

  if (canonicals.length !== 1 || canonicals[0] !== at) {
    fail(path, `canonical ${JSON.stringify(canonicals)}, not ["${at}"]`);
  }
  if (meta('name', 'robots')) fail(path, 'is in the sitemap but asks not to be indexed');
  if (!title) fail(path, 'has no title');
  else if (title.length > TITLE_MOST)
    fail(path, `title is ${title.length} characters, over ${TITLE_MOST}`);
  if (titles.has(title)) fail(path, `title "${title}" is also ${titles.get(title)}'s`);
  titles.set(title, path);
  const description = meta('name', 'description') ?? '';
  if (description.length < DESCRIPTION.least || description.length > DESCRIPTION.most) {
    fail(
      path,
      `description is ${description.length} characters, not ${DESCRIPTION.least} to ${DESCRIPTION.most}`,
    );
  }
  if (meta('property', 'og:title') !== title) fail(path, 'og:title is not the title');
  if (meta('property', 'og:url') !== at) fail(path, 'og:url is not the canonical address');
  if (!meta('property', 'og:image')?.startsWith(`${SITE}/`))
    fail(path, 'og:image is not an absolute address');
  if (attr(html.match(/<html [^>]*>/)?.[0] ?? '', 'lang') !== 'en')
    fail(path, 'html has no lang="en"');
  const headings = tags(html, /<h1[\s>]/g).length;
  if (headings !== 1) fail(path, `has ${headings} h1 headings, not one`);
  for (const json of html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)) {
    try {
      JSON.parse(json[1]);
    } catch {
      fail(path, 'has structured data that is not JSON');
    }
  }
}

// The converter's page names the site for results, with its logo.
const home = read('index.html').match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
const graph = home ? (JSON.parse(home[1])['@graph'] ?? []) : [];
for (const type of ['WebSite', 'Organization']) {
  if (!graph.some((node) => node['@type'] === type)) fail('/', `structured data has no ${type}`);
}

// A page left out of the sitemap asks not to be indexed (the dev pages, the not-found page).
for (const path of builtPages()) {
  if (listed.includes(path)) continue;
  const robots = tags(read(fileFor(path)), /<meta [^>]*>/g).find(
    (m) => attr(m, 'name') === 'robots',
  );
  if (attr(robots ?? '', 'content') !== 'noindex')
    fail(path, 'is left out of the sitemap but not noindex');
}

if (failures.length > 0) {
  console.error(
    `The SEO contract (docs/SEO.md) fails:\n${failures.map((f) => `  ${f}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `SEO contract: ${listed.length} pages in the sitemap meet it; every other page asks not to be indexed.`,
);
