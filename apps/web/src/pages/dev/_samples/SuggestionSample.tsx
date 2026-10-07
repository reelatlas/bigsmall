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
    <div className="overflow-hidden rounded-lg border-2 border-line bg-surface shadow-sm">
      <div className="flex h-13 items-center gap-2 px-3">
        <span className="flex-1 font-numeric text-2xl">
          2.5<span className="font-semibold">E</span>-7
        </span>
        {milliliter && <UnitChip unit={milliliter} onRemove={noop} />}
      </div>
      <SuggestionPanel
        id={`${id}-listbox`}
        items={items}
        activeIndex={0}
        optionId={(index) => `${id}-option-${index}`}
        onBack={noop}
        scopeName="Volume"
        showCategory={false}
        onPick={noop}
        onHover={noop}
      />
    </div>
  );
}
