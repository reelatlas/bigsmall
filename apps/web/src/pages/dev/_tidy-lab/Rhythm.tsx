import { Fragment, useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { CalculatorIcon, ChevronDownIcon, ListArrowIcon } from '../../../components/icons';
import { useRefit } from '../../../lib/fit-step';
import {
  CURSOR_ROW,
  cx,
  FIELD_ROW,
  LIST_CARD,
  SECTION_HEADING,
  unitSymbol,
  WORDMARK_FACE,
} from '../../../lib/recipes';
import { INTRO } from '../../../lib/site';
import { FIELD, HEADING, SELECT } from '../_lab/controls';

/*
 * The About page's vertical rhythm with every gap named and measured, the converter page's beside
 * it, and a proposal: one section step for About's two section gaps, a multiple of the page's
 * frame as the frame is a multiple of the spacing unit (the tidy's call 8; Sean, 2026-10-18: "a
 * lite lab that highlights the token and padding and measurements"). Each stack draws the page's
 * parts at their own heights and its gaps as bands, each band as tall as the page's class makes
 * the gap (the same spacing token through `h-` as through `mt-`), labelled with that class and
 * the band's measured height at this window's width.
 */

interface Gap {
  kind: 'gap';
  id: string;
  /** The page's class, as written where the gap is set. */
  page: string;
  /** The band's height, the same token through `h-`. */
  band: string;
}

interface Block {
  kind: 'block';
  id: string;
  label: string;
  node: ReactNode;
}

type Part = Gap | Block;

/** One section step for About's two section gaps, as a multiple of the frame (16 px, 24 from sm). */
const STEPS = {
  2: { page: 'mt-8 sm:mt-12', band: 'h-8 sm:h-12', name: '2 × the frame: 32 px, 48 from sm' },
  3: { page: 'mt-12 sm:mt-18', band: 'h-12 sm:h-18', name: '3 × the frame: 48 px, 72 from sm' },
  4: { page: 'mt-16 sm:mt-24', band: 'h-16 sm:h-24', name: '4 × the frame: 64 px, 96 from sm' },
} as const;
type Step = keyof typeof STEPS;
/** About's two section gaps as the page sets them today (about.astro). */
const TODAY: SectionGaps = {
  heading: { page: 'mt-12 sm:mt-20', band: 'h-12 sm:h-20' },
  tabs: { page: 'mt-16 sm:mt-24', band: 'h-16 sm:h-24' },
};
const STEP_KEYS = [2, 3, 4] as const satisfies readonly Step[];

const header: Block = {
  kind: 'block',
  id: 'header',
  label: 'the header’s row',
  node: (
    <div className="flex h-12 items-center">
      <span className={cx(WORDMARK_FACE, 'text-3xl')}>bigsmall</span>
    </div>
  ),
};
const frameTop: Gap = {
  kind: 'gap',
  id: 'frame-top',
  page: 'py-frame',
  band: 'h-frame',
};
const frameBottom: Gap = {
  kind: 'gap',
  id: 'frame-bottom',
  page: 'pb-frame',
  band: 'h-frame',
};
interface SectionGaps {
  /** The gap over the sketchbook's heading. */
  heading: { page: string; band: string };
  /** The gap over the tabs. */
  tabs: { page: string; band: string };
}

function aboutParts({ heading, tabs }: SectionGaps): readonly Part[] {
  return [
    frameTop,
    header,
    { kind: 'gap', id: 'to-sketchbook', page: heading.page, band: heading.band },
    {
      kind: 'block',
      id: 'sketchbook-heading',
      label: 'the section’s heading',
      node: <p className={cx(SECTION_HEADING, 'text-center')}>The sketchbook</p>,
    },
    { kind: 'gap', id: 'under-heading', page: 'mb-6', band: 'h-6' },
    {
      kind: 'block',
      id: 'tiles',
      label: 'the sketchbook',
      node: (
        <div className="grid grid-cols-3 gap-6">
          <div className="aspect-square rounded-md border border-line bg-surface" />
          <div className="aspect-square rounded-md border border-line bg-surface" />
          <div className="aspect-square rounded-md border border-line bg-surface" />
        </div>
      ),
    },
    { kind: 'gap', id: 'to-tabs', page: tabs.page, band: tabs.band },
    {
      kind: 'block',
      id: 'tabs',
      label: 'the tabs’ row',
      node: (
        <div className="flex flex-wrap gap-x-6 font-medium">
          <span className="relative flex min-h-11 items-center px-1 text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent">
            Feedback
          </span>
          <span className="flex min-h-11 items-center px-1 text-ink-muted">Every formula</span>
        </div>
      ),
    },
    { kind: 'gap', id: 'panel-top', page: 'pt-6', band: 'h-6' },
    {
      kind: 'block',
      id: 'panel',
      label: 'the tab’s panel',
      node: (
        <div className="grid gap-2">
          <div className="h-3 w-3/4 rounded-sm bg-surface-raised" />
          <div className="h-3 rounded-sm bg-surface-raised" />
          <div className="h-3 w-1/2 rounded-sm bg-surface-raised" />
        </div>
      ),
    },
    {
      kind: 'block',
      id: 'foot',
      label: 'the privacy line',
      node: (
        <p className="text-sm text-ink-muted">
          Visits are counted anonymously without cookies by Umami.
        </p>
      ),
    },
    frameBottom,
  ];
}

const CONVERTER: readonly Part[] = [
  frameTop,
  header,
  { kind: 'gap', id: 'to-intro', page: 'mt-6', band: 'h-6' },
  {
    kind: 'block',
    id: 'intro',
    label: 'the intro',
    node: <p className="text-sm text-ink-muted">{INTRO}</p>,
  },
  { kind: 'gap', id: 'to-toolbar', page: 'mb-2', band: 'h-2' },
  {
    kind: 'block',
    id: 'toolbar',
    label: 'the toolbar’s row',
    node: (
      <div className="flex h-12 items-center gap-1 text-ink-muted">
        <span className="inline-flex h-11 items-center gap-2 px-3 text-sm text-ink">
          Length
          <ChevronDownIcon width="16" height="16" className="text-ink-muted" />
        </span>
        <span className="inline-flex size-11 items-center justify-center">
          <CalculatorIcon />
        </span>
        <span className="inline-flex size-11 items-center justify-center">
          <ListArrowIcon />
        </span>
      </div>
    ),
  },
  { kind: 'gap', id: 'to-box', page: 'mb-2', band: 'h-2' },
  {
    kind: 'block',
    id: 'box',
    label: 'the box',
    node: (
      <div className={cx('rounded-lg border-2 border-edge bg-surface', FIELD_ROW)}>
        <span className="font-numeric text-2xl sm:text-3xl">1</span>
        <span className="ml-auto inline-flex min-h-11 items-center rounded-nested bg-accent-soft px-3 text-sm">
          <span className={unitSymbol()}>mi</span>
        </span>
      </div>
    ),
  },
  { kind: 'gap', id: 'to-rows', page: 'mt-2', band: 'h-2' },
  {
    kind: 'block',
    id: 'rows',
    label: 'the table',
    node: (
      <ol className={cx(LIST_CARD, 'p-2')}>
        {[
          ['km', '1.61'],
          ['m', '1,609.34'],
          ['ft', '5,280'],
        ].map(([symbol, value]) => (
          <li key={symbol} className={cx(CURSOR_ROW, 'flex items-center')}>
            <span className={unitSymbol()}>{symbol}</span>
            <span className="ml-auto font-numeric">{value}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    kind: 'block',
    id: 'foot',
    label: 'the About link',
    node: <p className="text-sm text-ink-muted">About</p>,
  },
  frameBottom,
];

/** A page's parts down the column, each gap a band, every row labelled at its right. */
function Stack({
  title,
  id,
  parts,
  children,
}: {
  title: string;
  id: string;
  parts: readonly Part[];
  children?: ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="min-w-0" data-stack={id}>
      <h3 id={headingId} className={HEADING}>
        {title}
      </h3>
      {children}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_--spacing(36)] items-center gap-x-3">
        {parts.map((part) =>
          part.kind === 'gap' ? (
            <Fragment key={part.id}>
              <div
                className={cx('rounded-sm bg-accent-soft', part.band)}
                data-gap={`${id}:${part.id}`}
              />
              <p className="text-xs text-ink-muted">
                <code className="font-numeric">{part.page}</code>{' '}
                <output className="font-numeric text-ink" data-px={`${id}:${part.id}`} />
              </p>
            </Fragment>
          ) : (
            <Fragment key={part.id}>
              <div className="min-w-0">{part.node}</div>
              <p className="text-xs text-ink-muted">{part.label}</p>
            </Fragment>
          ),
        )}
      </div>
    </section>
  );
}

export function Rhythm() {
  const [step, setStep] = useState<Step>(3);
  const rootRef = useRef<HTMLDivElement>(null);
  const stepId = useId();

  // Every band's height, read and written beside it, before paint and again as the width changes.
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const band of root.querySelectorAll<HTMLElement>('[data-gap]')) {
      const key = band.dataset['gap'];
      const out = root.querySelector<HTMLElement>(`[data-px="${key}"]`);
      if (out) out.textContent = `${Math.round(band.getBoundingClientRect().height)} px`;
    }
  }, []);
  useRefit(measure, rootRef);

  return (
    <div ref={rootRef}>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        Each stack is a page down its column: its parts at their own heights, its gaps as tinted
        bands, each band as tall as the page’s class makes the gap, named by that class and measured
        at this window’s width. About today sets its two section gaps apart (
        <code className="font-numeric">mt-12 sm:mt-20</code> to the sketchbook’s heading,{' '}
        <code className="font-numeric">mt-16 sm:mt-24</code> to the tabs), while the heading’s{' '}
        <code className="font-numeric">mb-6</code> and the panel’s{' '}
        <code className="font-numeric">pt-6</code> are the desktop frame’s 24 px. The proposal gives
        both section gaps one step, a multiple of the frame, which would be one token (
        <code className="font-numeric">--spacing-section</code>, bridged like the frame) in place of
        four numbers. Resize the window past 640 px to see each step change. The footer follows the
        content, or sits at the window’s bottom on a short page, so no gap is drawn before it.
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <Stack title="About today" id="about" parts={aboutParts(TODAY)} />
        <Stack
          title="About, one section step"
          id="proposal"
          parts={aboutParts({ heading: STEPS[step], tabs: STEPS[step] })}
        >
          <label className={cx(FIELD, 'mt-3')} htmlFor={stepId}>
            <span className="font-medium">Section step</span>
            <select
              id={stepId}
              className={SELECT}
              value={step}
              onChange={(event) => setStep(Number(event.currentTarget.value) as Step)}
            >
              {STEP_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STEPS[key].name}
                </option>
              ))}
            </select>
          </label>
        </Stack>
        <Stack title="The converter page" id="converter" parts={CONVERTER} />
      </div>
    </div>
  );
}
