import {
  BRAND_CHARTS_SCHEMA,
  hasBrandCharts,
  setBrandCharts,
  type BrandChartsFile,
} from '@bigsmall/core';
import chartsUrl from '@bigsmall/core/data/shoe-brands.json?url';
import { useEffect, useState } from 'react';
import type { ChartsStatus } from './state';

/**
 * The brands' charts, fetched once they are wanted (ADR 0029): the file core is given rather than
 * carries, emitted beside the page's assets with a hash in its name (Vite's `?url` import), so it
 * is cached for good and sits outside the JS bundle. One fetch for the island's life, shared by
 * every caller; cleared when it fails, so a later want tries again.
 */
let loading: Promise<void> | null = null;

/** Whether a fetched file is the charts' file: named by its schema, with charts by brand. */
function isChartsFile(value: unknown): value is BrandChartsFile {
  if (typeof value !== 'object' || value === null) return false;
  const file = value as { schema?: unknown; charts?: unknown };
  return (
    file.schema === BRAND_CHARTS_SCHEMA && typeof file.charts === 'object' && file.charts !== null
  );
}

async function load(): Promise<void> {
  const response = await fetch(chartsUrl);
  if (!response.ok) throw new Error(`${response.status} fetching the brands’ charts`);
  const file: unknown = await response.json();
  if (!isChartsFile(file)) throw new Error('The brands’ charts file has another shape.');
  setBrandCharts(file);
}

/** What the fetch has said so far; loading and idle are read from the want itself. */
type Outcome = 'none' | 'ready' | 'failed';

/**
 * The charts' state for the table's options: idle until wanted (Shoe size open, a brand in the
 * box, or a brand's name begun in the box), loading while fetched, ready once core has them,
 * failed when the fetch did, the rows then waiting with dashes and the line under the table
 * saying so (state.ts, selectShoe). A want after a failure fetches again. The server renders
 * idle: the first render on a client and the server's agree, and the start view needs no chart.
 */
export function useBrandCharts(wanted: boolean): ChartsStatus {
  const [outcome, setOutcome] = useState<Outcome>(() =>
    typeof window !== 'undefined' && hasBrandCharts() ? 'ready' : 'none',
  );
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    // Given already (another want fetched it): settled on the next tick, as a fetch would be.
    const pending = hasBrandCharts() ? Promise.resolve() : (loading ??= load());
    pending.then(
      () => {
        if (live) setOutcome('ready');
      },
      () => {
        loading = null;
        if (live) setOutcome('failed');
      },
    );
    return () => {
      live = false;
    };
  }, [wanted]);
  if (outcome !== 'none') return outcome;
  return wanted ? 'loading' : 'idle';
}
