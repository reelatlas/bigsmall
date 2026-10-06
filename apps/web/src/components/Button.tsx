import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends Omit<AriaButtonProps, 'className'> {
  variant?: ButtonVariant;
  className?: string;
}

// Tokens only: every color, radius, and duration here resolves to a theme variable.
const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-medium ' +
  'transition-[background-color,opacity] duration-[var(--motion-fast)] ease-standard ' +
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'data-disabled:opacity-50 data-pressed:opacity-80';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent data-hovered:opacity-90',
  secondary: 'border border-line bg-surface text-ink data-hovered:bg-surface-raised',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
    />
  );
}
