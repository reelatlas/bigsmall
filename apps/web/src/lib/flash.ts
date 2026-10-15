/**
 * A flash of the accent's soft tint that fades back to the element's own fill
 * (docs/DESIGN-SYSTEM.md, "Motion"; Sean, 2026-10-15): what just arrived, as a unit shown or
 * hidden, or the count that just took one. Its length is the theme's --highlight-fade, in ms: the
 * tint holds for its first fifth, so it is seen landing, then fades on the theme's even
 * --motion-glide. A fade of color with no movement, so reduced motion keeps it.
 */
export function flash(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || typeof element.animate !== 'function') return;
  const style = getComputedStyle(element);
  const duration = Number.parseFloat(style.getPropertyValue('--highlight-fade'));
  if (!duration) return;
  const tint = style.getPropertyValue('--accent-soft');
  element.animate(
    [
      { backgroundColor: tint, offset: 0 },
      { backgroundColor: tint, offset: 0.2, easing: style.getPropertyValue('--motion-glide') },
    ],
    { duration },
  );
}
