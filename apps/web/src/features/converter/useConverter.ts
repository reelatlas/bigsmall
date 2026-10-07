import {
  DEFAULT_SEPARATORS,
  localeSeparators,
  regionDefaults,
  type UnitPreference,
} from '@bigsmall/core';
import { useEffect, useMemo, useReducer, useState } from 'react';
import type { Layout } from '../../lib/layout';
import { browserLocale, detectRegion } from '../../lib/region';
import { ANNOUNCE_MS, URL_WRITE_MS } from '../../lib/timing';
import {
  escapeTarget,
  initialHistory,
  reduceWithHistory,
  selectTable,
  selectView,
  type BoxId,
  type ConverterState,
  type ConverterView,
  type EscapeTarget,
  type HistoryAction,
  type NumberEnv,
  type TableView,
} from './state';
import { paramsToState, stateToParams } from './url';

/** How this visitor writes numbers (NumberEnv), and which unit family their region expects. */
export interface ConverterEnv extends NumberEnv {
  locale: string | undefined;
  system: UnitPreference;
}

const SERVER_ENV: ConverterEnv = {
  locale: undefined,
  separators: DEFAULT_SEPARATORS,
  system: 'us',
};

function detectEnv(): ConverterEnv {
  if (typeof navigator === 'undefined') return SERVER_ENV;
  const locale = browserLocale();
  return {
    locale,
    separators: localeSeparators(locale),
    system: regionDefaults(detectRegion()).system,
  };
}

export interface ConverterController {
  state: ConverterState;
  view: ConverterView;
  /** The table layout's view, once the source box holds a number and a unit; null otherwise, and in the two-box layout. */
  table: TableView | null;
  env: ConverterEnv;
  dispatch: (action: HistoryAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Per box, what Escape takes back once its list is closed. */
  escapeTargets: Record<BoxId, EscapeTarget>;
  /** Debounced copy of the layout's announcement, so screen readers are not flooded while typing. */
  announcement: string | null;
}

/**
 * Owns the converter state and its history, derives the view (and the table, in that layout),
 * syncs the URL, and paces announcements. `layout` is null until the island hydrates.
 */
export function useConverter(layout: Layout | null): ConverterController {
  const [history, dispatch] = useReducer(reduceWithHistory, initialHistory);
  const state = history.present;
  const [env] = useState(detectEnv);
  const view = useMemo(() => selectView(state, env), [state, env]);
  const table = useMemo(
    () =>
      layout === 'table'
        ? selectTable(state, { ...env, tier: state.mode === 'basic' ? 'basic' : 'all' })
        : null,
    [layout, state, env],
  );

  // Restore the conversion from the URL once, after hydration (the server renders the empty state).
  useEffect(() => {
    const hydrated = paramsToState(new URLSearchParams(window.location.search));
    if (hydrated) dispatch({ type: 'hydrate', state: hydrated });
  }, []);

  // Keep the URL in step with the state, without flooding history.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = stateToParams(state, env.separators).toString();
      const url = `${window.location.pathname}${params ? `?${params}` : ''}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(null, '', url);
      }
    }, URL_WRITE_MS);
    return () => window.clearTimeout(timer);
  }, [state, env.separators]);

  // Two boxes say the pair's sentence; the table says its own, which names the headline if any.
  const spoken = layout === 'table' ? (table?.announcement ?? null) : view.announcement;
  const [announcement, setAnnouncement] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(spoken), ANNOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [spoken]);

  return {
    state,
    view,
    table,
    env,
    dispatch,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    escapeTargets: { a: escapeTarget(history, 'a'), b: escapeTarget(history, 'b') },
    announcement,
  };
}
