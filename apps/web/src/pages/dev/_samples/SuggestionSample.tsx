import { getUnit, search } from '@bigsmall/core';
import { useId } from 'react';
import { SuggestionPanel, type SuggestionItem } from '../../../components/SuggestionPanel';
import { UnitChip } from '../../../components/UnitChip';

// Gallery-only: a smart input frozen mid-search so every theme can be checked against it.
export function SuggestionSample() {
  const id = useId();
  const milliliter = getUnit('milliliter');
  const items: SuggestionItem[] = search('m', { limit: 4 }).results.map((result) =>
    result.kind === 'unit'
      ? { kind: 'unit', key: result.unit.id, unit: result.unit }
      : { kind: 'category', key: `#${result.category.id}`, category: result.category },
  );
  const noop = () => undefined;

  return (
    <div className="rounded-lg border border-line bg-surface shadow-sm">
      <div className="flex min-h-14 items-center gap-2 px-3">
        {milliliter && <UnitChip unit={milliliter} onRemove={noop} />}
        <span className="font-numeric text-2xl">5</span>
      </div>
      <SuggestionPanel
        id={`${id}-listbox`}
        items={items}
        activeIndex={0}
        optionId={(index) => `${id}-option-${index}`}
        showCategory
        onPick={noop}
        onHover={noop}
      />
    </div>
  );
}
