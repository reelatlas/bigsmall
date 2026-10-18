import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useIsHydrated } from '../lib/hydrated';
import { keeping } from '../lib/keeping';

export interface TabItem {
  /** The tab's id: its panel's id too when the tabs are linked, so `#id` in the address opens it. */
  id: string;
  label: string;
}

interface Props {
  /** The tabs in order; each panel comes as a prop named by its tab's id (Astro's named slots). */
  tabs: readonly TabItem[];
  /** What the set is, for assistive technology ("About"). */
  label: string;
  /**
   * Put the open tab's id in the address's hash and open the tab a hash names (the About page's);
   * off for a sample, whose panels then take ids of their own.
   */
  linked?: boolean;
  [panel: string]: unknown;
}

/**
 * The row: floating text tabs, 24 px apart, each 44 px tall, with no rule under the row (Sean,
 * 2026-10-18: a hairline across the column was not needed); muted at rest, ink under the pointer,
 * and the open one in ink with the links' 2 px accent line under it (docs/DESIGN-SYSTEM.md,
 * "Tabs"). No box: that is the segmented control's, for a setting's values.
 */
const LIST = 'flex flex-wrap gap-x-6';
const TAB =
  'relative min-h-11 px-1 font-medium text-ink-muted transition-colors hover:text-ink aria-selected:text-ink aria-selected:after:absolute aria-selected:after:inset-x-0 aria-selected:after:bottom-0 aria-selected:after:h-0.5 aria-selected:after:bg-accent';
const PANEL = 'pt-6';

/** The tab the address names, if any. Read only once hydrated, so the first render is the server's. */
function namedByHash(tabs: readonly TabItem[]): string | null {
  const hash = window.location.hash.slice(1);
  return tabs.some((tab) => tab.id === hash) ? hash : null;
}

/**
 * A few views of one place, one open at a time, the tab their title (the About page's Feedback and
 * Every formula; Sean, 2026-10-18). The WAI-ARIA tabs pattern: the row is one Tab stop, ← and →
 * go round the tabs and Home and End to the ends, each opening its panel as it is reached; a click
 * opens one too. The panels are `tabpanel`s named by their tabs; the ones not open are hidden, so
 * what is inside them keeps its state. Linked, the open tab's id is the address's hash, and a
 * hash opens its tab once hydrated, the row brought into view since the browser could not scroll
 * to a hidden panel.
 */
export function Tabs({ tabs, label, linked = true, ...panels }: Props) {
  const id = useId();
  const hydrated = useIsHydrated();
  const [chosen, setChosen] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fromHash = linked && hydrated ? namedByHash(tabs) : null;
  const selected = chosen ?? fromHash ?? tabs[0]!.id;
  const tabId = (tab: string) => `${id}-tab-${tab}`;
  const panelId = (tab: string) => (linked ? tab : `${id}-panel-${tab}`);

  useEffect(() => {
    if (fromHash && !chosen) listRef.current?.scrollIntoView({ block: 'start' });
  }, [fromHash, chosen]);

  const choose = (tab: string, focus = false) => {
    // The row stays where it sat on the screen: WebKit clamps the scroll as the old panel hides
    // before the new one shows, and would leave the page at its top (Sean's iPhone, 2026-10-18;
    // docs/LEARNINGS.md), so the switch is rendered at once and the row's place restored.
    keeping(listRef.current, () => flushSync(() => setChosen(tab)));
    if (linked) window.history.replaceState(null, '', `#${tab}`);
    if (focus) document.getElementById(tabId(tab))?.focus();
  };

  // The keys answer on the tabs themselves, the focusable parts; the row is no Tab stop of its own.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const at = tabs.findIndex((tab) => tab.id === selected);
    const moves: Record<string, number | undefined> = {
      ArrowRight: (at + 1) % tabs.length,
      ArrowLeft: (at - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    choose(tabs[next]!.id, true);
  };

  return (
    <div>
      <div ref={listRef} role="tablist" aria-label={label} className={LIST}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            aria-selected={tab.id === selected}
            aria-controls={panelId(tab.id)}
            tabIndex={tab.id === selected ? 0 : -1}
            className={TAB}
            onClick={() => choose(tab.id)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={panelId(tab.id)}
          aria-labelledby={tabId(tab.id)}
          hidden={tab.id !== selected}
          className={PANEL}
        >
          {panels[tab.id] as ReactNode}
        </div>
      ))}
    </div>
  );
}
