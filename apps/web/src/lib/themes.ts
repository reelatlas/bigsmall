/**
 * Theme registry and token contract.
 * The CSS lives in src/styles/themes/<id>.css; this file is the single list of what exists
 * and what every theme must define. test/themes.test.ts enforces the contract and WCAG contrast.
 * Keep the pre-paint script in src/layouts/Base.astro in sync with STORAGE_KEY and the defaults.
 */

export const THEME_STORAGE_KEY = 'bigsmall:theme';

export type ThemeId = 'daylight' | 'midnight' | 'sakura' | 'neon-noir' | 'hardhat' | 'theorem';

export type ThemeScheme = 'light' | 'dark';

/** baseline: the reference theme · palette: tokens only, no decoration yet · designed: finished */
export type ThemeStatus = 'baseline' | 'palette' | 'designed';

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
    id: 'neon-noir',
    name: 'Neon noir',
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
    'focus',
    'danger',
    'success',
  ],
  type: ['type-display', 'type-body', 'type-numeric'],
  shape: ['shape-sm', 'shape-md', 'shape-lg'],
  elevation: ['elevation-sm', 'elevation-md'],
  motion: ['motion-fast', 'motion-base', 'motion-slow', 'motion-ease'],
} as const;

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
  ['danger', 'canvas', 4.5],
  ['success', 'canvas', 4.5],
  ['accent', 'canvas', 3],
  ['accent', 'surface', 3],
  ['focus', 'canvas', 3],
  ['focus', 'surface', 3],
];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some((t) => t.id === value);
}

/** The theme currently applied to the document. Falls back to the light default. */
export function readCurrentTheme(): ThemeId {
  const current = document.documentElement.dataset['theme'];
  return isThemeId(current) ? current : DEFAULT_LIGHT;
}

/** Apply a theme now and remember it. Storage may be unavailable (private mode); the theme still applies. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset['theme'] = id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}
