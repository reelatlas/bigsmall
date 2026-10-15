import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../lib/recipes';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'soft' | 'ghost';

// className is a plain string, as in React: Preact's own typing also allows a signal there.
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  className?: string | undefined;
  /**
   * ghost: icon actions on the page (undo, copy, clear all). secondary: bordered text button.
   * tonal: a bordered button on the raised surface in muted ink, a quieter sibling of secondary
   * (the calculator's C, ⌫, E, and decimal mark). soft: a tinted key that sets itself apart from
   * its neighbors (the calculator's operators). primary: filled.
   */
  variant: ButtonVariant;
  /**
   * A ghost button switched on: the panel it opens is open, or the mode it sets is active (the
   * calculator icon). Pair it with `aria-expanded` or `aria-pressed`, which say the same thing to
   * assistive technology.
   */
  on?: boolean;
  /** Square 44 px button for a lone icon. Pass `aria-label`. */
  square?: boolean;
  /**
   * Sits inside a shell, so its corners nest inside the shell's (docs/DESIGN-SYSTEM.md, "Corners"):
   * true inside a field or its list (`rounded-nested`), `md` inside a menu or a setting's row
   * (`rounded-nested-md`).
   */
  nested?: boolean | 'md';
}

// Native <button>: accessible by default, no runtime. Tokens only: every color, radius, and
// duration here resolves to a theme variable. Keyboard focus shows the base focus ring.
// `disabled` drops a button out of the Tab order; `aria-disabled` looks the same but keeps it a
// stop, for a set of stops that should not change shape (the calculator's send buttons), and
// its click handler must then do nothing.
const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 font-medium transition-[background-color,color,opacity] ' +
  'disabled:opacity-50 aria-disabled:opacity-50 active:opacity-80';

// Secondary buttons share the fields' two-pixel edge, so every bordered control has one weight.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border-2 border-edge bg-surface text-ink hover:bg-surface-raised',
  tonal: 'border-2 border-edge bg-surface-raised text-ink-muted hover:text-ink',
  soft: 'bg-accent-soft text-ink hover:opacity-90',
  ghost: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

// Switched on replaces the variant's look, hover included, so on never flickers back to off.
const ON = 'bg-accent-soft text-ink';

export function Button({
  variant,
  square = false,
  nested = false,
  on = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const shape = square ? 'size-11 shrink-0' : 'px-4';
  const radius = nested === 'md' ? 'rounded-nested-md' : nested ? 'rounded-nested' : 'rounded-md';
  return (
    <button
      type={type}
      {...props}
      className={cx(BASE, radius, on ? ON : VARIANTS[variant], shape, className)}
    />
  );
}
