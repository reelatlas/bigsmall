/**
 * The keyboard shortcuts shown in the header's shortcuts map (components/ShortcutsHelp.astro).
 * A shortcut added or changed in code changes here in the same change (docs/UX-SPEC.md §19).
 */

/**
 * A key as shown on a keycap: "Enter", "Esc", "Tab", "Shift", "↑", a letter. "Mod" is the
 * platform's modifier and renders as Ctrl, or ⌘ on Apple devices.
 */
export type Key = string;

export interface Shortcut {
  action: string;
  /** Alternatives, shown separated by "or"; each is the keys pressed together, in order. */
  keys: readonly (readonly Key[])[];
}

export const SHORTCUTS: readonly Shortcut[] = [
  { action: 'Confirm input or selection', keys: [['Enter']] },
  // The two arrows share one group so they sit side by side with nothing between them.
  { action: 'Move through menu', keys: [['↑', '↓']] },
  { action: 'Back one step', keys: [['Esc']] },
  { action: 'Toggle boxes', keys: [['Tab'], ['Shift', 'Tab']] },
  { action: 'Undo', keys: [['Mod', 'Z']] },
  {
    action: 'Redo',
    keys: [
      ['Mod', 'Y'],
      ['Mod', 'Shift', 'Z'],
    ],
  },
];
