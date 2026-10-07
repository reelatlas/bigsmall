/**
 * Every keyboard shortcut the site supports, in one place, for the shortcuts map in the header
 * (components/ShortcutsHelp.astro). A shortcut that is added or changed in code is added or
 * changed here in the same change (docs/UX-SPEC.md §19).
 */

/**
 * A key as shown on a keycap: "Enter", "Esc", "Tab", "Shift", "↑", a letter. "Mod" is the
 * platform's modifier and renders as Ctrl, or ⌘ on Apple devices.
 */
export type Key = string;

export interface Shortcut {
  action: string;
  /** Alternatives; each is the keys pressed together, in order. */
  keys: readonly (readonly Key[])[];
}

export interface ShortcutGroup {
  title: string;
  shortcuts: readonly Shortcut[];
}

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'In a box',
    shortcuts: [
      { action: 'Choose the highlighted suggestion', keys: [['Enter']] },
      { action: 'Move through the suggestions', keys: [['↑'], ['↓']] },
      { action: 'Go back one step', keys: [['Esc']] },
      { action: 'Remove the unit from an empty box', keys: [['Backspace']] },
      { action: 'Go to the other box', keys: [['Tab'], ['Shift', 'Tab']] },
      { action: 'Copy the selected number', keys: [['Mod', 'C']] },
    ],
  },
  {
    title: 'Anywhere in the converter',
    shortcuts: [
      { action: 'Undo', keys: [['Mod', 'Z']] },
      {
        action: 'Redo',
        keys: [
          ['Mod', 'Y'],
          ['Mod', 'Shift', 'Z'],
        ],
      },
    ],
  },
];
