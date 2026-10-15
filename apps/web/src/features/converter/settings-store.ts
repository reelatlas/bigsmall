import { settingsFrom, storedOf, type Settings } from './settings';

/**
 * Settings remembered in this browser (docs/UX-SPEC.md §11; ADR 0018):
 * what shows, Custom and the set kept for it, the sections' order, and how values look. In local
 * storage, as the theme is; never in the URL or on a server. Storage can be blocked (a private
 * window): then settings last for the visit only, and nothing fails.
 */

const KEY = 'bigsmall:settings';

/** The settings saved here, or null for none, or none that read. */
export function loadSettings(): Settings | null {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? settingsFrom(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(storedOf(settings)));
  } catch {
    // Storage blocked: the settings last for this visit.
  }
}
