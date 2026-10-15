import {
  FRACTION_SIZES,
  fractionsOf,
  type FractionSize,
  type UnitPreference,
} from '@bigsmall/core';
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { CheckIcon } from '../../components/icons';
import {
  SegmentedControl,
  SegmentedToggles,
  type SegmentedOption,
} from '../../components/SegmentedControl';
import { Switch } from '../../components/Switch';
import { useCopied } from '../../lib/copied';
import { SidePanel } from '../../components/SidePanel';
import { cx, PANEL_TITLE } from '../../lib/recipes';
import {
  displayChanged,
  FRESH_DISPLAY,
  byHand,
  hiddenByHand,
  SHOW_PRESETS,
  orderChanged,
  shownChoice,
  withCustomPicked,
  withoutHidden,
  withPresetPicked,
  type Display,
  type Settings,
  type ShowChoice,
  type ViewRule,
} from './settings';
import { SystemRows } from './SystemRows';

const SUBHEAD = cx(PANEL_TITLE, 'text-xs');

/** The two strips of sizes, from the least fine to the finest, as the places run: 1/2 to 1/8, then 1/16 on. */
const SIZE_ROWS: ReadonlyArray<readonly FractionSize[]> = [
  FRACTION_SIZES.slice(0, 5),
  FRACTION_SIZES.slice(5),
];

const SIZE_NAME: Record<FractionSize, string> = {
  2: 'halves',
  3: 'thirds',
  4: 'quarters',
  5: 'fifths',
  8: 'eighths',
  16: 'sixteenths',
  32: 'thirty-seconds',
  64: 'sixty-fourths',
};

const PLACES: ReadonlyArray<{ value: string; label: string; places: Display['places'] }> = [
  { value: '1', label: '0.1', places: 1 },
  { value: '2', label: '0.01', places: 2 },
  { value: '3', label: '0.001', places: 3 },
  { value: 'none', label: 'No limit', places: null },
];

/** What the sizes chosen write, in full up to nine, the ends of the list past them. */
function sizesPreview(chosen: ReadonlySet<FractionSize>): string {
  const all = fractionsOf(chosen).map((fraction) => `${fraction.n}/${fraction.d}`);
  if (all.length <= 9) return all.join(', ');
  return `${all.slice(0, 3).join(', ')} … ${all.at(-1)}, ${all.length} in all`;
}

/** One choice of a few, a segmented control under its legend (visually hidden where the choices say it). */
function Choices<T extends string | number>({
  legend,
  options,
  value,
  disabled = false,
  hideLegend = false,
  onChange,
}: {
  legend: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T | null;
  disabled?: boolean;
  hideLegend?: boolean;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="grid">
      <legend className={hideLegend ? 'sr-only' : SUBHEAD}>{legend}</legend>
      <SegmentedControl name={name} options={options} value={value} onChange={onChange} />
    </fieldset>
  );
}

/** Fractions in the sizes chosen, each on or off by itself; the line under them says what they write. */
function FractionSizes({
  legend,
  chosen,
  onChange,
}: {
  legend: string;
  chosen: ReadonlySet<FractionSize>;
  onChange: (chosen: ReadonlySet<FractionSize>) => void;
}) {
  const toggle = (size: FractionSize) => {
    const next = new Set(chosen);
    if (next.has(size)) next.delete(size);
    else next.add(size);
    onChange(next);
  };
  return (
    <fieldset className="grid">
      <legend className={SUBHEAD}>{legend}</legend>
      {SIZE_ROWS.map((sizes) => (
        <SegmentedToggles<FractionSize>
          key={sizes.join()}
          options={sizes.map((size) => ({
            value: size,
            label: (
              <>
                <span className="font-numeric">1/{size}</span>
                <span className="sr-only">, {SIZE_NAME[size]}</span>
              </>
            ),
          }))}
          checked={(size) => chosen.has(size)}
          onToggle={toggle}
        />
      ))}
      <p className="pt-1 text-xs text-ink-muted">
        {chosen.size > 0 ? (
          <>
            Shows <span className="font-numeric">{sizesPreview(chosen)}</span>
          </>
        ) : (
          'Choose a size to write fractions; until then values keep their decimals.'
        )}
      </p>
    </fieldset>
  );
}

export interface SettingsPanelProps {
  settings: Settings;
  preference: UnitPreference;
  onSettings: (update: (settings: Settings) => Settings) => void;
  /** The close button, and Escape inside: the converter closes it and focuses its button. */
  onClose: () => void;
}

/**
 * A reset: dimmed (aria-disabled, which keeps focus where it was) while it has nothing to do;
 * done, a check after its label that draws itself in, at full strength for the copy check's time
 * (useCopied times it), and then the dimmed look.
 */
function Reset({
  off,
  done,
  onReset,
  pointer,
  children,
}: {
  off: boolean;
  done: boolean;
  onReset: () => void;
  pointer: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onPointerEnter' | 'onPointerLeave'>;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      aria-disabled={off && !done}
      onClick={() => {
        if (!off) onReset();
      }}
      {...pointer}
      className="text-sm"
    >
      {children}
      {done && <CheckIcon width="16" height="16" className="check-draw text-success" />}
    </Button>
  );
}

/**
 * Units (docs/UX-SPEC.md §1, §3; ADR 0017; Filter until Sean renamed it, 2026-10-15): what search
 * and the table show, in every category. The presets first, and Custom, the visitor's own set: a
 * change by hand puts them on it, picking a preset keeps it aside, and picking Custom brings it
 * back, or with none kept makes what shows their own. Then the systems, in the order the table's
 * sections follow, each a checkbox (a dash while some of its units are chosen on their own) and a
 * handle to reorder it by (SystemRows); then Show custom hidden units, which clears what Edit and the
 * Hidden list hid, the switches staying, and Reset order.
 */
