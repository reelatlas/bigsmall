import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { ChevronDownIcon, CopiedIcon, CopyIcon } from '../../components/icons';
import { useCopied } from '../../lib/copied';
import { cx } from '../../lib/recipes';

/**
 * The bar over the list: it stays at the window's top while the list scrolls past, so Hide all is
 * always at hand (Sean, 2026-10-16). Square and opaque across the list's width, as a bar over
 * scrolling content must be (docs/LEARNINGS.md, "A sticky bar with rounded corners shows what
 * scrolls under it"); its rule is the list's top edge.
 */
const BAR =
  'sticky top-0 z-10 mt-4 flex flex-wrap items-center justify-center gap-1 border-b border-line bg-canvas py-1';

/**
 * The formulas' two tools (docs/UX-SPEC.md §1, "About"): Show all opens every category, and Hide
 * all, in its place once all are open, closes them, a disclosure with the categories' own chevron
 * rather than a button's box (Sean, 2026-10-16); Copy all puts every formula on the clipboard as
 * plain text, ready to paste to a checker. Both act on the list the page drew (Formulas.astro),
 * reading its text from the page, so nothing of it ships in this script.
 */
export function FormulasTools({ listId, heading }: { listId: string; heading: string }) {
  const [allOpen, setAllOpen] = useState(false);
  const { copied, copy, pointerProps } = useCopied<'all'>();
  const groups = () => [
    ...(document.getElementById(listId)?.querySelectorAll<HTMLDetailsElement>('details') ?? []),
  ];

  // A category opened or closed on its own keeps the disclosure's word true. `toggle` does not
  // bubble, so the list hears it on the way down.
  useEffect(() => {
    const list = document.getElementById(listId);
    if (!list) return;
    const sync = () => setAllOpen(groups().every((group) => group.open));
    list.addEventListener('toggle', sync, true);
    return () => list.removeEventListener('toggle', sync, true);
  });

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
    <div className={BAR}>
      <Button
        variant="ghost"
        aria-controls={listId}
        aria-expanded={allOpen}
        onClick={() => {
          const open = !allOpen;
          for (const group of groups()) group.open = open;
          setAllOpen(open);
        }}
      >
        {/* Turned as a closed category's is, down once every one is open. */}
        <ChevronDownIcon
          width="16"
          height="16"
          className={cx('shrink-0 transition-transform', !allOpen && '-rotate-90')}
        />
        {allOpen ? 'Hide all' : 'Show all'}
      </Button>
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
