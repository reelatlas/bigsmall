import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Button } from '../../../components/Button';
import { CheckIcon, CopyIcon } from '../../../components/icons';
import {
  ART_LINE,
  CARD,
  cx,
  PLAYING_LINE,
  WORDMARK_FACE,
  WORDMARK_SIZES,
  type WordmarkSize,
} from '../../../lib/recipes';
import {
  play,
  fitPhrase,
  type WordmarkPlayer,
  type WordmarkSettings,
} from '../../../lib/wordmark-motion';
import { useCopied } from '../../../lib/copied';
import { FRAME_MS, WORDMARK_TIMING } from '../../../lib/timing';
import { PRESETS, SHIPPED } from './presets';
import {
  ART_GLYPHS,
  ART_STEPS,
  catalog,
  nextPhrase,
  PHRASE_KINDS,
  fitSteps,
  WORDMARK,
  WORDMARK_TUNING,
  type FitStep,
  type PhraseKind,
  type WordmarkTuning,
} from '../../../lib/wordmark';

// Development page: tunes the wordmark at play (pages/dev/wordmark-lab.astro). Settings apply
// live to the header's wordmark and persist in this browser; none of this ships to the converter.

const STORAGE_KEY = 'bigsmall:wordmark-lab';
type Timing = WordmarkSettings['timing'];

// The lab's own class lists, each used more than once here; the ones it shares with the site
// come from lib/recipes.ts.
const HEADING = 'font-display text-lg font-semibold';
const FIELD = 'grid gap-1 text-sm';
const INPUT = 'min-h-11 min-w-0 rounded-md border-2 border-edge bg-surface px-3 text-ink';
const SELECT = cx(INPUT, 'w-full');
const CHECK = 'flex min-h-11 items-center gap-2 text-sm';
const CHECKBOX = 'size-4 accent-accent';
type TimingKey = keyof Timing;

const defaults = (): WordmarkSettings => ({
  timing: { ...WORDMARK_TIMING },
  tuning: { ...WORDMARK_TUNING, mix: { ...WORDMARK_TUNING.mix } },
});

/** Saved settings over the defaults, so a setting added since keeps its default. */
function load(): WordmarkSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<WordmarkSettings>;
    const base = defaults();
    return {
      timing: { ...base.timing, ...saved.timing },
      tuning: {
        ...base.tuning,
        ...saved.tuning,
        mix: { ...base.tuning.mix, ...saved.tuning?.mix },
      },
    };
  } catch {
    return null;
  }
}

function save(settings: WordmarkSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked (a private window): the settings last until the page reloads.
  }
}

/** A setting's value as it is written in code. */
const literal = (value: unknown) => (typeof value === 'string' ? `'${value}'` : String(value));

/**
 * The settings as code, to paste over the defaults in lib/timing.ts and lib/wordmark.ts. Every
 * setting is listed from the shipped objects' own keys, so one added later cannot be left out.
 */
function snippet({ timing, tuning }: WordmarkSettings): string {
  const settings = (Object.keys(WORDMARK_TUNING) as (keyof WordmarkTuning)[]).filter(
    (key) => key !== 'mix',
  );
  return [
    '// apps/web/src/lib/timing.ts',
    'export const WORDMARK_TIMING = {',
    ...(Object.keys(WORDMARK_TIMING) as TimingKey[]).map((key) => `  ${key}: ${timing[key]},`),
    '} as const;',
    '',
    '// apps/web/src/lib/wordmark.ts',
    'export const WORDMARK_TUNING: WordmarkTuning = {',
    '  mix: {',
    ...PHRASE_KINDS.map((kind) => `    ${kind}: ${tuning.mix[kind]},`),
    '  },',
    ...settings.map((key) => `  ${key}: ${literal(tuning[key])},`),
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
    key: 'restMs',
    label: 'Rest',
    min: 200,
    max: 4000,
    step: 50,
    hint: 'Time between phrases while hovered and still.',
  },
  {
    key: 'fastMs',
    label: 'Fastest',
    min: 40,
    max: 1000,
    step: 10,
    hint: 'The shortest time between phrases, however fast the pointer.',
  },
  {
    key: 'firstMs',
    label: 'First change',
    min: 0,
    max: 2000,
    step: 10,
    hint: 'How soon the first change comes after the pointer arrives.',
  },
  {
    key: 'stepMs',
    label: 'Letter step',
    min: 5,
    max: 200,
    step: 1,
    hint: 'At rest, how far apart the letters land in a change.',
  },
  {
    key: 'flipMs',
    label: 'Flip',
    min: Math.ceil(FRAME_MS),
    max: 200,
    step: 1,
    hint: 'At rest, how often a flipping letter shows a new glyph.',
  },
  {
    key: 'tapMs',
    label: 'Tap',
    min: 500,
    max: 10000,
    step: 250,
    hint: 'How long a tap plays it on a touch screen.',
  },
];

