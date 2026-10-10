import type { UnitPreference } from '@bigsmall/core';
import {
  useId,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Button } from '../../../components/Button';
import { ChevronDownIcon, CopyIcon } from '../../../components/icons';
import type { TableRow } from '../../../features/converter/state';
import { useColumnsFit } from '../../../lib/fit-step';
import {
  CARD,
  cx,
  CURSOR_ROW,
  LIST_CARD,
  MENU_CHEVRON,
  MENU_OPTION,
  MENU_ROOT,
  MENU_SHELL,
  MENU_SIZER,
  MENU_SIZER_LABEL,
  MENU_TRIGGER,
  PANEL_TITLE,
  rowFill,
  SHELL_PANEL,
  unitSymbol,
} from '../../../lib/recipes';
import { BoxField, CHECKBOX, GIVE_WAY, RowCells, ROWS, sectionSymbols, toggleSet } from './parts';
import { FIXED_LABEL, sectionsFor, SHOW_KEYS, type Idea, type Section } from './sections';
import {
  bySystem,
  groupState,
  presetKeys,
  presetName,
  SHOW_PRESETS,
  unitShown,
  withChoice,
  withSystems,
  type GroupState,
  type ViewRule,
} from './view-rule';

/**
 * Options E to I (docs/research/organization-lab.md, 2026-10-10): one rule, five ways to reach it.
 * The system switches set what shows in every category; a unit chosen on its own overrides them
 * either way, hidden from a system that shows or shown from one that hides; a section's checkbox
 * reads all, some (a dash), or none of its units, and sets them all.
 */
export type ViewOption = 'show' | 'edit' | 'tree' | 'pages' | 'panel';

export const VIEW_OPTIONS: ReadonlyArray<{ id: ViewOption; name: string; hint: string }> = [
  {
    id: 'show',
    name: 'E. Show menu',
    hint: 'Systems only: All units, Everyday, or Your units, and a switch per system, one setting for every category.',
  },
  {
    id: 'edit',
    name: 'F. Edit the table',
    hint: 'The Show menu, whose last item turns the table into the checklist: a checkbox on every row, a three-state one on every heading.',
  },
  {
    id: 'tree',
    name: 'G. Tree in the menu',
    hint: 'The Show menu with this category under the switches: a three-state checkbox per section that opens to its units.',
  },
  {
    id: 'pages',
    name: 'H. View menu',
    hint: 'One View menu: what shows, a page for this category’s units, and how rows look (names, copy buttons; fractions and rounding later).',
  },
  {
    id: 'panel',
    name: 'I. View panel',
    hint: 'H laid out in a panel instead of a dropdown, every part in view at once: what shows, how rows look, and this category’s units.',
  },
];

export function isViewOption(id: string): id is ViewOption {
  return VIEW_OPTIONS.some((option) => option.id === id);
}

/** The rule's switches and single units (view-rule.ts), and how the View is open and set. */
export interface ViewState extends ViewRule {
  names: 'both' | 'symbol';
  copy: boolean;
  /** The menu or the panel is open. */
  open: boolean;
  /** The View menu's page. */
  page: 'main' | 'units';
  /** Sections opened in a tree. */
  expanded: ReadonlySet<string>;
  /** The table is the checklist (option F). */
  editing: boolean;
}

export function freshView(): ViewState {
  return {
    shown: new Set(SHOW_KEYS),
    overrides: new Map(),
    names: 'both',
    copy: true,
    open: false,
    page: 'main',
    expanded: new Set(),
    editing: false,
  };
}

/** A new category keeps every setting, its single units' too; only what was open closes. */
export function viewForCategory(view: ViewState): ViewState {
  return { ...view, open: false, page: 'main', expanded: new Set(), editing: false };
}

type Update = (update: (view: ViewState) => ViewState) => void;

/** Keeps focus where it is on a press inside a menu, so its blur does not close it first. */
const holdFocus = (event: PointerEvent<HTMLElement>) => event.preventDefault();

/** A checkbox for a section: checked for all its units, a dash for some, clear for none. */
function TriCheckbox({ state, onChange }: { state: GroupState; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'some';
  });
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === 'all'}
      onChange={onChange}
      className={CHECKBOX}
    />
  );
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

const GROUP_LINE =
  'flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-nested-md px-2 text-sm text-ink hover:bg-surface-raised';
