import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../../components/Button';
import { CheckIcon, CopyIcon } from '../../../components/icons';
import { sketchHref, type SketchbookPlayer } from '../../../features/sketchbook/motion';
import { Sketchbook } from '../../../features/sketchbook/Sketchbook';
import {
  FAMILIES,
  SKETCH_EASINGS,
  SKETCH_EFFECTS,
  SKETCHBOOK_TUNING,
  SKETCHES,
  WAVES,
  type Family,
  type SketchbookSettings,
  type SketchbookTuning,
  type SketchEasing,
  type SketchEffect,
  type Wave,
} from '../../../features/sketchbook/sketches';
import { useCopied } from '../../../lib/copied';
import { useIsHydrated } from '../../../lib/hydrated';
import { CARD, CHECKBOX, cx } from '../../../lib/recipes';
import { SKETCHBOOK_TIMING } from '../../../lib/timing';
import { CHECK, FIELD, HEADING, Panel, SELECT, Slider } from '../_lab/controls';

// Development page: tunes the sketchbook at play (pages/dev/sketchbook-lab.astro). Settings apply
// live and persist in this browser; none of this ships to the converter.

const STORAGE_KEY = 'bigsmall:sketchbook-lab';
type Timing = SketchbookSettings['timing'];
type TimingKey = keyof Timing;

const DEFAULTS: SketchbookSettings = { timing: SKETCHBOOK_TIMING, tuning: SKETCHBOOK_TUNING };

/** Saved settings over the defaults, so a setting added since keeps its default. */
function load(): SketchbookSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SketchbookSettings>;
    return {
      timing: { ...DEFAULTS.timing, ...saved.timing },
      tuning: { ...DEFAULTS.tuning, ...saved.tuning },
    };
  } catch {
    return null;
  }
}

function save(settings: SketchbookSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked (a private window): the settings last until the page reloads.
  }
}

/** A setting's value as it is written in code. */
const literal = (value: unknown) => (typeof value === 'string' ? `'${value}'` : String(value));

/**
 * The settings as code, to paste over the defaults in lib/timing.ts and
 * features/sketchbook/sketches.ts. Every setting is listed from the shipped objects' own keys, so
 * one added later cannot be left out; the set is every sketch, or the ones chosen.
 */
function snippet({ timing, tuning }: SketchbookSettings): string {
  const chosen = SKETCHES.filter(({ id }) => tuning.set.includes(id));
  const set =
    chosen.length === SKETCHES.length
      ? 'SKETCHES.map(({ id }) => id)'
      : `[${chosen.map(({ id }) => `'${id}'`).join(', ')}]`;
  const keys = (Object.keys(SKETCHBOOK_TUNING) as (keyof SketchbookTuning)[]).filter(
    (key) => key !== 'set',
  );
  return [
    '// apps/web/src/lib/timing.ts',
    'export const SKETCHBOOK_TIMING = {',
    ...(Object.keys(SKETCHBOOK_TIMING) as TimingKey[]).map((key) => `  ${key}: ${timing[key]},`),
    '} as const;',
    '',
    '// apps/web/src/features/sketchbook/sketches.ts',
    'export const SKETCHBOOK_TUNING: SketchbookTuning = {',
    ...keys.map((key) => `  ${key}: ${literal(tuning[key])},`),
    `  set: ${set},`,
    '};',
  ].join('\n');
}

const TIMING_SLIDERS: ReadonlyArray<{
  key: TimingKey;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  {
    key: 'swapMs',
    label: 'Change',
    min: 100,
    max: 2000,
    step: 10,
    hint: 'How long one change takes, from one sketch to the next.',
  },
  {
    key: 'holdMs',
    label: 'Hold',
    min: 100,
    max: 4000,
    step: 50,
    hint: 'While hovered, how long each sketch shows before the next change.',
  },
  {
    key: 'firstMs',
    label: 'First change',
    min: 0,
    max: 1500,
    step: 10,
    hint: 'How soon the first change comes after the pointer arrives.',
  },
];

