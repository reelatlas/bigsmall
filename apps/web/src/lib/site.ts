import { WORDMARK } from './wordmark';

/**
 * What the site says about itself to browsers, search engines, and link previews. The address
 * is Astro's `site` (astro.config.mjs), and the preview image and icons are drawn from the
 * default theme by `pnpm --filter @bigsmall/web brand` (docs/DESIGN-SYSTEM.md, "Brand assets").
 */
export const SITE = {
  name: WORDMARK,
  /** The converter page's title: the name, then what it is. */
  title: `${WORDMARK} · unit converter`,
  description: 'An efficient unit converter.',
  /** The line under the name on the link preview image: lowercase, like the name. */
  tagline: 'efficient unit converter',
  /** The link preview image, 1200 × 630, in public/. */
  image: '/og.png',
  imageAlt:
    'The bigsmall mark, a big circle and a small one, beside the name and “efficient unit converter”.',
} as const;
