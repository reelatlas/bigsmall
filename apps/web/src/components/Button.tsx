import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Square 44 px button for a lone icon. Pass `aria-label`. */
  square?: boolean;
}

// Native <button>: accessible by default, no runtime. Tokens only: every color, radius, and
// duration here resolves to a theme variable.
const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md font-medium ' +
  'transition-[background-color,opacity] duration-[var(--motion-fast)] ease-standard ' +
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:opacity-50 active:opacity-80';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-raised',
  ghost: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

export function Button({
  variant = 'primary',
  square = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const shape = square ? 'size-11 shrink-0' : 'px-4';
  return (
    <button
      type={type}
      {...props}
      className={[base, variants[variant], shape, className].filter(Boolean).join(' ')}
    />
  );
}