const EFFECT_LABELS: Readonly<Record<SketchEffect | 'mixed', string>> = {
  flip: 'Flip: turns over sideways, like a card',
  tumble: 'Tumble: turns over top to bottom',
  pop: 'Pop: shrinks away, the next grows in',
  slide: 'Slide: the next pushes up from below',
  iris: 'Iris: the next opens in a circle from the pointer',
  blur: 'Blur: melts into the next',
  spin: 'Spin: twirls away, the next twirls in',
  fade: 'Fade: a cross-fade, as under reduced motion',
  mixed: 'Mixed: a different one each time',
};

const EASING_LABELS: Readonly<Record<SketchEasing, string>> = {
  ease: 'The theme’s ease',
  glide: 'The theme’s glide',
  spring: 'Spring: overshoots and settles',
};

const WAVE_LABELS: Readonly<Record<Wave, string>> = {
  diagonal: 'Diagonal, from the top left',
  rows: 'Row by row',
  center: 'From the middle out',
  random: 'In any order',
};

/** A select over a setting's few choices, each with its label. */
function Choice<T extends string>({
  label,
  value,
  choices,
  labels,
  hint,
  onChange,
}: {
  label: string;
  value: T;
  choices: readonly T[];
  labels: Readonly<Record<T, string>>;
  hint?: string;
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className={FIELD}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as T)}
        className={SELECT}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {labels[choice]}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** A checkbox over one setting. */
function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={CHECK}>
      <input
        type="checkbox"
        className={CHECKBOX}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {label}
    </label>
  );
}

/** A sketch drawn from the page's sprite, at a size in px. */
function Art({ id, size }: { id: string; size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <use href={sketchHref(id)} />
    </svg>
  );
}