const KIND_LABELS: Readonly<Record<PhraseKind, string>> = {
  big: '“big” replaced: ∞small',
  small: '“small” replaced: bignm',
  both: 'Both halves: TBbit',
  letters: 'Letters swapped: bιgSmall',
  pairs: 'Opposite pairs: giganano',
  analogies: 'Analogies: whale:krill',
  idioms: 'Idioms: drop in the ocean',
  equations: 'Equations: E = mc²',
  constants: 'Constants: α ≈ 1/137',
  conversions: 'Conversions: 1 in = 2.54 cm',
  name: 'Wordplay on the name: small ⊂ big',
  art: 'Text art: ▁▂▃▄▅▆▇',
};

interface SliderProps {
  label: string;
  value: number;
  /** The shipped default, shown beside a changed value. */
  shipped: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: ReactNode;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function Slider({
  label,
  value,
  shipped,
  min,
  max,
  step,
  unit = '',
  hint,
  disabled,
  onChange,
}: SliderProps) {
  const id = useId();
  const changed = value !== shipped;
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <label htmlFor={id} className={changed ? 'font-semibold' : undefined}>
          {label}
        </label>
        <output htmlFor={id} className="font-numeric text-ink-muted">
          {value}
          {unit}
          {changed && ` (shipped ${shipped}${unit})`}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-11 w-full accent-accent disabled:opacity-50"
      />
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cx(CARD, 'grid min-w-0 grid-cols-1 content-start gap-4 p-5', className)}>
      <legend className={cx('px-1', HEADING)}>{title}</legend>
      {children}
    </fieldset>
  );
}

/** What the wordmark shows now, its size, and how fast it runs, read every frame. */
function Readout({ player }: { player: RefObject<WordmarkPlayer | null> }) {
  const [text, setText] = useState('');
  useEffect(() => {
    const line = document.querySelector<HTMLElement>('[data-wordmark]');
    let frame = requestAnimationFrame(function read() {
      const size =
        WORDMARK_SIZES.find((step) => line?.classList.contains(step)) ?? WORDMARK_SIZES[0];
      const quicker = 1 / (player.current?.pace() ?? 1);
      const next = `${line?.textContent?.trim() ?? ''} · ${size} · ${quicker.toFixed(1)}× the resting pace`;
      setText((previous) => (previous === next ? previous : next));
      frame = requestAnimationFrame(read);
    });
    return () => cancelAnimationFrame(frame);
  }, [player]);
  return <p className="min-h-5 font-numeric text-sm text-ink-muted">{text}</p>;
}

/** The page theme, following the theme menu. */
function usePageTheme(): string | undefined {
  const [theme, setTheme] = useState<string | undefined>(undefined);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.dataset['theme']);
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

interface Report {
  theme: string;
  room: number;
  counts: ReadonlyArray<readonly [string, number]>;
  tooLong: readonly string[];
}

/** The sheet sets each phrase as the wordmark does, and each art symbol as the art's line does. */
const NAME_LINE = cx(PLAYING_LINE, WORDMARK_FACE);
const SYMBOL_LINE = cx(ART_LINE, 'flex', WORDMARK_FACE);
const CELL =
  'relative shrink-0 rounded-sm outline outline-line hover:outline-accent data-too-long:outline-danger';

