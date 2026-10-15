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

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
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

export function KeyboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

/**
 * The check that stands in for a copy or send button's icon once it has done its job, in the
 * success color every theme keeps at 3:1 on the surface (docs/DESIGN-SYSTEM.md, "Icon buttons").
 * On a filled button, where that color would not show, use CheckIcon in the button's own ink.
 */
export function CopiedIcon(props: IconProps) {
  return <CheckIcon className="text-success" data-copied {...props} />;
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* Two rounded links overlapping on a diagonal. */}
      <g transform="rotate(-45 12 12)">
        <rect x="2" y="9" width="12" height="6" rx="3" />
        <rect x="10" y="9" width="12" height="6" rx="3" />
      </g>
    </Icon>
  );
}

export function CalculatorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <path d="M8.5 6.5h7v3h-7z" />
      <path d="M9 13.5h.01M12 13.5h.01M15 13.5h.01M9 17h.01M12 17h.01M15 17h.01" />
    </Icon>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* Three lines, each shorter: fewer shown, Settings' Units (Sean, 2026-10-15). */}
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Icon>
  );
}

export function FractionIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* ¾ on a diagonal, its digits drawn as strokes: how values are written, Settings' Display
          (Sean, 2026-10-15). */}
      <path d="M3.7 3H7.9L5.7 5.8A2.2 2.2 0 1 1 3.5 9.2" />
      <path d="M17.5 4L6.5 20" />
      <path d="M17.4 20.5V13.5L14 18.2H18.8" />
    </Icon>
  );
}

export function BackspaceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6.5-7z" />
      <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
    </Icon>
  );
}
