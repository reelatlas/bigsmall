/**
 * A flash of the accent's soft tint that fades back to the element's own fill
 * (docs/DESIGN-SYSTEM.md, "Motion"; Sean, 2026-10-15): what just arrived, as a unit shown or
 * hidden, or the count that just took one. Its length is the theme's --highlight-fade, in ms. A
 * fade of color with no movement, so reduced motion keeps it.
 */
export function flash(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || typeof element.animate !== 'function') return;
  const style = getComputedStyle(element);
  const duration = Number.parseFloat(style.getPropertyValue('--highlight-fade'));
  if (!duration) return;
  element.animate([{ backgroundColor: style.getPropertyValue('--accent-soft'), offset: 0 }], {
    duration,
    easing: style.getPropertyValue('--motion-ease'),
  });
}
