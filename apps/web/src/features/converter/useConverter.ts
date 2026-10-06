import {
  localeSeparators,
  regionDefaults,
  type Separators,
  type UnitPreference,
} from '@bigsmall/core';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { detectRegion } from '../../lib/region';
import {
  initialState,
  reduce,
  selectView,
  type Action,
  type ConverterState,
  type ConverterView,
} from './state';
import { paramsToState, stateToParams } from './url';

export interface ConverterEnv {
  locale: string | undefined;
  separators: Separators;
  system: UnitPreference;
}

const SERVER_ENV: ConverterEnv = {
  locale: undefined,
  separators: { decimal: '.', group: ',' },
  system: 'us',
};

function detectEnv(): ConverterEnv {
  if (typeof navigator === 'undefined') return SERVER_ENV;
  const locale = navigator.languages?.[0] ?? navigator.language ?? undefined;
  return {
    locale,
    separators: localeSeparators(locale),
    system: regionDefaults(detectRegion()).system,
  };
}

const URL_DEBOUNCE_MS = 250;
const ANNOUNCE_DEBOUNCE_MS = 600;

export interface ConverterController {
  state: ConverterState;
  view: ConverterView;
  env: ConverterEnv;
  dispatch: (action: Action) => void;
  /** Debounced copy of the view's announcement, so screen readers are not flooded while typing. */
  announcement: string | null;
}

/** Owns the converter state, derives the view, syncs the URL, and paces live-region announcements. */
export function useConverter(): ConverterController {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [env] = useState(detectEnv);
  const view = useMemo(() => selectView(state, env), [state, env]);

  // Restore the conversion from the URL once, after hydration (the server renders the empty state).
  useEffect(() => {
    const hydrated = paramsToState(new URLSearchParams(window.location.search));
    if (hydrated) dispatch({ type: 'hydrate', state: hydrated });
  }, []);

  // Keep the URL in step with the state, without flooding history.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = stateToParams(state).toString();
      const url = `${window.location.pathname}${params ? `?${params}` : ''}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(null, '', url);
      }
    }, URL_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const [announcement, setAnnouncement] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(view.announcement), ANNOUNCE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [view.announcement]);

  return { state, view, env, dispatch, announcement };
}
