import { convert, regionDefaults } from '@bigsmall/core';
import { useSyncExternalStore } from 'react';
import { detectRegion } from '../../lib/region';

// Milestone 0 placeholder: proves the core package, hydration, and region policy end to end.
// Replaced by the real two-box converter in milestone 2 (docs/UX-SPEC.md).

let cachedRegion: string | undefined;
let detected = false;
function getRegionSnapshot(): string | undefined {
  if (!detected) {
    cachedRegion = detectRegion();
    detected = true;
  }
  return cachedRegion;
}
const noSubscribe = () => () => {};

export function ConverterPreview() {
  const region = useSyncExternalStore(noSubscribe, getRegionSnapshot, () => undefined);
  const defaults = regionDefaults(region);
  const km = convert(1, 'mile', 'kilometer');

  return (
    <section aria-labelledby="preview-heading" className="mt-8 rounded-lg bg-surface p-6 shadow-md">
      <h2 id="preview-heading" className="text-sm font-medium text-ink-muted">
        Engine check
      </h2>
      <p className="mt-2 font-numeric text-4xl font-semibold tracking-tight">1 mi = {km} km</p>
      <p className="mt-3 text-sm text-ink-muted">
        Region {region ?? 'unknown'} → {defaults.system} units by default.
      </p>
    </section>
  );
}
