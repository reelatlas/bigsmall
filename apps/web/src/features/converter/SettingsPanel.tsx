import {
  FRACTION_SIZES,
  fractionsOf,
  type FractionSize,
  type UnitPreference,
} from '@bigsmall/core';
import { useId, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { CheckIcon } from '../../components/icons';
import { SegmentedControl, SegmentedToggles } from '../../components/SegmentedControl';
import { Switch } from '../../components/Switch';
import { useCopied } from '../../lib/copied';
import { CARD, cx, OPTION_ROW, PANEL_TITLE } from '../../lib/recipes';
import {
  displayChanged,
  FRESH_DISPLAY,
  FRESH_RULE,
  hiddenByHand,
  presetKeys,
  presetOf,
  SECTION_LABEL,
  SHOW_PRESETS,
  switchesChanged,
  SYSTEM_KEYS,
  withoutHidden,
  withSystem,
  withSystems,
  type Display,
  type Settings,
  type ShowPreset,
  type ViewRule,
} from './settings';

const SUBHEAD = cx(PANEL_TITLE, 'text-xs');
const CHECKBOX = 'size-4 accent-accent';

/** The two strips of sizes, from the least fine to the finest, as the places run. */
const SIZE_ROWS: ReadonlyArray<readonly FractionSize[]> = [
  FRACTION_SIZES.slice(0, 4),
  FRACTION_SIZES.slice(4),
];

const SIZE_NAME: Record<FractionSize, string> = {
  2: 'halves',
  3: 'thirds',
  4: 'quarters',
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
  id: string;
  settings: Settings;
  preference: UnitPreference;
  onSettings: (update: (settings: Settings) => Settings) => void;
}

/**
 * Settings (docs/UX-SPEC.md §1, §3, §7; ADR 0017): what search and the table show, in every
 * category, then how results look, then the two resets. A non-modal panel under the toolbar,
 * beside it rather than in it, so its own controls keep their keys; the converter opens and closes
 * it (Escape, a press outside, or focus moving out, never focus merely lost).
 */
export function SettingsPanel({ id, settings, preference, onSettings }: SettingsPanelProps) {
  const { rule, display } = settings;
  const hiddenCount = hiddenByHand(rule);
  const settingsChanged = switchesChanged(rule) || displayChanged(display);
  const setRule = (next: (rule: ViewRule) => ViewRule) =>
    onSettings((now) => ({ ...now, rule: next(now.rule) }));
  const setDisplay = (patch: Partial<Display>) =>
    onSettings((now) => ({ ...now, display: { ...now.display, ...patch } }));
  const both = display.format === 'both';
  // A reset done shows a check after its label that draws itself in, at full strength while it
  // shows; then the button settles to its off look. useCopied times it as it does a copy's check.
  const { copied: done, markCopied, pointerProps } = useCopied<'reset' | 'unhide'>();
  const doneCheck = <CheckIcon width="16" height="16" className="check-draw text-success" />;

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Settings"
      className={cx(
        CARD,
        'absolute inset-x-0 top-full z-20 mt-1 grid max-h-120 gap-3 overflow-y-auto p-3 shadow-md sm:right-auto sm:w-80',
      )}
    >
      <section className="grid gap-2" aria-label="Units">
        <div>
          <h2 className={PANEL_TITLE}>Units</h2>
          <p className="text-xs text-ink-muted">
            What search and the table show in every category. Units you hide or show in a table stay
            as you set them.
          </p>
        </div>
        <Choices<ShowPreset>
          legend="Show"
          hideLegend
          options={SHOW_PRESETS.map((preset) => ({ value: preset.id, label: preset.name }))}
          value={presetOf(rule.shown, preference)}
          onChange={(preset) => setRule((now) => withSystems(now, presetKeys(preset, preference)))}
        />
        <fieldset className="grid">
          <legend className="sr-only">Systems</legend>
          {SYSTEM_KEYS.map((key) => (
            <label key={key} className={cx(OPTION_ROW, 'gap-2')}>
              <input
                type="checkbox"
                checked={rule.shown.has(key)}
                onChange={() => setRule((now) => withSystem(now, key, !now.shown.has(key)))}
                className={CHECKBOX}
              />
              {SECTION_LABEL[key]}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="grid gap-2 border-t border-line pt-3" aria-label="Display">
        <h2 className={PANEL_TITLE}>Display</h2>
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
      </section>

      {/*
       * Two resets: the settings, which leave the units hidden in a table, and the units hidden in
       * a table, which leave the settings. Off with aria-disabled, which keeps focus where it was,
       * so the panel stays open to show what changed.
       */}
      <div className="grid gap-1 border-t border-line pt-2">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            aria-disabled={!settingsChanged && done !== 'reset'}
            onClick={() => {
              if (!settingsChanged) return;
              onSettings((now) => ({
                rule: withSystems(now.rule, FRESH_RULE.shown),
                display: FRESH_DISPLAY,
              }));
              markCopied('reset');
            }}
            {...pointerProps('reset')}
            className="text-sm"
          >
            Reset settings
            {done === 'reset' && doneCheck}
          </Button>
          <Button
            variant="ghost"
            aria-disabled={hiddenCount === 0 && done !== 'unhide'}
            onClick={() => {
              if (hiddenCount === 0) return;
              setRule(withoutHidden);
              markCopied('unhide');
            }}
            {...pointerProps('unhide')}
            className="text-sm"
          >
            Unhide units
            {hiddenCount > 0 && <span className="font-numeric font-normal">{hiddenCount}</span>}
            {done === 'unhide' && doneCheck}
          </Button>
        </div>
        <p className="px-2 text-xs text-ink-muted">
          Reset settings keeps the units you hid; Unhide shows them again, in every category.
        </p>
        <p role="status" className="sr-only">
          {done === 'reset' ? 'Settings reset' : done === 'unhide' ? 'Units unhidden' : ''}
        </p>
      </div>
    </div>
  );
}
