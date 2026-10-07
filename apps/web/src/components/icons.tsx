import type { SVGProps } from 'react';

// Small inline icons, drawn for this project. Decorative by default (aria-hidden); the surrounding
// control carries the label.

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h13M13 3l4 4-4 4" />
      <path d="M20 17H7M11 13l-4 4 4 4" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </Icon>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H10a6 6 0 0 0 0 12h3" />
    </Icon>
  );
}

export function EraserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 15.5L12.5 7a2 2 0 0 1 2.8 0l3.7 3.7a2 2 0 0 1 0 2.8L13 19.5H8z" />
      <path d="M9 10.5l5.5 5.5" />
      <path d="M13 19.5h7" />
    </Icon>
  );
}
