/**
 * The keyboard shortcuts shown in the header's shortcuts map (components/ShortcutsHelp.astro).
 * A shortcut added or changed in code changes here in the same change (docs/UX-SPEC.md §10).
 */

/**
 * A key as shown on a keycap: "Enter", "Esc", "Shift", "↑", a letter, a range ("0–9"). "Mod" is
 * the platform's modifier and renders as Ctrl, or ⌘ on Apple devices; "Alt" renders as ⌥ there.
 */
export type Key = string;

export interface Shortcut {
  action: string;
  /** Alternatives, shown separated by "or"; each is the keys pressed together, in order. */
  keys: readonly (readonly Key[])[];
}

// In the order people use them (docs/UX-SPEC.md §10). Tab, Home and End in a toolbar, Backspace
// on an empty box, and Ctrl+C, which everyone knows, work too but are left out to keep it short.
// Letters in lowercase, as most unit symbols are written.
export const SHORTCUTS: readonly Shortcut[] = [
  { action: 'Type from anywhere', keys: [['0–9'], ['a–z']] },
  { action: 'Pick a unit or value', keys: [['Enter']] },
  { action: 'Step back or clear', keys: [['Esc']] },
  // Each pair of arrows shares one group so they sit side by side with nothing between them.
  { action: 'Move up and down page', keys: [['↑', '↓']] },
  { action: 'Move across a toolbar', keys: [['←', '→']] },
  { action: 'Open calculator', keys: [['Alt', 'C']] },
  { action: 'Undo', keys: [['Mod', 'Z']] },
  {
    action: 'Redo',
    keys: [
      ['Mod', 'Y'],
      ['Mod', 'Shift', 'Z'],
    ],
  },
];
