import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { ChevronDownIcon, CopiedIcon, CopyIcon } from '../../components/icons';
import { useCopied } from '../../lib/copied';
import { cx, DISCLOSURE } from '../../lib/recipes';

/**
 * The bar over the list: it stays at the window's top while the list scrolls past, so Hide all is
 * always at hand (Sean, 2026-10-16), its tools on the list's left edge, Show all's chevron over the
 * categories' own. Square and opaque across the list's width, as a bar over scrolling content
 * must be (docs/LEARNINGS.md, "A sticky bar with rounded corners shows what scrolls under it");
 * its rule is the list's top edge.
 */
const BAR =
  'sticky top-0 z-10 mt-4 flex flex-wrap items-center gap-1 border-b border-line bg-canvas py-1';

/** Show all, a disclosure over the categories in their look: muted, the ink under the pointer. */
const SHOW_ALL = cx(DISCLOSURE, 'font-medium text-ink-muted transition-colors hover:text-ink');

/**
 * Runs a change to the list, keeping `anchor` where it sat on the screen: the category being read
 * stays put as others open or close above it, and one closed from under the bar stays there
 * rather than the page jumping on past it. WebKit has no scroll anchoring (docs/LEARNINGS.md,
 * "Safari scrolls to the top as a list is swapped").
 */
function keeping(anchor: Element | null | undefined, change: () => void) {
  const was = anchor?.getBoundingClientRect().top;
  change();
  if (!anchor || was === undefined) return;
  const moved = anchor.getBoundingClientRect().top - was;
  if (Math.abs(moved) >= 1) window.scrollBy(0, moved);
}

/** The categories of the list the page drew, by its id. */
function groupsOf(listId: string): HTMLDetailsElement[] {
  return [
    ...(document.getElementById(listId)?.querySelectorAll<HTMLDetailsElement>('details') ?? []),
  ];
}

/**
 * The formulas' two tools (docs/UX-SPEC.md §1, "About"): Show all opens every category, and Hide
 * all, in its place once all are open, closes them, a disclosure with the categories' own chevron
 * rather than a button's box (Sean, 2026-10-16); Copy all puts every formula on the clipboard as
 * plain text, ready to paste to a checker. Both act on the list the page drew (Formulas.astro),
 * reading its text from the page, so nothing of it ships in this script. It also keeps each
 * category's name under the bar while its units scroll past.
 */
export function FormulasTools({ listId, heading }: { listId: string; heading: string }) {
  const [allOpen, setAllOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const { copied, copy, pointerProps } = useCopied<'all'>();
  const groups = () => groupsOf(listId);
  /** The category being read: the first that ends below the bar. */
  const reading = () => {
    const line = barRef.current?.getBoundingClientRect().bottom ?? 0;
    return groups().find((group) => group.getBoundingClientRect().bottom > line);
  };

  // Each category's name stays under the bar while its units scroll past, until the next one's
  // takes its place (Sean, 2026-10-16): the summaries stick at the bar's height, measured, so a bar
  // that wraps in a narrow window still clears them. Until this runs they scroll as any row.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const stick = () => {
      for (const group of groupsOf(listId)) {
        const summary = group.querySelector('summary');
        if (summary) summary.style.top = `${bar.offsetHeight}px`;
      }
    };
    stick();
    const resizes = new ResizeObserver(stick);
    resizes.observe(bar);
    return () => resizes.disconnect();
  }, [listId]);

  // A category opened or closed on its own stays where it is on the screen, and keeps the
  // disclosure's word true. `toggle` does not bubble, so the list hears it on the way down.
  useEffect(() => {
    const element = document.getElementById(listId);
    if (!element) return;
    const sync = () => setAllOpen(groupsOf(listId).every((group) => group.open));
    // Enter and Space on a summary click it too.
    const onClick = (event: MouseEvent) => {
      const summary = (event.target as Element).closest('summary');
      const group = summary?.parentElement;
      if (!(group instanceof HTMLDetailsElement)) return;
      event.preventDefault();
      keeping(summary, () => {
        group.open = !group.open;
      });
    };
    element.addEventListener('toggle', sync, true);
    element.addEventListener('click', onClick);
    return () => {
      element.removeEventListener('toggle', sync, true);
      element.removeEventListener('click', onClick);
    };
  }, [listId]);

  const text = () =>
    [
      heading,
      ...groups().map((group) =>
        [
          group.dataset['plain'],
          ...[...group.querySelectorAll<HTMLElement>('li[data-plain]')].map(
            (line) => `- ${line.dataset['plain']}`,
          ),
        ].join('\n'),
      ),
    ].join('\n\n');

  return (
    <div ref={barRef} className={BAR}>
      <button
        type="button"
        aria-controls={listId}
        aria-expanded={allOpen}
        onClick={() => {
          const open = !allOpen;
          keeping(reading()?.querySelector('summary'), () => {
            for (const group of groups()) group.open = open;
          });
          setAllOpen(open);
        }}
        className={SHOW_ALL}
      >
        {/* Turned as a closed category's is, down once every one is open. */}
        <ChevronDownIcon
          width="16"
          height="16"
          className={cx('shrink-0 transition-transform', !allOpen && '-rotate-90')}
        />
        {allOpen ? 'Hide all' : 'Show all'}
      </button>
      <Button variant="ghost" onClick={() => void copy(text(), 'all')} {...pointerProps('all')}>
        {copied === 'all' ? <CopiedIcon /> : <CopyIcon />}
        {copied === 'all' ? 'Copied' : 'Copy all as text'}
      </Button>
      <p role="status" className="sr-only">
        {copied === 'all' ? 'Copied every formula as text.' : ''}
      </p>
    </div>
  );
}
