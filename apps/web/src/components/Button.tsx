import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** ghost: icon actions on the page (swap, undo, copy). secondary: bordered text button. primary: filled. */
  variant: ButtonVariant;
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
  secondary: 'border-2 border-line bg-surface text-ink hover:bg-surface-raised',
  ghost: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

export function Button({
  variant,
  square = false,
  nested = false,
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
      className={[base, radius, variants[variant], shape, className].filter(Boolean).join(' ')}
    />
  );
}
