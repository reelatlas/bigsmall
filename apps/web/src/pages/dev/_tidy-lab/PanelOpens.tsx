import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../../components/Button';
import {
  CalculatorIcon,
  ChevronDownIcon,
  EraserIcon,
  ListArrowIcon,
  RedoIcon,
  UndoIcon,
} from '../../../components/icons';
import { SidePanel } from '../../../components/SidePanel';
import { SHOW_PRESETS } from '../../../features/converter/settings';
import { useRefit } from '../../../lib/fit-step';
import {
  CONTENT_COLUMN,
  CONVERTER_GRID,
  CURSOR_ROW,
  cx,
  FIELD_ROW,
  GROUP_TITLE,
  LIST_CARD,
  unitSymbol,
  WORDMARK_FACE,
} from '../../../lib/recipes';
import { INTRO } from '../../../lib/site';
import { HEADING } from '../_lab/controls';

/*
 * How a side panel opens beside the box on a wide screen, three ways (the eighty-fifth pass in
 * docs/research/findings-0-first-pass.md; Sean, 2026-10-18: "a lite lab to show me examples of
 * what this might look like"). Each way is a stage as wide as the page's column holding a stand-in
 * for the converter page, with its own Units tool opening a stand-in for the Units panel, and a
 * line under it reading where the column went, measured. The stand-ins take the page's own
 * recipes, so every size is the page's: the content column, the header's row, the box's row, the
 * rows' card, the panel's card and its width. Below md every way stacks the panel between the box
 * and the rows, as the page does.
 */

type Way = 'pair' | 'margin' | 'drawer';

interface Option {
  id: Way;
  name: string;
  /** What happens as the panel opens. */
  rule: string;
  /** How it is built, or would be. */
  built: string;
}

const OPTIONS: readonly Option[] = [
  {
    id: 'pair',
    name: 'The pair re-centers',
    rule: 'The column and the panel center together: as the panel opens the column slides left by half the panel and its step, and slides back as it closes. The box keeps its width wherever both fit, and gives way where they do not.',
    built:
      'As built (7afec73): the page is one grid of the column and the panel’s track, centered (CONVERTER_GRID), the panel carrying the 16 px step as its own margin, so an empty track is no width.',
  },
  {
    id: 'margin',
    name: 'The margin first',
    rule: 'The panel takes the page’s free margin beside the column, past the page column into the window’s, and the column slides left only by what the panel still lacks: nothing in a wide window, more as the window narrows, until it slides as far as the pair does.',
    built:
      'Would be one max(min()) margin on the column, and the panel allowed outside the page column, so the page column stops being the page’s bound: the box would narrow by the window, not by the column.',
  },
  {
    id: 'drawer',
    name: 'A drawer at the window’s edge',
    rule: 'The panel opens at the window’s right edge over the page; nothing in the page moves, and the drawer covers whatever lies under it, the table’s right end in a narrower window.',
    built:
      'Would be a fixed card at the window’s edge, scrolling with the window rather than with the page, so a tall panel scrolls inside itself.',
  },
];

/** A column cell: the content column in the grid's first track, each on its own row. */
const COLUMN_CELL = cx(CONTENT_COLUMN, 'md:col-start-1');
/**
 * The panel's cell, as the page has it (TABLE_SIDE_CELL): on the column between the box and the
 * rows below md, and from md the grid's second track beside the box, 16 px from it by its own
 * margin, 320 px wide, as tall as its card.
 */
const PANEL_CELL = cx(
  CONTENT_COLUMN,
  'my-4 md:col-start-2 md:row-span-2 md:row-start-4 md:mx-0 md:my-0 md:ml-4 md:w-80 md:max-w-none md:self-start',
);
/** The margin-first grid: the page's tracks, packed to the left behind a measured inset. */
const MARGIN_GRID = 'md:grid md:grid-cols-box-and-side md:justify-start';
/** The drawer: a fixed card the frame in from the window's top, right, and bottom, over the page. */
const DRAWER = 'fixed inset-y-frame right-frame z-20 w-80 overflow-y-auto';

/** A tool that does nothing here, drawn as the toolbar draws it. */
function ToolStandIn({ icon }: { icon: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-11 items-center justify-center text-ink-muted"
    >
      {icon}
    </span>
  );
}

const ROWS = [
  { name: 'kilometer', symbol: 'km', value: '1.61' },
  { name: 'meter', symbol: 'm', value: '1,609.34' },
  { name: 'yard', symbol: 'yd', value: '1,760' },
  { name: 'foot', symbol: 'ft', value: '5,280' },
];

