import { useState, useSyncExternalStore } from 'react';

/**
 * A store per component that turns true when it is first subscribed to. preact/compat subscribes
 * in an effect after the component's first commit, which never runs on the server, so the value
 * is false through server rendering and hydration. (preact/compat's useSyncExternalStore takes no
 * server snapshot: it reads the client snapshot on the server and while hydrating.)
 */
function createHydrationStore() {
  let hydrated = false;
  return {
    subscribe(notify: () => void) {
      if (!hydrated) {
        hydrated = true;
        notify();
      }
      return () => {};
    },
    getSnapshot: () => hydrated,
  };
}

/** False during server rendering and hydration, true once the island is interactive. No effects, so no flicker rules. */
export function useIsHydrated(): boolean {
  const [store] = useState(createHydrationStore);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
