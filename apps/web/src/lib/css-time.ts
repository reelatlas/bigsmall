/**
 * A time token read from CSS, in milliseconds, for an animation started from script (glide.ts,
 * flash.ts): "400ms" as written in the theme, or ".4s" as the build's minifier rewrites it, so the
 * unit is read, never assumed (docs/LEARNINGS.md, "The build writes 400ms as .4s"). 0 when the
 * value is missing or not a time.
 */
export function cssTime(value: string): number {
  const match = /^\s*([+-]?(?:\d+\.?\d*|\.\d+))(ms|s)\s*$/i.exec(value);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2]!.toLowerCase() === 's' ? amount * 1000 : amount;
}