/** One group of the sheet: a heading with its count, then a cell for each phrase or symbol. */
function SheetGroup({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className={HEADING}>
        {title} <span className="font-body text-sm font-normal text-ink-muted">{count}</span>
      </h3>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-3">{children}</ul>
    </section>
  );
}

/** A cell in the sheet, with the size it took written under it once measured. */
function SheetCell({ children }: { children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-1">
      {children}
      <span className="text-xs text-ink-muted" />
    </li>
  );
}

/** How the sheet names a step: "base, 2 lines". */
const labelOf = (step: FitStep | null) =>
  step ? `${step.size.replace('text-', '')}${step.lines === 2 ? ', 2 lines' : ''}` : 'too long';

/** Every phrase at the size it takes in the page theme, inside a box the name's size. */
const Sheet = memo(function Sheet({
  smallest,
  twoLinesFrom,
  onShow,
}: {
  smallest: WordmarkSize;
  twoLinesFrom: WordmarkSize | null;
  onShow: (text: string) => void;
}) {
  const phrases = useMemo(() => catalog(), []);
  const theme = usePageTheme();
  const [withBoth, setWithBoth] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const id = useId();

  // Each phrase is set exactly as the wordmark sets it (fitPhrase), in a box the name's size.
  useLayoutEffect(() => {
    const root = sheet.current;
    const name = probe.current;
    if (!root || !name || !theme) return;
    const fit = (kind: string, room: number, height: number, steps: readonly FitStep[]) =>
      [...root.querySelectorAll<HTMLElement>(`[data-cell="${kind}"]`)].map((cell) => {
        cell.style.width = `${room}px`;
        cell.style.height = `${height}px`;
        const { step } = fitPhrase(
          cell.firstElementChild as HTMLElement,
          cell.dataset['phrase'] ?? '',
          room,
          steps,
        );
        const label = labelOf(step);
        cell.toggleAttribute('data-too-long', !step);
        if (cell.nextElementSibling) cell.nextElementSibling.textContent = label;
        return label;
      });
    const { width, height } = name.getBoundingClientRect();
    const steps = fitSteps(smallest, twoLinesFrom);
    const labels = fit('phrase', width, height, steps);
    const art = document.querySelector('[data-art-box]')?.getBoundingClientRect();
    if (art && art.width > 0) fit('art', art.width, art.height, ART_STEPS);
    const counts = [...steps, null]
      .map(labelOf)
      .map((label) => [label, labels.filter((each) => each === label).length] as const)
      .filter(([, count]) => count > 0);
    const tooLong = [
      ...root.querySelectorAll<HTMLElement>('[data-cell="phrase"][data-too-long]'),
    ].map((cell) => cell.dataset['phrase'] ?? '');
    setReport({ theme, room: Math.round(width), counts, tooLong });
  }, [theme, smallest, twoLinesFrom, withBoth]);

  return (
    <section aria-labelledby={`${id}-title`} className="mt-10 grid gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id={`${id}-title`} className="font-display text-2xl font-semibold">
          Every phrase
        </h2>
        <label className={CHECK}>
          <input
            type="checkbox"
            checked={withBoth}
            onChange={(event) => setWithBoth(event.currentTarget.checked)}
            className={CHECKBOX}
          />
          Include all {phrases.both.length} “both halves” pairs
        </label>
      </div>
      <span
        ref={probe}
        aria-hidden="true"
        className={cx('invisible absolute whitespace-pre', WORDMARK_FACE, WORDMARK_SIZES[0])}
      >
        {WORDMARK}
      </span>
      {report && (
        <p
          className="text-sm text-ink-muted"
          data-sheet-report
          data-theme-fitted={report.theme}
          data-too-long={report.tooLong.length}
        >
          In this theme the name is {report.room} px wide, and each phrase takes the largest size
          that fits it: {report.counts.map(([label, count]) => `${count} at ${label}`).join('; ')}.
          {report.tooLong.length > 0 && (
            <strong className="text-danger">
              {' '}
              Too long even at the smallest size: {report.tooLong.join(' · ')}
            </strong>
          )}{' '}
          Select one to show it on the wordmark.
        </p>
      )}
      <div ref={sheet} className="grid gap-8">
        {PHRASE_KINDS.filter((kind) => kind !== 'both' || withBoth).map((kind) => (
          <SheetGroup
            key={kind}
            id={`${id}-${kind}`}
            title={KIND_LABELS[kind]}
            count={phrases[kind].length}
          >
            {phrases[kind].map((phrase) => (
              <SheetCell key={phrase}>
                <button
                  type="button"
                  data-cell="phrase"
                  data-phrase={phrase}
                  className={CELL}
                  onClick={() => onShow(phrase)}
                >
                  <span className={NAME_LINE}>{phrase}</span>
                </button>
              </SheetCell>
            ))}
          </SheetGroup>
        ))}
        <SheetGroup id={`${id}-art`} title="The art’s symbols" count={ART_GLYPHS.length}>
          {ART_GLYPHS.map((glyph) => (
            <SheetCell key={glyph}>
              <span data-cell="art" data-phrase={glyph} className={CELL}>
                <span className={SYMBOL_LINE}>{glyph}</span>
              </span>
            </SheetCell>
          ))}
        </SheetGroup>
      </div>
    </section>
  );
});