export function UnitsPanel({ settings, preference, onSettings, onClose }: SettingsPanelProps) {
  const { rule } = settings;
  const hiddenCount = hiddenByHand(rule);
  const setRule = (next: (rule: ViewRule) => ViewRule) =>
    onSettings((now) => byHand(now, next(now.rule)));
  const { copied: done, markCopied, pointerProps } = useCopied<'unhide' | 'order'>();
  return (
    <SidePanel title="Units" onClose={onClose}>
      <Choices<ShowChoice>
        legend="Show"
        hideLegend
        options={[
          ...SHOW_PRESETS.map((preset) => ({ value: preset.id, label: preset.name })),
          {
            value: 'custom',
            label: (
              <>
                Custom<span className="sr-only">, your own set</span>
              </>
            ),
          },
        ]}
        value={shownChoice(settings, preference)}
        onChange={(choice) =>
          onSettings((now) =>
            choice === 'custom' ? withCustomPicked(now) : withPresetPicked(now, choice, preference),
          )
        }
      />
      <fieldset className="grid">
        <legend className="sr-only">Systems, in the table's order</legend>
        <SystemRows settings={settings} preference={preference} onSettings={onSettings} />
      </fieldset>
      {/* Its line sits evenly between the last system's ink and the resets', as every divider does:
          the rows' 44 px leave their ink 12 px inside, so the line comes up past the panel's gap. */}
      <div className="-mt-1.5 flex flex-wrap items-center justify-between gap-x-2 border-t border-line pt-1">
        <Reset
          off={hiddenCount === 0}
          done={done === 'unhide'}
          onReset={() => {
            setRule(withoutHidden);
            markCopied('unhide');
          }}
          pointer={pointerProps('unhide')}
        >
          Show custom hidden units
          {hiddenCount > 0 && <span className="font-numeric font-normal">{hiddenCount}</span>}
        </Reset>
        <Reset
          off={!orderChanged(settings, preference)}
          done={done === 'order'}
          onReset={() => {
            onSettings((now) => ({ ...now, order: null }));
            markCopied('order');
          }}
          pointer={pointerProps('order')}
        >
          Reset order
        </Reset>
        <p role="status" className="sr-only">
          {done === 'unhide' ? 'Hidden units shown' : done === 'order' ? 'Order reset' : ''}
        </p>
      </div>
    </SidePanel>
  );
}

/**
 * Display (docs/UX-SPEC.md §1, §7; ADR 0017): how results look. Symbols alone or with names
 * first; then copy buttons, the format, what values round to, which way, and
 * a reset of all of it.
 */
export function DisplayPanel({ settings, onSettings, onClose }: SettingsPanelProps) {
  const { display } = settings;
  const setDisplay = (patch: Partial<Display>) =>
    onSettings((now) => ({ ...now, display: { ...now.display, ...patch } }));
  const both = display.format === 'both';
  const { copied: done, markCopied, pointerProps } = useCopied<'reset'>();
  return (
    <SidePanel title="Display" onClose={onClose}>
      <Choices<Display['names']>
        legend="Unit names"
        hideLegend
        options={[
          { value: 'symbol', label: 'Symbol only' },
          { value: 'both', label: 'Symbol and name' },
        ]}
        value={display.names}
        onChange={(names) => setDisplay({ names })}
      />
      <Switch
        label="Copy buttons"
        checked={display.copy}
        onChange={(copy) => setDisplay({ copy })}
      />
      <Choices<Display['format']>
        legend="Format"
        options={[
          { value: 'decimal', label: 'Decimals' },
          { value: 'fraction', label: 'Fractions' },
          { value: 'both', label: 'Both' },
        ]}
        value={display.format}
        onChange={(format) => setDisplay({ format })}
      />
      {/* Decimals first, then fractions, as Format lists them. */}
      {display.format !== 'fraction' && (
        <Choices
          legend={both ? 'Round decimals to' : 'Round to'}
          options={PLACES}
          value={PLACES.find((each) => each.places === display.places)?.value ?? null}
          onChange={(value) =>
            setDisplay({ places: PLACES.find((each) => each.value === value)?.places ?? null })
          }
        />
      )}
      {display.format !== 'decimal' && (
        <FractionSizes
          legend={both ? 'Round fractions to' : 'Round to'}
          chosen={display.fractions}
          onChange={(fractions) => setDisplay({ fractions })}
        />
      )}
      <Choices<Display['rounding']>
        legend="Rounding"
        options={[
          { value: 'nearest', label: 'Nearest' },
          { value: 'up', label: 'Up' },
          { value: 'down', label: 'Down' },
        ]}
        value={display.rounding}
        disabled={display.format === 'decimal' && display.places === null}
        onChange={(rounding) => setDisplay({ rounding })}
      />
      <div className="border-t border-line pt-1">
        <Reset
          off={!displayChanged(display)}
          done={done === 'reset'}
          onReset={() => {
            setDisplay(FRESH_DISPLAY);
            markCopied('reset');
          }}
          pointer={pointerProps('reset')}
        >
          Reset display
        </Reset>
        <p role="status" className="sr-only">
          {done === 'reset' ? 'Display reset' : ''}
        </p>
      </div>
    </SidePanel>
  );
}