const UNIT_LINE =
  'flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-nested-md pr-2 pl-8 text-sm text-ink hover:bg-surface-raised';
const NAV_LINE =
  'flex min-h-11 w-full items-center gap-2 rounded-nested-md px-2 text-left text-sm text-ink hover:bg-surface-raised';
const GROUP_TITLE = cx(PANEL_TITLE, 'px-2 pt-2 pb-1');

/**
 * A category's units by section, each section's checkbox three-state, each unit's its own. In a
 * tree a section opens to its units; on a page or in a panel they all show.
 */
function UnitsChecklist({
  sections,
  view,
  preference,
  collapsible,
  inMenu,
  onView,
}: {
  sections: readonly Section<TableRow>[];
  view: ViewState;
  preference: UnitPreference;
  collapsible: boolean;
  inMenu: boolean;
  onView: Update;
}) {
  const shows = (row: TableRow) => unitShown(row, view, preference);
  const hold = inMenu ? holdFocus : undefined;
  return (
    <div className="grid">
      {sections.map((section) => {
        const label = section.label ?? 'Units';
        const state = groupState(section.rows, shows);
        const open = !collapsible || view.expanded.has(section.key);
        const count = section.rows.filter(shows).length;
        return (
          <div key={section.key} role="group" aria-label={label}>
            <div className="flex items-center">
              <label onPointerDown={hold} className={GROUP_LINE}>
                <TriCheckbox
                  state={state}
                  onChange={() =>
                    onView((current) =>
                      withChoice(current, section.rows, state !== 'all', preference),
                    )
                  }
                />
                <span className="truncate font-medium">{label}</span>
                <span className="ml-auto font-numeric text-xs text-ink-muted">
                  {count} of {section.rows.length}
                </span>
              </label>
              {collapsible && (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={`${label} units`}
                  onPointerDown={hold}
                  onClick={() =>
                    onView((current) => ({
                      ...current,
                      expanded: toggleSet(current.expanded, section.key),
                    }))
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-nested-md text-ink-muted hover:bg-surface-raised"
                >
                  <ChevronDownIcon
                    width="16"
                    height="16"
                    className={cx('transition-transform', !open && '-rotate-90')}
                  />
                </button>
              )}
            </div>
            {open &&
              section.rows.map((row) => (
                <label key={row.id} onPointerDown={hold} className={UNIT_LINE}>
                  <input
                    type="checkbox"
                    checked={shows(row)}
                    disabled={row.inBox}
                    onChange={() =>
                      onView((current) => withChoice(current, [row], !shows(row), preference))
                    }
                    className={CHECKBOX}
                  />
                  <span className={unitSymbol()}>{row.symbol}</span>
                  <span className="truncate">{row.unit.plural}</span>
                  {row.inBox && <span className="ml-auto text-xs text-ink-muted">in the box</span>}
                </label>
              ))}
          </div>
        );
      })}
    </div>
  );
}

/** The presets, then a switch per system: one setting for every category. */
function SystemsChoice({
  view,
  preference,
  inMenu,
  onView,
}: {
  view: ViewState;
  preference: UnitPreference;
  inMenu: boolean;
  onView: Update;
}) {
  const id = useId();
  const hold = inMenu ? holdFocus : undefined;
  const current = presetName(view.shown, preference);
  return (
    <>
      <fieldset>
        <legend className="sr-only">Show</legend>
        {SHOW_PRESETS.map((each) => (
          <label key={each.id} onPointerDown={hold} className={MENU_OPTION}>
            <input
              type="radio"
              name={`${id}-preset`}
              checked={current === each.name}
              onChange={() =>
                onView((now) => withSystems(now, presetKeys(each.id, preference), preference))
              }
              className="sr-only"
            />
            {each.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="mt-1 border-t border-line pt-1">
        <legend className="sr-only">Systems, in every category</legend>
        {SHOW_KEYS.map((key) => (
          <label key={key} onPointerDown={hold} className={cx(MENU_OPTION, 'gap-2')}>
            <input
              type="checkbox"
              checked={view.shown.has(key)}
              onChange={() =>
                onView((now) => withSystems(now, toggleSet(now.shown, key), preference))
              }
              className={CHECKBOX}
            />
            {FIXED_LABEL[key]}
          </label>
        ))}
      </fieldset>
    </>
  );
}

/** How rows look: what the View menu and panel add beside what shows. Fractions and rounding wait. */
function DisplayChoice({
  view,
  inMenu,
  onView,
}: {
  view: ViewState;
  inMenu: boolean;
  onView: Update;
}) {
  const id = useId();
  const hold = inMenu ? holdFocus : undefined;
  const later = cx(MENU_OPTION, 'cursor-not-allowed text-ink-muted hover:bg-transparent');
  return (
    <>
      <fieldset>
        <legend className={GROUP_TITLE}>Unit names</legend>
        {(
          [
            ['both', 'Symbol and name'],
            ['symbol', 'Symbol only'],
          ] as const
        ).map(([value, name]) => (
          <label key={value} onPointerDown={hold} className={MENU_OPTION}>
            <input
              type="radio"
              name={`${id}-names`}
              checked={view.names === value}
              onChange={() => onView((now) => ({ ...now, names: value }))}
              className="sr-only"
            />
            {name}
          </label>
        ))}
      </fieldset>
      <label onPointerDown={hold} className={cx(MENU_OPTION, 'gap-2')}>
        <input
          type="checkbox"
          checked={view.copy}
          onChange={() => onView((now) => ({ ...now, copy: !now.copy }))}
          className={CHECKBOX}
        />
        Copy buttons
      </label>
      <fieldset disabled>
        <legend className={GROUP_TITLE}>Numbers (later)</legend>
        <label className={later}>
          <input type="radio" name={`${id}-numbers`} defaultChecked className="sr-only" />
          Decimals
        </label>
        <label className={later}>
          <input type="radio" name={`${id}-numbers`} className="sr-only" />
          Fractions
        </label>
      </fieldset>
      <fieldset disabled>
        <legend className={GROUP_TITLE}>Rounding (later)</legend>
        <label className={later}>
          <input type="radio" name={`${id}-rounding`} defaultChecked className="sr-only" />
          To the nearest
        </label>
        <label className={later}>
          <input type="radio" name={`${id}-rounding`} className="sr-only" />
          Up or down
        </label>
      </fieldset>
    </>
  );
}

/**
 * A menu built from the category menu's recipes, its card as wide as the menu open and closed: the
 * Show menus size to their labels, the tree and the View menu take a width that holds a unit's row.
 */
function MenuShell({
  label,
  value,
  sizes,
  wide,
  view,
  onView,
  children,
}: {
  label: string;
  value: string;
  sizes: readonly string[];
  wide: boolean;
  view: ViewState;
  onView: Update;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={cx(MENU_ROOT, wide && 'w-72')}
      data-open={view.open || undefined}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          onView((now) => ({ ...now, open: false, page: 'main' }));
      }}
    >
      <span aria-hidden="true" className={MENU_SIZER}>
        {sizes.map((size) => (
          <span key={size} className={MENU_SIZER_LABEL}>
            <span className="size-4" />
            {size}
            <span className="size-4" />
          </span>
        ))}
      </span>
      <div className={MENU_SHELL}>
        <button
          type="button"
          aria-expanded={view.open}
          aria-controls={`${id}-panel`}
          onClick={() => onView((now) => ({ ...now, open: !now.open, page: 'main' }))}
          className={MENU_TRIGGER}
        >
          <span className="text-ink-muted">{label}</span>
          {value}
          <ChevronDownIcon width="16" height="16" className={MENU_CHEVRON} />
        </button>
        <div
          id={`${id}-panel`}
          className={cx(SHELL_PANEL, 'p-1', wide && 'max-h-96 overflow-y-auto')}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const SHOW_SIZES = [
  ...['All units', 'Everyday', 'Your units', 'Custom'].map((name) => `Show ${name}`),
  ...SHOW_KEYS.map((key) => FIXED_LABEL[key]),
];

/**
 * A table for options E to I: the fixed names (or the cut chosen above), what shows by the rule
 * above, names and copy buttons as the View sets them, and a line counting what is hidden.
 */
export function ViewMock({
  option,
  cut,
  rows,
  categoryName,
  preference,
  text,
  unit,
  view,
  onText,
  onTake,
  onRemove,
  onView,
}: {
  option: ViewOption;
  cut: Idea;
  rows: readonly TableRow[];
  categoryName: string;
  preference: UnitPreference;
  text: string;
  unit: string | null;
  view: ViewState;
  onText: (text: string) => void;
  onTake: (row: TableRow) => void;
  onRemove: () => void;
  onView: Update;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const withName = view.names === 'both';
  const namesHidden = useColumnsFit(gridRef, GIVE_WAY).includes('name');
  const meta = VIEW_OPTIONS.find((each) => each.id === option) ?? VIEW_OPTIONS[0]!;
  const sections = sectionsFor(rows, cut, preference);
  const shows = (row: TableRow) => unitShown(row, view, preference);
  const editing = option === 'edit' && view.editing;
  const hidden = rows.filter((row) => !shows(row)).length;
  const kept = rows.some(
    (row) =>
      row.inBox && !(view.overrides.get(row.id) ?? bySystem(row.unit, view.shown, preference)),
  );
  const current = presetName(view.shown, preference);

  const showAll = () =>
    onView((now) => {
      const overrides = new Map(now.overrides);
      for (const row of rows) overrides.delete(row.id);
      return { ...now, shown: new Set(SHOW_KEYS), overrides };
    });

  const toolbar =
    option === 'pages' ? (
      <MenuShell label="View" value={current} sizes={[]} wide view={view} onView={onView}>
        {view.page === 'main' ? (
          <>
            <SystemsChoice view={view} preference={preference} inMenu onView={onView} />
            <div className="mt-1 border-t border-line pt-1">
              <button
                type="button"
                onPointerDown={holdFocus}
                onClick={() => onView((now) => ({ ...now, page: 'units' }))}
                className={NAV_LINE}
              >
                Units in {categoryName}
                <ChevronDownIcon
                  width="16"
                  height="16"
                  className="ml-auto -rotate-90 text-ink-muted"
                />
              </button>
            </div>
            <div className="mt-1 border-t border-line pt-1">
              <DisplayChoice view={view} inMenu onView={onView} />
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onPointerDown={holdFocus}
              onClick={() => onView((now) => ({ ...now, page: 'main' }))}
              className={NAV_LINE}
            >
              <ChevronDownIcon width="16" height="16" className="rotate-90 text-ink-muted" />
              View
            </button>
            <p className={GROUP_TITLE}>Units in {categoryName}</p>
            <UnitsChecklist
              sections={sections}
              view={view}
              preference={preference}
              collapsible={false}
              inMenu
              onView={onView}
            />
          </>
        )}
      </MenuShell>
    ) : option === 'panel' ? (
      <Button
        variant="ghost"
        square
        on={view.open}
        aria-expanded={view.open}
        aria-label="View options"
        onClick={() => onView((now) => ({ ...now, open: !now.open }))}
      >
        <SlidersIcon />
      </Button>
    ) : (
      <MenuShell
        label="Show"
        value={current}
        sizes={option === 'edit' ? [...SHOW_SIZES, 'Choose single units…'] : SHOW_SIZES}
        wide={option === 'tree'}
        view={view}
        onView={onView}
      >
        <SystemsChoice view={view} preference={preference} inMenu onView={onView} />
        {option === 'edit' && (
          <div className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              onPointerDown={holdFocus}
              onClick={() => onView((now) => ({ ...now, open: false, editing: true }))}
              className={NAV_LINE}
            >
              Choose single units…
            </button>
          </div>
        )}
        {option === 'tree' && (
          <div className="mt-1 border-t border-line pt-1">
            <p className={GROUP_TITLE}>In {categoryName}</p>
            <UnitsChecklist
              sections={sections}
              view={view}
              preference={preference}
              collapsible
              inMenu
              onView={onView}
            />
          </div>
        )}
      </MenuShell>
    );

  return (
    <div className="min-w-0">
      <p className="min-h-12 text-sm text-ink-muted">{meta.hint}</p>
      <div className="mt-2 flex">{toolbar}</div>
      <BoxField text={text} unit={unit} onText={onText} onRemove={onRemove} />
      {option === 'panel' && view.open && (
        <div className={cx(CARD, 'mt-2 grid gap-4 p-3 sm:grid-cols-2')}>
          <div>
            <p className={GROUP_TITLE}>Show, in every category</p>
            <SystemsChoice view={view} preference={preference} inMenu={false} onView={onView} />
          </div>
          <div>
            <DisplayChoice view={view} inMenu={false} onView={onView} />
          </div>
          <div className="sm:col-span-2">
            <p className={GROUP_TITLE}>Units in {categoryName}</p>
            <UnitsChecklist
              sections={sections}
              view={view}
              preference={preference}
              collapsible
              inMenu={false}
              onView={onView}
            />
          </div>
        </div>
      )}
      <div className={cx(LIST_CARD, 'mt-2 p-2')}>
        {editing && (
          <div className="flex items-center justify-between gap-2 pb-1 pl-2">
            <span className={PANEL_TITLE}>Choose the units to show</span>
            <Button
              variant="ghost"
              nested
              onClick={() => onView((now) => ({ ...now, editing: false }))}
              className="text-sm"
            >
              Done
            </Button>
          </div>
        )}
        <div ref={gridRef} className={ROWS}>
          {sections.map((section, at) => {
            const visible = editing ? section.rows : section.rows.filter(shows);
            if (visible.length === 0) return null;
            const symbols = sectionSymbols(section, cut !== 'fixed');
            const edge = at === 0 ? 'pt-1' : 'mt-1 border-t border-line pt-2';
            const state = groupState(section.rows, shows);
            return (
              <div
                key={section.key}
                role="group"
                aria-label={section.label ?? 'Units'}
                className="col-span-6 grid grid-cols-subgrid gap-y-0.5"
              >
                {section.label ? (
                  <h3 className={cx('col-span-6', edge)}>
                    {editing ? (
                      <label className={cx(PANEL_TITLE, 'flex min-h-11 items-center gap-2 px-2')}>
                        <TriCheckbox
                          state={state}
                          onChange={() =>
                            onView((now) =>
                              withChoice(now, section.rows, state !== 'all', preference),
                            )
                          }
                        />
                        {section.label}
                      </label>
                    ) : (
                      <span className={cx('block px-2 pb-1', PANEL_TITLE)}>{section.label}</span>
                    )}
                  </h3>
                ) : (
                  at > 0 && (
                    <div aria-hidden="true" className="col-span-6 mt-1 border-t border-line" />
                  )
                )}
                {visible.map((row) => {
                  const symbol = symbols.get(row.id) ?? row.symbol;
                  if (editing) {
                    const on = shows(row);
                    return (
                      <label
                        key={row.id}
                        className={cx(
                          CURSOR_ROW,
                          'col-span-6 grid grid-cols-subgrid items-center',
                          rowFill(row.inBox, false),
                          !on && 'opacity-50',
                        )}
                      >
                        <RowCells
                          row={row}
                          symbol={symbol}
                          namesHidden={namesHidden}
                          withName={withName}
                        />
                        <span className="grid size-11 place-items-center">
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={row.inBox}
                            onChange={() =>
                              onView((now) => withChoice(now, [row], !on, preference))
                            }
                            className={CHECKBOX}
                          />
                        </span>
                      </label>
                    );
                  }
                  return (
                    <div key={row.id} className="col-span-6 grid grid-cols-subgrid items-center">
                      <button
                        type="button"
                        onClick={() => onTake(row)}
                        className={cx(
                          CURSOR_ROW,
                          'col-span-5 grid grid-cols-subgrid items-center',
                          rowFill(row.inBox, false),
                        )}
                      >
                        <RowCells
                          row={row}
                          symbol={symbol}
                          namesHidden={namesHidden}
                          withName={withName}
                        />
                      </button>
                      {view.copy &&
                        (row.tone === 'value' ? (
                          <Button
                            variant="ghost"
                            square
                            nested
                            aria-label={`Copy ${row.name}`}
                            onClick={() => void navigator.clipboard?.writeText(String(row.value))}
                          >
                            <CopyIcon />
                          </Button>
                        ) : (
                          <span className="block size-11" />
                        ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="flex min-h-11 items-center justify-between gap-2 border-t border-line px-2 pt-1 text-sm text-ink-muted">
          <span>
            {hidden > 0 ? (
              <>
                <span className="font-numeric">{hidden}</span> hidden
              </>
            ) : (
              'Every unit shown'
            )}
            {kept && ' · the unit in the box stays'}
          </span>
          {!editing && hidden > 0 && (
            <span className="flex gap-1">
              {option === 'edit' && (
                <Button
                  variant="ghost"
                  nested
                  onClick={() => onView((now) => ({ ...now, editing: true }))}
                  className="text-sm"
                >
                  Edit
                </Button>
              )}
              <Button variant="ghost" nested onClick={showAll} className="text-sm">
                Show all
              </Button>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