export function WordmarkLab() {
  const [settings, setSettings] = useState<WordmarkSettings>(defaults);
  const [solo, setSolo] = useState<PhraseKind | 'all'>('all');
  const [pinned, setPinned] = useState(false);
  const [held, setHeld] = useState(false);
  const [simulated, setSimulated] = useState(0);
  const [phrase, setPhrase] = useState('');
  const [still, setStill] = useState(false);
  const live = useRef<WordmarkSettings>(defaults());
  const player = useRef<WordmarkPlayer | null>(null);
  const loaded = useRef(false);
  const id = useId();
  const { copied, copy, pointerProps } = useCopied<'settings'>();

  // The player reads `live` every frame, so a change applies at once. Saving waits for the saved
  // settings to load, so the defaults never overwrite them.
  useEffect(() => {
    const mix =
      solo === 'all'
        ? settings.tuning.mix
        : (Object.fromEntries(PHRASE_KINDS.map((kind) => [kind, kind === solo ? 1 : 0])) as Record<
            PhraseKind,
            number
          >);
    live.current.timing = { ...settings.timing };
    live.current.tuning = { ...settings.tuning, mix };
    if (loaded.current) save(settings);
  }, [settings, solo]);

  // Saved settings arrive after the first render, so the server's HTML and the first render agree.
  useEffect(() => {
    loaded.current = true;
    const saved = load();
    if (saved) setSettings(saved);
  }, []);

  useEffect(() => {
    const zone = document.querySelector<HTMLElement>('[data-wordmark-zone]');
    if (!zone) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStill(true);
    else player.current = play(zone, live.current);
  }, []);

  useEffect(() => {
    if (simulated <= 0) return;
    let frame = requestAnimationFrame(function push() {
      player.current?.push(simulated);
      frame = requestAnimationFrame(push);
    });
    return () => cancelAnimationFrame(frame);
  }, [simulated]);

  const show = useCallback((text: string) => {
    if (!text.trim() || !player.current) return;
    player.current.hold(true);
    player.current.show(text);
    setHeld(true);
  }, []);
  const pin = (on: boolean) => {
    setPinned(on);
    player.current?.pin(on);
  };
  const hold = (on: boolean) => {
    setHeld(on);
    player.current?.hold(on);
  };
  const setTiming = (key: TimingKey, value: number) =>
    setSettings((s) => ({ ...s, timing: { ...s.timing, [key]: value } }));
  const setTuning = <K extends keyof WordmarkTuning>(key: K, value: WordmarkTuning[K]) =>
    setSettings((s) => ({ ...s, tuning: { ...s.tuning, [key]: value } }));
  const setMix = (kind: PhraseKind, value: number) =>
    setSettings((s) => ({
      ...s,
      tuning: { ...s.tuning, mix: { ...s.tuning.mix, [kind]: value } },
    }));

  const [preset, setPreset] = useState(PRESETS[0]?.id ?? '');
  const loadPreset = (presetId: string) => {
    const found = PRESETS.find((each) => each.id === presetId);
    if (!found) return;
    setSettings(structuredClone(found.settings));
    setSolo('all');
  };

  const total = PHRASE_KINDS.reduce((sum, kind) => sum + settings.tuning.mix[kind], 0);
  // Shown below the button too, to copy by hand where the clipboard is blocked.
  const code = snippet(settings);

  return (
    <>
      {still && (
        <p className={cx(CARD, 'mt-4 p-4 text-sm')}>
          This system asks for reduced motion, so the wordmark does not play, here or on the site.
          The sheet below still shows every phrase at its size.
        </p>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Play">
          <Readout player={player} />
          <label className={CHECK}>
            <input
              type="checkbox"
              className={CHECKBOX}
              checked={pinned}
              disabled={still}
              onChange={(event) => pin(event.currentTarget.checked)}
            />
            Play without hovering
          </label>
          <label className={CHECK}>
            <input
              type="checkbox"
              className={CHECKBOX}
              checked={held}
              disabled={still}
              onChange={(event) => hold(event.currentTarget.checked)}
            />
            Hold the phrase showing
          </label>
          <Button
            variant="secondary"
            disabled={still}
            onClick={() => player.current?.show(nextPhrase('', live.current.tuning.mix))}
          >
            Next phrase
          </Button>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              show(phrase);
            }}
          >
            <label htmlFor={`${id}-phrase`} className="sr-only">
              Phrase to show
            </label>
            <input
              id={`${id}-phrase`}
              value={phrase}
              onChange={(event) => setPhrase(event.currentTarget.value)}
              placeholder="Any phrase"
              className={cx(INPUT, 'flex-1')}
            />
            <Button variant="secondary" type="submit" disabled={still}>
              Show
            </Button>
          </form>
          <Slider
            label="Pointer speed, simulated"
            value={simulated}
            shipped={0}
            min={0}
            max={3}
            step={0.05}
            unit=" px/ms"
            hint="A steady speed, as if the mouse kept moving."
            disabled={still}
            onChange={setSimulated}
          />
        </Panel>

        <Panel title="Timing">
          {TIMING_SLIDERS.map(({ key, label, min, max, step, hint }) => (
            <Slider
              key={key}
              label={label}
              value={settings.timing[key]}
              shipped={WORDMARK_TIMING[key]}
              min={min}
              max={max}
              step={step}
              unit=" ms"
              hint={hint}
              onChange={(value) => setTiming(key, value)}
            />
          ))}
        </Panel>

        <Panel title="Pointer speed">
          <Slider
            label="Gain"
            value={settings.tuning.gain}
            shipped={WORDMARK_TUNING.gain}
            min={0}
            max={10}
            step={0.1}
            hint="How strongly speed quickens the pace: pace = 1 / (1 + speed × gain)."
            onChange={(value) => setTuning('gain', value)}
          />
          <Slider
            label="Decay"
            value={settings.tuning.decay}
            shipped={WORDMARK_TUNING.decay}
            min={0.8}
            max={0.995}
            step={0.005}
            hint="The share of speed kept each 60th of a second; lower eases back sooner."
            onChange={(value) => setTuning('decay', value)}
          />
          <Slider
            label="Response"
            value={settings.tuning.response}
            shipped={WORDMARK_TUNING.response}
            min={0.05}
            max={1}
            step={0.05}
            hint="How much a new speed reading counts against the speed so far."
            onChange={(value) => setTuning('response', value)}
          />
        </Panel>

        <Panel title="Mix" className="lg:col-span-2">
          <div className={FIELD}>
            <label htmlFor={`${id}-solo`}>Draw from</label>
            <select
              id={`${id}-solo`}
              value={solo}
              onChange={(event) => setSolo(event.currentTarget.value as PhraseKind | 'all')}
              className={SELECT}
            >
              <option value="all">Every kind, by the mix</option>
              {PHRASE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]} only
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-muted">A look at one kind; not part of the settings.</p>
          </div>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {PHRASE_KINDS.map((kind) => (
              <Slider
                key={kind}
                label={KIND_LABELS[kind]}
                value={settings.tuning.mix[kind]}
                shipped={WORDMARK_TUNING.mix[kind]}
                min={0}
                max={40}
                step={1}
                hint={`${total ? Math.round((settings.tuning.mix[kind] / total) * 100) : 0}% of phrases`}
                onChange={(value) => setMix(kind, value)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Art and type">
          <Slider
            label="Art flips to a symbol"
            value={settings.tuning.artAway}
            shipped={WORDMARK_TUNING.artAway}
            min={0}
            max={1}
            step={0.05}
            hint="The chance, with each phrase, that the drawing flips to a symbol."
            onChange={(value) => setTuning('artAway', value)}
          />
          <Slider
            label="Art flips back"
            value={settings.tuning.artBack}
            shipped={WORDMARK_TUNING.artBack}
            min={0}
            max={1}
            step={0.05}
            hint="The chance, with each phrase, that a symbol flips back to the drawing."
            onChange={(value) => setTuning('artBack', value)}
          />
          <div className={FIELD}>
            <label htmlFor={`${id}-smallest`}>Smallest type size</label>
            <select
              id={`${id}-smallest`}
              value={settings.tuning.smallest}
              onChange={(event) => setTuning('smallest', event.currentTarget.value as WordmarkSize)}
              className={SELECT}
            >
              {WORDMARK_SIZES.slice(1).map((size) => (
                <option key={size} value={size}>
                  {size.replace('text-', '')}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-muted">
              Phrases step down from the name’s size (3xl) to this. One too long even here is
              squeezed, and marked in the sheet below.
            </p>
          </div>
          <div className={FIELD}>
            <label htmlFor={`${id}-two-lines`}>Two lines from</label>
            <select
              id={`${id}-two-lines`}
              value={settings.tuning.twoLinesFrom ?? 'never'}
              onChange={(event) =>
                setTuning(
                  'twoLinesFrom',
                  event.currentTarget.value === 'never'
                    ? null
                    : (event.currentTarget.value as WordmarkSize),
                )
              }
              className={SELECT}
            >
              {WORDMARK_SIZES.slice(1).map((size) => (
                <option key={size} value={size}>
                  {size.replace('text-', '')}
                </option>
              ))}
              <option value="never">Never</option>
            </select>
            <p className="text-xs text-ink-muted">
              From this size down, a long phrase takes two lines before a smaller size: “big fish,”
              over “small pond”.
            </p>
          </div>
        </Panel>

        <Panel title="Settings" className="lg:col-span-3">
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
            <Button
              variant="secondary"
              onClick={() => {
                setSettings(defaults());
                setSolo('all');
              }}
            >
              Reset to shipped ({SHIPPED})
            </Button>
            <div className="grid min-w-0 gap-1 text-sm">
              <label htmlFor={`${id}-preset`}>Earlier version</label>
              <div className="flex gap-2">
                <select
                  id={`${id}-preset`}
                  value={preset}
                  onChange={(event) => setPreset(event.currentTarget.value)}
                  className={SELECT}
                >
                  {PRESETS.map((each) => (
                    <option key={each.id} value={each.id}>
                      {each.label}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" onClick={() => loadPreset(preset)}>
                  Load
                </Button>
              </div>
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            Paste the copied settings in chat, or over the defaults in the two files they name. An
            earlier version loads the settings that shipped then, to compare, or to copy and send
            back as the defaults.
          </p>
          <pre className="rounded-md bg-surface-raised p-4 font-numeric text-xs wrap-break-word whitespace-pre-wrap">
            {code}
          </pre>
        </Panel>
      </div>
      <Sheet
        smallest={settings.tuning.smallest}
        twoLinesFrom={settings.tuning.twoLinesFrom}
        onShow={show}
      />
    </>
  );
}
