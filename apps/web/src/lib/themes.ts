/**
 * Theme registry and token contract.
 * The CSS lives in src/styles/themes/<id>.css; this file is the single list of what exists
 * and what every theme must define. test/themes.test.ts enforces the contract and WCAG contrast.
 * The inline script in src/layouts/Base.astro applies and saves themes; it receives the ids, names,
 * storage key, and defaults from here through define:vars, so this file stays the one source.
 */

export const THEME_STORAGE_KEY = 'bigsmall:theme';

export type ThemeId = 'daylight' | 'midnight' | 'sakura' | 'neo-noir' | 'hardhat' | 'theorem';

type ThemeScheme = 'light' | 'dark';

/** baseline: the reference theme · palette: tokens only, no decoration yet · designed: finished */
type ThemeStatus = 'baseline' | 'palette' | 'designed';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  scheme: ThemeScheme;
  status: ThemeStatus;
  blurb: string;
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'daylight',
    name: 'Daylight',
    scheme: 'light',
    status: 'baseline',
    blurb: 'Neutral light. The reference.',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    scheme: 'dark',
    status: 'baseline',
    blurb: 'Neutral dark. Default when your OS is dark.',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    scheme: 'light',
    status: 'palette',
    blurb: 'Cherry blossom: soft pinks, warm paper, plum ink.',
  },
  {
    id: 'neo-noir',
    name: 'Neo-noir',
    scheme: 'dark',
    status: 'palette',
    blurb: 'Tokyo at night: magenta glow, cyan focus, mono numerals.',
  },
  {
    id: 'hardhat',
    name: 'Hardhat',
    scheme: 'dark',
    status: 'palette',
    blurb: 'Job site: blueprint navy, safety yellow, hard edges.',
  },
  {
    id: 'theorem',
    name: 'Theorem',
    scheme: 'dark',
    status: 'palette',
    blurb: 'Chalkboard: chalk ink, serif type, typeset numbers.',
  },
];

export const DEFAULT_LIGHT: ThemeId = 'daylight';
export const DEFAULT_DARK: ThemeId = 'midnight';

/** Every theme file must define each of these custom properties (without the leading --). */
export const TOKEN_CONTRACT = {
  colors: [
    'canvas',
    'surface',
    'surface-raised',
    'ink',
    'ink-muted',
    'accent',
    'on-accent',
    'accent-soft',
    'line',
    'edge',
    'focus',
    'danger',
    'success',
  ],
  type: ['type-display', 'type-body', 'type-numeric'],
  shape: ['shape-sm', 'shape-md', 'shape-lg'],
  elevation: ['elevation-sm', 'elevation-md'],
  /**
   * motion-glide is the even curve for something travelling a distance (a unit gliding to its
   * place), where motion-ease front-loads; highlight-fade is a fade of color with no movement:
   * reduced motion keeps it (lib/flash.ts).
   */
  motion: [
    'motion-fast',
    'motion-base',
    'motion-slow',
    'motion-ease',
    'motion-glide',
    'highlight-fade',
  ],
  /** Theme art's palette: decoration, so it has no contrast pair. */
  art: ['art-1', 'art-2', 'art-3'],
} as const;

/**
 * Colors the Tailwind bridge works out from each theme's own (src/styles/global.css), so no theme
 * defines them: [name, base, the base's share, mixed toward], as `color-mix(in srgb, …)` writes
 * them. The theme test mixes them as the browser does, for their contrast pairs below.
 */
export const DERIVED_COLORS: ReadonlyArray<readonly [string, string, number, string]> = [
  // The unit chip's hover: its tint lightened toward the surface (the full tidy, 2026-10-15).
  ['accent-soft-hover', 'accent-soft', 0.6, 'surface'],
];

/** [foreground, background, minimum contrast ratio]. 4.5 for text, 3 for UI (WCAG 2.2 AA). */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['ink', 'canvas', 4.5],
  ['ink', 'surface', 4.5],
  ['ink', 'surface-raised', 4.5],
  ['ink-muted', 'canvas', 4.5],
  ['ink-muted', 'surface', 4.5],
  ['ink-muted', 'surface-raised', 4.5],
  ['on-accent', 'accent', 4.5],
  ['ink', 'accent-soft', 4.5],
  ['ink-muted', 'accent-soft', 4.5],
  // The chip's name and symbol on its hover.
  ['ink', 'accent-soft-hover', 4.5],
  ['ink-muted', 'accent-soft-hover', 4.5],
  ['danger', 'canvas', 4.5],
  // "Too large to convert" is drawn inside a field.
  ['danger', 'surface', 4.5],
  ['success', 'canvas', 4.5],
  // The check a copy button shows is a graphic inside a field (WCAG 1.4.11).
  ['success', 'surface', 3],
  ['accent', 'canvas', 3],
  ['accent', 'surface', 3],
  ['focus', 'canvas', 3],
  ['focus', 'surface', 3],
  // A control's resting edge (fields, secondary buttons) is what identifies it (WCAG 1.4.11).
  ['edge', 'canvas', 3],
  ['edge', 'surface', 3],
];
