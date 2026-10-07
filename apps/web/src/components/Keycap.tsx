/**
 * One key as printed on a keyboard, for shortcut maps and hints. The key comes in as a prop, not
 * children: Astro hands children to a React component as rendered markup, so a "Mod" child would
 * never be recognized. "Mod" reads Ctrl, or ⌘ on Apple devices (the inline script swaps it).
 */
export function Keycap({ label }: { label: string }) {
  return (
    <kbd className="min-w-6 rounded-sm border border-line bg-surface-raised px-1.5 py-0.5 text-center font-numeric text-xs text-ink">
      {label === 'Mod' ? <span data-mod-key>Ctrl</span> : label}
    </kbd>
  );
}
