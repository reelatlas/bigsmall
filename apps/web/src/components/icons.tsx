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

/**
 * Clear the text: a × in a circle, the field's own clear (docs/UX-SPEC.md §1), drawn apart from the
 * chip's plain × so each reads as its own.
 */
export function ClearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
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

export function ListArrowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* A list with an arrow up and down beside it: what shows, and in what order, Settings'
          Units (Sean, 2026-10-15, from the icon lab; narrowing lines before). */}
      <path d="M6 4v16M3.5 6.5L6 4l2.5 2.5M3.5 17.5L6 20l2.5-2.5" />
      <path d="M12 6h9M12 12h9M12 18h9" />
    </Icon>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* Six dots in two columns: a handle to drag a row by. */}
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth="3" />
    </Icon>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* A ruler on a diagonal, its marks long and short: how values are measured and written,
          Settings' Display (Sean, 2026-10-15). */}
      <g transform="rotate(-45 12 12)">
        <rect x="1.5" y="8" width="21" height="8" rx="1.5" />
        <path d="M5.5 8v3M9 8v4M12.5 8v3M16 8v4M19.5 8v3" />
      </g>
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

/** Pause: two bars, the sketchbook's tiles held from changing by themselves. */
export function PauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6v12M15 6v12" />
    </Icon>
  );
}

/** Play: a triangle pointing on, the tiles changing by themselves again. */
export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5v13l10.5-6.5z" />
    </Icon>
  );
}

/** More: three dots in a row, the tools a toolbar's row has no room for behind them (MoreMenu). */
export function MoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </Icon>
  );
}