/** A stand-in for the Units panel: its card, its title, and a row of the show presets. */
function UnitsStandIn({ onClose }: { onClose: () => void }) {
  return (
    <SidePanel title="Units" onClose={onClose}>
      <p className={GROUP_TITLE}>Show</p>
      <div className="mt-1 flex flex-wrap gap-2" data-strip>
        {SHOW_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={preset.id === 'all' ? 'soft' : 'secondary'}
            aria-pressed={preset.id === 'all'}
          >
            {preset.name}
          </Button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        A stand-in for the Units panel, its card and width as they ship; the real one lists the
        category’s units.
      </p>
    </SidePanel>
  );
}

interface Reading {
  /** The column's left edge from the page column's left edge, in px. */
  left: number;
  /** How far the column slid from where it sits with no panel, in px. */
  slid: number;
  /** The panel's right edge short of the window's frame, in px, while a panel is open beside it. */
  short: number | null;
  /** How much narrower the box is than its full width, in px, where the pair does not fit. */
  narrowed: number;
  /** Whether the page's grid is in effect (from md); below it the panel stacks. */
  grid: boolean;
}

function same(a: Reading | null, b: Reading): boolean {
  return (
    a !== null &&
    a.left === b.left &&
    a.slid === b.slid &&
    a.short === b.short &&
    a.narrowed === b.narrowed &&
    a.grid === b.grid
  );
}

function Stage({ option, index }: { option: Option; index: number }) {
  const [open, setOpen] = useState(false);
  // The margin-first frame: the column's inset from the page column's left edge, and the frame's
  // width while the panel may reach past the page column, both measured.
  const [frame, setFrame] = useState<{ inset: number; width: number | null }>({
    inset: 0,
    width: null,
  });
  const [reading, setReading] = useState<Reading | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unitsId = useId();
  const panelId = useId();
  const headingId = useId();

  const close = () => {
    setOpen(false);
    document.getElementById(unitsId)?.focus();
  };

  const measure = () => {
    const stage = stageRef.current;
    const grid = gridRef.current;
    const column = columnRef.current;
    if (!stage || !grid || !column) return;
    const inGrid = getComputedStyle(grid).display === 'grid';
    const stageBox = stage.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();
    // The column at its full width, as it is with no panel beside it: its cap (max-w-xl), or the
    // stage where that is narrower. A reading from a column a panel has already narrowed would
    // settle on the narrowing.
    const full = Math.min(
      parseFloat(getComputedStyle(column).maxWidth) || columnBox.width,
      stageBox.width,
    );
    const centered = Math.max(0, (stageBox.width - full) / 2);
    const main = stage.closest('main');
    const pageFrame = main ? parseFloat(getComputedStyle(main).paddingRight) || 0 : 0;
    // The window's content edge less the frame: the body's right edge, which the scrollbar's
    // reserved gutter narrows where the root's clientWidth does not (a fixed drawer ends there too).
    const limit = document.body.getBoundingClientRect().right - pageFrame;
    const panel = panelRef.current;
    const need = panel
      ? panel.getBoundingClientRect().width + (parseFloat(getComputedStyle(panel).marginLeft) || 0)
      : 0;
    if (option.id === 'margin') {
      // Centered while the panel fits in the window's margin; otherwise as far left as the panel
      // lacks, up to the column's left edge. The frame reaches to the window's frame while a
      // panel is open, so the pair is bound by the window, not by the page column. Below md
      // the panel stacks and the frame is the column's own.
      const overflow = open ? stageBox.left + centered + full + need - limit : 0;
      const next = inGrid
        ? {
            inset: Math.round(centered - Math.min(centered, Math.max(0, overflow))),
            width: open ? Math.round(limit - stageBox.left) : null,
          }
        : { inset: 0, width: null };
      setFrame((at) => (at.inset === next.inset && at.width === next.width ? at : next));
    }
    const left = Math.round(columnBox.left - stageBox.left);
    const next: Reading = {
      left,
      slid: Math.round(centered) - left,
      narrowed: Math.max(0, Math.round(full - columnBox.width)),
      short:
        open && panel && option.id !== 'drawer' && inGrid
          ? Math.round(limit - panel.getBoundingClientRect().right)
          : null,
      grid: inGrid,
    };
    setReading((at) => (same(at, next) ? at : next));
  };
  // The newest measuring, read through one stable callback, so the observers are set up once.
  const latest = useRef(measure);
  useLayoutEffect(() => {
    latest.current = measure;
  });
  const refit = useCallback(() => latest.current(), []);
  useRefit(refit, stageRef);

  const beside = open && option.id !== 'drawer';
  const grid = option.id === 'margin' ? MARGIN_GRID : CONVERTER_GRID;
  const style =
    option.id === 'margin'
      ? { paddingLeft: frame.inset, width: frame.width ?? undefined }
      : undefined;

  return (
    <section aria-labelledby={headingId} className="mt-8" data-stage={option.id}>
      <h3 id={headingId} className={HEADING}>
        {index + 1}. {option.name}
      </h3>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">{option.rule}</p>
      <p className="mt-1 max-w-prose text-xs text-ink-muted">{option.built}</p>
      {/* The stage: the page column's width, its edges marked, the page's frame top and bottom. */}
      <div
        ref={stageRef}
        className="mt-4 py-frame outline-1 outline-line outline-dashed"
        data-stage-frame
      >
        <div ref={gridRef} className={grid} style={style}>
          <div
            ref={columnRef}
            className={cx(COLUMN_CELL, 'flex h-12 items-center md:row-start-1')}
            data-column
          >
            <span className={cx(WORDMARK_FACE, 'text-3xl')}>bigsmall</span>
            <span className="ml-auto inline-flex h-11 items-center gap-2 px-3 text-sm text-ink-muted">
              Daylight
              <ChevronDownIcon width="16" height="16" />
            </span>
          </div>
          <p className={cx(COLUMN_CELL, 'mt-6 text-sm text-ink-muted md:row-start-2')}>{INTRO}</p>
          <div className={cx(COLUMN_CELL, 'mt-2 flex items-center gap-1 md:row-start-3')}>
            <span className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-ink">
              Length
              <ChevronDownIcon width="16" height="16" className="text-ink-muted" />
            </span>
            <ToolStandIn icon={<CalculatorIcon />} />
            <Button
              variant="ghost"
              id={unitsId}
              on={open}
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              onClick={() => (open ? close() : setOpen(true))}
            >
              <ListArrowIcon />
              Units
            </Button>
            <span className="ml-auto flex items-center gap-1">
              <ToolStandIn icon={<UndoIcon />} />
              <ToolStandIn icon={<RedoIcon />} />
              <ToolStandIn icon={<EraserIcon />} />
            </span>
          </div>
          <div className={cx(COLUMN_CELL, 'mt-2 md:row-start-4')}>
            <div className={cx('rounded-lg border-2 border-edge bg-surface', FIELD_ROW)}>
              <span className="font-numeric text-2xl sm:text-3xl">1</span>
              <span className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-nested bg-accent-soft px-3 text-sm">
                <span className={unitSymbol()}>mi</span>
                <span>mile</span>
              </span>
            </div>
          </div>
          {beside && (
            <div ref={panelRef} id={panelId} className={PANEL_CELL} data-panel>
              <div className="max-w-sm md:max-w-none">
                <UnitsStandIn onClose={close} />
              </div>
            </div>
          )}
          <div className={cx(COLUMN_CELL, 'mt-2 md:row-start-5')}>
            <ol className={cx(LIST_CARD, 'p-2')}>
              {ROWS.map((row) => (
                <li key={row.name} className={cx(CURSOR_ROW, 'flex items-center gap-2')}>
                  <span className={unitSymbol()}>{row.symbol}</span>
                  <span>{row.name}</span>
                  <span className="ml-auto font-numeric">{row.value}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      {open && option.id === 'drawer' && (
        <div id={panelId} className={DRAWER} data-drawer>
          <UnitsStandIn onClose={close} />
        </div>
      )}
      <p className="mt-2 font-numeric text-sm text-ink-muted" data-reading>
        {reading === null
          ? ''
          : !reading.grid
            ? 'Below md the panel opens between the box and the rows, on every way alike.'
            : `The column’s left edge ${reading.left} px from the page column’s edge, slid ${reading.slid} px` +
              (reading.narrowed > 0 ? `, the box ${reading.narrowed} px narrower` : '') +
              (reading.short === null
                ? '.'
                : `; the panel’s right edge ${reading.short} px short of the window’s frame.`)}
      </p>
    </section>
  );
}

export function PanelOpens() {
  return (
    <div>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        Each stage is the page’s column at this window’s width, its edges dashed, with a stand-in
        for the converter page. Press Units on a stage to open its panel, resize the window to see
        each rule at other widths, and read the line under it: where the column sits, measured.
      </p>
      {OPTIONS.map((option, index) => (
        <Stage key={option.id} option={option} index={index} />
      ))}
    </div>
  );
}
