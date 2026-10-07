import { getUnit, search } from '@bigsmall/core';
import { useId } from 'react';
import { Button } from '../../../components/Button';
import { CopyIcon } from '../../../components/icons';
import {
  BACK_ITEM,
  SuggestionPanel,
  type SuggestionItem,
} from '../../../components/SuggestionPanel';
import { UnitChip } from '../../../components/UnitChip';

// Gallery-only: a smart input frozen mid-search for "me", so every theme can be checked against
// the field metrics, the nested corners, the bold exponent, and the matched-letter weight.
export function SuggestionSample() {
  const id = useId();
  const milliliter = getUnit('milliliter');
  const query = 'me';
  const items: SuggestionItem[] = [
    BACK_ITEM,
    ...search(query, { limit: 4 }).results.map((result): SuggestionItem =>
      result.kind === 'unit'
        ? { kind: 'unit', key: result.unit.id, unit: result.unit }
        : { kind: 'category', key: `#${result.category.id}`, category: result.category },
    ),
  ];
  const noop = () => undefined;

  return (
    <div className="overflow-hidden rounded-lg border-2 border-line bg-surface shadow-sm">
      <div className="flex h-15 items-center gap-2 pr-2 pl-4">
        <span className="flex-1 font-numeric text-2xl">
          2.5<span className="font-semibold">E</span>-7
        </span>
        {milliliter && <UnitChip unit={milliliter} onOpen={noop} onRemove={noop} />}
        <Button variant="ghost" square nested aria-label="Copy sample value" onClick={noop}>
          <CopyIcon />
        </Button>
      </div>
      <SuggestionPanel
        id={`${id}-listbox`}
        items={items}
        activeIndex={1}
        optionId={(index) => `${id}-option-${index}`}
        query={query}
        scopeName="Volume"
        showCategory={false}
        onPick={noop}
        onHover={noop}
      />
    </div>
  );
}
