import type { HTMLAttributes } from 'react';

/**
 * A thin vertical rule between groups of icon buttons in a toolbar. Decorative; the toolbar's row
 * marks its own (`data-divider`) to measure it with the tools (TableLayout).
 */
export function ToolbarDivider(props: HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden="true" {...props} className="mx-1 h-6 border-l border-line" />;
}
