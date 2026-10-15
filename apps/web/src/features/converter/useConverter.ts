import {
  DEFAULT_SEPARATORS,
  localeSeparators,
  regionDefaults,
  type UnitPreference,
} from '@bigsmall/core';
import { useEffect, useLayoutEffect, useMemo, useReducer, useState, type RefObject } from 'react';
import { browserLocale, detectRegion } from '../../lib/region';
import { ANNOUNCE_MS, URL_WRITE_MS } from '../../lib/timing';
import {
  initialHistory,
  reduceWithHistory,
  selectBox,
  selectTable,
  type BoxView,
  type ConverterState,
  type HistoryAction,
  type NumberEnv,
  type TableView,
} from './state';
import { defaultOrder, FRESH_SETTINGS, type Settings } from './settings';
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
  /** The box as the field shows it. */
  box: BoxView;
  /** What the table shows under the box: the start, the category's units, or the matches. */
  table: TableView;
  env: ConverterEnv;
  dispatch: (action: HistoryAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Debounced copy of the table's announcement, so screen readers are not flooded while typing. */
  announcement: string | null;
  /**
   * What shows and how it looks (ADR 0017): a fresh visit's on every visit, kept apart from the
   * conversion's history, so undo steps through what was typed and converted.
   */
  settings: Settings;
  updateSettings: (update: (settings: Settings) => Settings) => void;
}

/**
 * Owns the converter state and its history, derives the box and the table, syncs the URL, and
 * paces announcements. `input` is the box's input, whose text typed before hydration is kept.
 */
export function useConverter(input: RefObject<HTMLInputElement>): ConverterController {
  const [history, dispatch] = useReducer(reduceWithHistory, initialHistory);
  const state = history.present;
  const [env] = useState(detectEnv);
  const [settings, setSettings] = useState<Settings>(FRESH_SETTINGS);
  const box = useMemo(() => selectBox(state, env), [state, env]);
  const order = settings.order;
  const table = useMemo(
    () =>
      selectTable(state, {
        ...env,
        rule: settings.rule,
        order: order ?? defaultOrder(env.system),
      }),
    [state, env, settings.rule, order],
  );

  // Restore the conversion from the URL once, at hydration (the server renders the empty state).
  // Text typed into the box before then, in the server's field, is kept: it replaces the URL's
  // number, the URL's unit staying. In a layout effect, before any render can reset the field.
  useLayoutEffect(() => {
    const restored = paramsToState(new URLSearchParams(window.location.search), env.separators);
    const typed = input.current?.value ?? '';
    if (typed) dispatch({ type: 'hydrate', state: { text: typed, unit: restored?.unit ?? null } });
    else if (restored) dispatch({ type: 'hydrate', state: restored });
    // Both are fixed for the island's life, so this runs once, as the page loads.
  }, [env.separators, input]);

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

  // The table says how many units it shows the value in, or how many match.
  const spoken = table.announcement;
  const [announcement, setAnnouncement] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(spoken), ANNOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [spoken]);

  return {
    state,
    box,
    table,
    env,
    dispatch,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    announcement,
    settings,
    updateSettings: setSettings,
  };
}
