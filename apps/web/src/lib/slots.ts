import { useSyncExternalStore } from 'react';

/**
 * Places in a page's static markup that an island fills once it runs. The markup reserves each
 * slot's size, so nothing moves when the island's content arrives.
 */
export const SLOTS = {
  /** In the header between the shortcuts map and the theme menu: the converter's copy link. */
  headerActions: 'header-actions',
} as const;

const subscribe = () => () => {};

/**
 * The slot's element in the browser, and null while rendering on the server or hydrating, so a
 * portal into it renders on the client only, the way useIsHydrated flips (lib/hydrated.ts).
 */
export function useSlot(id: string): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => document.getElementById(id),
    () => null,
  );
}
