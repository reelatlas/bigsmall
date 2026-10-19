import { useState } from 'react';
import { Button } from '../../../components/Button';
import { useIsHydrated } from '../../../lib/hydrated';

/*
 * The owner's switch for Umami (docs/DEPLOYMENT.md, "Our own visits"; ADR 0019): the tracker
 * counts no visit from a browser whose storage holds `umami.disabled`, so one press here leaves
 * this browser's visits out of the counts until the site's data is cleared, and a second press
 * counts them again. The state is read once the island is on the page, so the first render is
 * the server's; until then the line says it is reading. No effect: the state is read from the
 * browser's storage as the island renders once hydrated (useIsHydrated), and a press re-reads it.
 */

const KEY = 'umami.disabled';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function OwnVisits() {
  // Unknown until hydrated: the server cannot know this browser's storage. A press bumps the
  // count so the line reads the storage again.
  const hydrated = useIsHydrated();
  const [presses, setPresses] = useState(0);
  const disabled = hydrated ? read() : null;

  const toggle = () => {
    try {
      if (read()) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, '1');
    } catch {
      // Storage refused (a private window with it blocked): the line keeps saying what is true.
    }
    setPresses(presses + 1);
  };

  return (
    <div className="mt-section grid max-w-prose gap-3">
      <p role="status" className="text-sm">
        {disabled === null
          ? 'Reading this browser’s setting…'
          : disabled
            ? 'This browser’s visits are not counted.'
            : 'This browser’s visits are counted.'}
      </p>
      <Button
        variant="secondary"
        className="justify-self-start"
        aria-pressed={disabled === true}
        disabled={disabled === null}
        onClick={toggle}
      >
        {disabled ? 'Count my visits in this browser' : 'Stop counting my visits in this browser'}
      </Button>
    </div>
  );
}
