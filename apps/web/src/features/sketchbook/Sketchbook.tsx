import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { PauseIcon, PlayIcon } from '../../components/icons';
import { cx } from '../../lib/recipes';
import { SKETCHBOOK_TIMING } from '../../lib/timing';
import { FlipButton } from './FlipButton';
import { play, sketchHref, type SketchbookPlayer } from './motion';
import {
  SKETCH_BY_ID,
  SKETCHBOOK_TUNING,
  startingSketches,
  TILE_CORNER,
  type SketchbookSettings,
} from './sketches';

/**
 * A tile's layers, bottom to top: the sketch showing, the one arriving, and four pieces the
 * stepped effects, Flap, and Doors cut a tile into (motion.ts); all but the first rest unseen.
 */
const LAYERS = ['front', 'back', 'piece', 'piece', 'piece', 'piece'] as const;

/** The settings the sketchbook plays by on the site. */
const SHIPPED: SketchbookSettings = { timing: SKETCHBOOK_TIMING, tuning: SKETCHBOOK_TUNING };

interface SketchbookProps {
  /** The lab's live settings; the shipped ones otherwise. */
  settings?: SketchbookSettings;
  /** Hands over the player's controls once it starts, and null once it stops (the lab). Stable. */
  onPlayer?: (player: SketchbookPlayer | null) => void;
}

/**
 * The sketchbook (docs/UX-SPEC.md §1, the About page): the logo sketches in a grid, each tile a
 * button that changes to another sketch, with Flip and Pause under them. The page sets the art
 * once with SketchSprite.astro, and motion.ts plays it once the island runs. The first render
 * shows the server's sketches, START's order, and Pause, so hydration changes nothing.
 */
export function Sketchbook({ settings = SHIPPED, onPlayer }: SketchbookProps) {
  const grid = useRef<HTMLDivElement>(null);
  const live = useRef(settings);
  const player = useRef<SketchbookPlayer | null>(null);
  const [said, setSaid] = useState('');
  const [paused, setPaused] = useState(false);

  // The play reads `live` at every change, so new settings apply to the next one.
  useLayoutEffect(() => {
    live.current = settings;
    player.current?.update();
  }, [settings]);

  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    const started = play(element, live, setSaid);
    player.current = started;
    onPlayer?.(started);
    return () => {
      started.stop();
      player.current = null;
      onPlayer?.(null);
    };
  }, [onPlayer]);

  const { columns, rows, tile, gap, set } = settings.tuning;
  const ids = startingSketches(set, columns * rows);
  return (
    <div className="grid justify-items-center gap-6">
      <div
        ref={grid}
        role="group"
        aria-label="Logo sketches"
        className="grid w-full justify-center"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, calc(var(--spacing) * ${tile})))`,
          gap: `calc(var(--spacing) * ${gap})`,
        }}
      >
        {ids.map((id, index) => (
          <button
            // A tile keeps its place; which sketch it shows is the play's.
            key={index}
            type="button"
            data-sketch-tile
            data-sketch={id}
            aria-label={SKETCH_BY_ID.get(id)?.name ?? id}
            className="relative block aspect-square w-full"
            style={{ borderRadius: TILE_CORNER }}
          >
            {LAYERS.map((layer, at) => (
              <svg
                key={at}
                viewBox="0 0 32 32"
                aria-hidden="true"
                focusable="false"
                data-layer={layer}
                className={cx('absolute inset-0 size-full', layer !== 'front' && 'opacity-0')}
              >
                <use href={sketchHref(id)} />
              </svg>
            ))}
          </button>
        ))}
      </div>
      {/* Flip and Pause under the middle tile, together as wide as one tile: Pause its 44 px,
          Flip the rest, 4 px apart as a toolbar's buttons are (Sean, 2026-10-16). Where a narrow
          window makes a tile smaller than the two need, they keep their size, centered under it. */}
      <div
        className="flex min-w-max gap-1"
        style={{
          width: `min(calc(var(--spacing) * ${tile}), calc((100% - ${columns - 1} * var(--spacing) * ${gap}) / ${columns}))`,
        }}
      >
        <FlipButton
          className="flex-1"
          particles={settings.tuning.particles}
          onFlip={() => player.current?.flip()}
        />
        {/* Under reduced motion nothing changes by itself, so there is nothing to pause: Flip
            takes the whole width. */}
        <Button
          variant="ghost"
          square
          className="motion-reduce:hidden"
          aria-label={paused ? 'Play' : 'Pause'}
          title={paused ? 'Play' : 'Pause'}
          onClick={() => {
            player.current?.pause(!paused);
            setPaused(!paused);
          }}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
