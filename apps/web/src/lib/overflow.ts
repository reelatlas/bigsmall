/**
 * How many of a toolbar's tools fit on its one row (docs/UX-SPEC.md §1, ADR 0023): the leading
 * control that always shows (the category menu), then the tools in order, each with its measured
 * width, a gap between every two things on the row, a divider before one tool, and a More trigger
 * at the end whenever a tool is left out. Pure; the layout measures, this decides, in pixels.
 */
export interface FitInput {
  /** The row's width. */
  room: number;
  /** The width of what always shows at the row's start (the category menu). */
  fixed: number;
  /** Each tool's width, in the order they show; the ones left out are the tail. */
  widths: readonly number[];
  /** The gap between any two things on the row. */
  gap: number;
  /** A divider's width, and the index of the tool it sits before; none without one. */
  divider?: { before: number; width: number };
  /** The More trigger's width, on the row only while a tool is left out. */
  more: number;
}

/** What the row needs to show its first `count` tools, with More after them if any are left out. */
export function roomFor({ fixed, widths, gap, divider, more }: FitInput, count: number): number {
  const shown = widths.slice(0, count);
  const things = [fixed, ...shown];
  if (divider && divider.before < count) things.push(divider.width);
  if (count < widths.length) things.push(more);
  return things.reduce((sum, width) => sum + width, 0) + gap * (things.length - 1);
}

/** The most tools, from the first, the row has room for: all of them, or fewer and More. */
export function fitTools(input: FitInput): number {
  for (let count = input.widths.length; count > 0; count--) {
    if (roomFor(input, count) <= input.room) return count;
  }
  return 0;
}
