import {
  FRACTION_SIZES,
  fractionsOf,
  type FractionSize,
  type UnitPreference,
} from '@bigsmall/core';
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { CheckIcon } from '../../components/icons';
import { SegmentedControl, SegmentedToggles } from '../../components/SegmentedControl';
import { Switch } from '../../components/Switch';
import { useCopied } from '../../lib/copied';
import { SidePanel } from '../../components/SidePanel';
import { TriCheckbox } from '../../components/TriCheckbox';
import { cx, OPTION_ROW, PANEL_TITLE } from '../../lib/recipes';
import {
  displayChanged,
  FRESH_DISPLAY,
  hiddenByHand,
  litPreset,
  presetKeys,
  presetRule,
  SECTION_LABEL,
  SHOW_PRESETS,
  SYSTEM_KEYS,
  systemState,
  withoutHidden,
  withSystem,
  type Display,
  type Settings,
  type ShowPreset,
  type ViewRule,
} from './settings';

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
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
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
 * and the table show, in every category. The presets first, Standard among them, which is how the
 * switches go back to a fresh visit's; then a switch per system; then Show units hidden one by one,
 * which clears what Edit and the Hidden list hid, the switches staying (Sean, 2026-10-15: a reset to
 * Standard beside the Standard preset did the same thing twice, and "Unhide units" read as the
 * switches' units too).
 */
export function UnitsPanel({ settings, preference, onSettings, onClose }: SettingsPanelProps) {
  const { rule } = settings;
  const hiddenCount = hiddenByHand(rule);
  const setRule = (next: (rule: ViewRule) => ViewRule) =>
    onSettings((now) => ({ ...now, rule: next(now.rule) }));
  const { copied: done, markCopied, pointerProps } = useCopied<'unhide'>();
  return (
    <SidePanel title="Units" onClose={onClose}>
      <Choices<ShowPreset>
        legend="Show"
        hideLegend
        options={SHOW_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
        value={litPreset(rule, preference)}
        onChange={(preset) => setRule(() => presetRule(presetKeys(preset, preference)))}
      />
      <div className="grid gap-1">
        <fieldset className="grid">
          <legend className="sr-only">Systems</legend>
          {SYSTEM_KEYS.map((key) => {
            // A dash while some of the system's units are chosen on their own; a press on a dash
            // or a clear box shows them all, on a checked one hides them all.
            const state = systemState(rule, key, preference);
            return (
              <label key={key} className={cx(OPTION_ROW, 'gap-2')}>
                <TriCheckbox
                  state={state}
                  onChange={() =>
                    setRule((now) => withSystem(now, key, state !== 'all', preference))
                  }
                />
                {SECTION_LABEL[key]}
              </label>
            );
          })}
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 border-t border-line pt-2">
        <Reset
          off={hiddenCount === 0}
          done={done === 'unhide'}
          onReset={() => {
            setRule(withoutHidden);
            markCopied('unhide');
          }}
          pointer={pointerProps('unhide')}
        >
          Show units hidden one by one
          {hiddenCount > 0 && <span className="font-numeric font-normal">{hiddenCount}</span>}
        </Reset>
        <p role="status" className="sr-only">
          {done === 'unhide' ? 'Units shown' : ''}
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
      <div className="border-t border-line pt-2">
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