/** One family of the sheet: each sketch large and at a tab's sizes, in or out of the rotation. */
function FamilySheet({
  family,
  set,
  onToggle,
  onAll,
}: {
  family: Family;
  set: readonly string[];
  onToggle: (id: string, on: boolean) => void;
  onAll: (ids: readonly string[], on: boolean) => void;
}) {
  const id = useId();
  const sketches = SKETCHES.filter((sketch) => sketch.family === family.id);
  const ids = sketches.map((sketch) => sketch.id);
  const count = ids.filter((each) => set.includes(each)).length;
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={id} className={HEADING}>
          {family.name}{' '}
          <span className="font-body text-sm font-normal text-ink-muted">
            round {family.round} · {count} of {ids.length} in the rotation
          </span>
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onAll(ids, true)}>
            All
          </Button>
          <Button variant="ghost" onClick={() => onAll(ids, false)}>
            None
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{family.blurb}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sketches.map((sketch) => (
          <li key={sketch.id} className={cx(CARD, 'grid justify-items-center gap-2 p-3')}>
            <Art id={sketch.id} size={88} />
            <div className="flex items-center gap-3">
              <Art id={sketch.id} size={32} />
              <Art id={sketch.id} size={16} />
            </div>
            <p className="text-center text-sm">
              <span className="font-semibold">{sketch.id.toUpperCase()}</span> {sketch.name}
            </p>
            <Toggle
              label={
                <>
                  <span className="sr-only">{sketch.name}: </span>In the rotation
                </>
              }
              checked={set.includes(sketch.id)}
              onChange={(on) => onToggle(sketch.id, on)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SketchbookLab() {
  const hydrated = useIsHydrated();
  // Saved settings count from the first render after hydration, so the server's HTML and the
  // first render agree; a change made here takes over from them.
  const saved = useMemo(() => (hydrated ? load() : null), [hydrated]);
  const [edited, setEdited] = useState<SketchbookSettings | null>(null);
  const settings = edited ?? saved ?? DEFAULTS;
  const [player, setPlayer] = useState<SketchbookPlayer | null>(null);
  const [pinned, setPinned] = useState(false);
  const [still, setStill] = useState(false);
  const reduced = hydrated && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { copied, copy, pointerProps } = useCopied<'settings'>();
  const { timing, tuning } = settings;

  // Only a change is saved, so the defaults never overwrite saved settings.
  useEffect(() => {
    if (edited) save(edited);
  }, [edited]);

  const setSettings = (update: (current: SketchbookSettings) => SketchbookSettings) =>
    setEdited((current) => update(current ?? saved ?? DEFAULTS));

  // A new grid (more tiles, or the play restarted) takes the play's switches again.
  useEffect(() => {
    player?.still(still);
    player?.pin(pinned);
  }, [player, pinned, still, tuning.columns, tuning.rows]);

  const setTiming = (key: TimingKey, value: number) =>
    setSettings((s) => ({ ...s, timing: { ...s.timing, [key]: value } }));
  const setTuning = <K extends keyof SketchbookTuning>(key: K, value: SketchbookTuning[K]) =>
    setSettings((s) => ({ ...s, tuning: { ...s.tuning, [key]: value } }));
  // The set stays in the catalog's order, so the copied list reads like the sheet.
  const setChosen = (ids: readonly string[], on: boolean) =>
    setSettings((s) => {
      const chosen = new Set(s.tuning.set);
      for (const id of ids) {
        if (on) chosen.add(id);
        else chosen.delete(id);
      }
      return {
        ...s,
        tuning: { ...s.tuning, set: SKETCHES.map(({ id }) => id).filter((id) => chosen.has(id)) },
      };
    });

  // Shown below the button too, to copy by hand where the clipboard is blocked.
  const code = snippet(settings);
  const tiles = tuning.columns * tuning.rows;

  return (
    <>
      {reduced && (
        <p className={cx(CARD, 'mt-4 p-4 text-sm')}>
          This system asks for reduced motion, so nothing changes by itself, here or on the site: a
          press cross-fades, and Shuffle changes every tile at once.
        </p>
      )}
      <div className="mt-8">
        <Sketchbook settings={settings} onPlayer={setPlayer} />
        {tuning.set.length === 0 && (
          <p className="mt-4 text-center text-sm text-ink-muted">
            Nothing is in the rotation: choose sketches in the sheet below.
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Panel title="Play">
          <Toggle
            label="Play without hovering"
            checked={pinned}
            disabled={reduced}
            onChange={setPinned}
          />
          <Toggle
            label="Preview reduced motion"
            checked={still || reduced}
            disabled={reduced}
            onChange={setStill}
          />
          <p className="text-xs text-ink-muted">
            Reduced motion: hovering does nothing, a press cross-fades, and Shuffle changes every
            tile at once.
          </p>
          <Toggle
            label="Keep changing while hovered"
            checked={tuning.cycle}
            onChange={(on) => setTuning('cycle', on)}
          />
          <Toggle
            label="Shuffle as the page opens"
            checked={tuning.intro}
            onChange={(on) => setTuning('intro', on)}
          />
          <p className="text-xs text-ink-muted">Reload the page to see it.</p>
        </Panel>

        <Panel title="Motion">
          <Choice
            label="Effect"
            value={tuning.effect}
            choices={[...SKETCH_EFFECTS, 'mixed'] as const}
            labels={EFFECT_LABELS}
            onChange={(value) => setTuning('effect', value)}
          />
          <Choice
            label="Curve"
            value={tuning.easing}
            choices={SKETCH_EASINGS}
            labels={EASING_LABELS}
            hint="The spring is the one curve no theme has yet: it would become a motion token."
            onChange={(value) => setTuning('easing', value)}
          />
          {TIMING_SLIDERS.map(({ key, label, min, max, step, hint }) => (
            <Slider
              key={key}
              label={label}
              value={timing[key]}
              shipped={SKETCHBOOK_TIMING[key]}
              min={min}
              max={max}
              step={step}
              unit=" ms"
              hint={hint}
              onChange={(value) => setTiming(key, value)}
            />
          ))}
        </Panel>

        <Panel title="Shuffle and order">
          <Choice
            label="Wave"
            value={tuning.wave}
            choices={WAVES}
            labels={WAVE_LABELS}
            onChange={(value) => setTuning('wave', value)}
          />
          <Slider
            label="Wave step"
            value={timing.waveMs}
            shipped={SKETCHBOOK_TIMING.waveMs}
            min={0}
            max={300}
            step={5}
            unit=" ms"
            hint="How far apart the waves of tiles start in a shuffle."
            onChange={(value) => setTiming('waveMs', value)}
          />
          <Choice
            label="Order"
            value={tuning.order}
            choices={['shuffled', 'catalog'] as const}
            labels={{ shuffled: 'Shuffled', catalog: 'The catalog’s, family by family' }}
            hint="Either way every sketch in the rotation shows before any comes back."
            onChange={(value) => setTuning('order', value)}
          />
          <Slider
            label="Changes by itself"
            value={timing.idleMs}
            shipped={SKETCHBOOK_TIMING.idleMs}
            min={0}
            max={10000}
            step={250}
            unit=" ms"
            hint="Above 0, a tile nobody is hovering changes this often; 0 is never."
            onChange={(value) => setTiming('idleMs', value)}
          />
          <Button variant="secondary" onClick={() => player?.shuffle()}>
            Shuffle
          </Button>
        </Panel>

        <Panel title="Layout">
          <Slider
            label="Columns"
            value={tuning.columns}
            shipped={SKETCHBOOK_TUNING.columns}
            min={1}
            max={8}
            step={1}
            onChange={(value) => setTuning('columns', value)}
          />
          <Slider
            label="Rows"
            value={tuning.rows}
            shipped={SKETCHBOOK_TUNING.rows}
            min={1}
            max={6}
            step={1}
            hint={`${tiles} tiles; with fewer sketches in the rotation than tiles, some repeat.`}
            onChange={(value) => setTuning('rows', value)}
          />
          <Slider
            label="Largest tile"
            value={tuning.tile}
            shipped={SKETCHBOOK_TUNING.tile}
            min={12}
            max={48}
            step={1}
            hint={`${tuning.tile * 4} px, in steps of the spacing scale; tiles shrink to fit a narrow screen.`}
            onChange={(value) => setTuning('tile', value)}
          />
          <Slider
            label="Gap"
            value={tuning.gap}
            shipped={SKETCHBOOK_TUNING.gap}
            min={0}
            max={12}
            step={1}
            hint={`${tuning.gap * 4} px between tiles.`}
            onChange={(value) => setTuning('gap', value)}
          />
        </Panel>

        <Panel title="Settings" className="lg:col-span-2">
          <div className="flex flex-wrap items-end gap-3">
            <Button
              variant="primary"
              onClick={() => copy(code, 'settings')}
              {...pointerProps('settings')}
            >
              {/* A filled button: the check takes its ink, not CopiedIcon's success color. */}
              {copied === 'settings' ? <CheckIcon /> : <CopyIcon />}
              Copy settings
            </Button>
            <Button variant="secondary" onClick={() => setSettings(() => DEFAULTS)}>
              Reset to defaults
            </Button>
          </div>
          <p className="text-sm text-ink-muted">
            Paste the copied settings in chat, or over the defaults in the two files they name.
          </p>
          <pre className="rounded-md bg-surface-raised p-4 font-numeric text-xs wrap-break-word whitespace-pre-wrap">
            {code}
          </pre>
        </Panel>
      </div>

      <section aria-labelledby="every-sketch" className="mt-10 grid gap-8">
        <div className="grid gap-1">
          <h2 id="every-sketch" className="font-display text-2xl font-semibold">
            Every sketch
          </h2>
          <p className="text-sm text-ink-muted" data-rotation-count>
            {tuning.set.length} of {SKETCHES.length} in the rotation. Round 1 is the logo canvas’s
            first round; round 2 was drawn for the sketchbook.
          </p>
        </div>
        {FAMILIES.map((family) => (
          <FamilySheet
            key={family.id}
            family={family}
            set={tuning.set}
            onToggle={(id, on) => setChosen([id], on)}
            onAll={setChosen}
          />
        ))}
      </section>
    </>
  );
}
