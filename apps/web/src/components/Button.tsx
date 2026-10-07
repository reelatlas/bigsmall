import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * ghost: icon actions on the page (swap, undo, copy). secondary: bordered text button. soft: a
   * tinted key that sets itself apart from its neighbors (the calculator's operators). primary: filled.
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
  /** Sits inside a field, so its corners nest inside the field's corners (docs/DESIGN-SYSTEM.md, "Fields"). */
  nested?: boolean;
}

// Native <button>: accessible by default, no runtime. Tokens only: every color, radius, and
// duration here resolves to a theme variable. Keyboard focus shows the base focus ring.
const base =
  'inline-flex min-h-11 items-center justify-center gap-2 font-medium transition-[background-color,color,opacity] ' +
  'disabled:opacity-50 active:opacity-80';

// Secondary buttons share the fields' two-pixel edge, so every bordered control has one weight.
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border-2 border-edge bg-surface text-ink hover:bg-surface-raised',
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
  const radius = nested ? 'rounded-nested' : 'rounded-md';
  return (
    <button
      type={type}
      {...props}
      className={[base, radius, on ? ON : variants[variant], shape, className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
