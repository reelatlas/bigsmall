import { DEFAULT_SEPARATORS, getUnit, parse, search } from '@bigsmall/core';
import { useId } from 'react';
import { Button } from '../../../components/Button';
import { CheckIcon } from '../../../components/icons';
import { Calculator, SendButton } from '../../../components/Calculator';
import {
  BACK_ITEM,
  SuggestionPanel,
  type SuggestionItem,
} from '../../../components/SuggestionPanel';
import { SmartInput } from '../../../features/converter/SmartInput';
import type { BoxView } from '../../../features/converter/state';
import type { ConverterEnv } from '../../../features/converter/useConverter';
import { FIELD_ROW, SHELL, SHELL_BORDERED } from '../../../lib/shell';

// Gallery-only: the real field in frozen states, so every theme is checked against what ships.
// Nothing here dispatches; typing into a sample changes nothing.

const ENV: ConverterEnv = { locale: 'en-US', separators: DEFAULT_SEPARATORS, system: 'us' };
const noop = () => undefined;

function frozen(
  text: string,
  unitId: string,
  message: string | null = null,
  isSource = false,
): BoxView {
  const unit = getUnit(unitId) ?? null;
  return {
    id: isSource ? 'a' : 'b',
    text,
    unit,
    isSource,
    parsed: parse(text),
    scope: unit?.category ?? null,
    message,
  };
}

/** A result with an exponent, its chip collapsed to the symbol, and a copy button showing its check. */
function ResultSample({ label }: { label: string }) {
  const hint = useId();
  return (
    <SmartInput
      box={frozen('1.23456789E23', 'millimeter')}
      label={label}
      describedBy={hint}
      mode="basic"
      env={ENV}
      dispatch={noop}
      escapeTarget={null}
      examples=""
      counterpart={null}
      trailing={
        <Button variant="ghost" square nested tabIndex={-1} aria-label="Copy sample value">
          <CheckIcon className="text-success" />
        </Button>
      }
    />
  );
}

/** A result that cannot be shown: the message in place of a value, the chip collapsed. */
function OutOfRangeSample({ label }: { label: string }) {
  const hint = useId();
  return (
    <SmartInput
      box={frozen('', 'millimeter', 'Too large to convert')}
      label={label}
      describedBy={hint}
      mode="basic"
      env={ENV}
      dispatch={noop}
      escapeTarget={null}
      examples=""
      counterpart={null}
    />
  );
}

/** Arithmetic typed into a box: its running value follows it in the muted color. */
function ArithmeticSample({ label }: { label: string }) {
  const hint = useId();
  return (
    <SmartInput
      box={frozen('12×3', 'liter', null, true)}
      label={label}
      describedBy={hint}
      mode="basic"
      env={ENV}
      dispatch={noop}
      escapeTarget={null}
      examples=""
      counterpart={null}
    />
  );
}

/** The calculator mid-sum, as it opens below the boxes, one send confirmed. */
function CalculatorSample() {
  return (
    <div className="max-w-sm">
      <Calculator
        entry="12×3"
        running="36"
        decimalMark="."
        onPress={noop}
        onClose={noop}
        footer={
          <>
            <SendButton ordinal="1st" symbol="mL" confirmed />
            <SendButton ordinal="2nd" confirmed={false} />
          </>
        }
      />
    </div>
  );
}

/**
 * An open field mid-search: "5 me" typed while the other box is in Length, so the list is the
 * Length units with the Back row, the best match highlighted, and the matched letters heavier.
 * Drawn from the same shell and row classes as the real field.
 */
function OpenSample() {
  const id = useId();
  const query = 'me';
  const items: SuggestionItem[] = [
    BACK_ITEM,
    ...search(query, { category: 'length', limit: 4 }).results.map((result): SuggestionItem =>
      result.kind === 'unit'
        ? { kind: 'unit', key: result.unit.id, unit: result.unit }
        : { kind: 'category', key: `#${result.category.id}`, category: result.category },
    ),
  ];
  return (
    <div className="group" data-open>
      <div className={`rounded-lg ${SHELL} ${SHELL_BORDERED}`}>
        <div className={FIELD_ROW}>
          <span className="flex-1 font-numeric text-2xl text-ink sm:text-3xl">5 me</span>
        </div>
        <SuggestionPanel
          id={`${id}-listbox`}
          label="Sample suggestions"
          items={items}
          activeIndex={1}
          query={query}
          scopeName="Length"
          showCategory={false}
          onPick={noop}
          onHover={noop}
        />
      </div>
    </div>
  );
}

export function FieldSamples({ theme }: { theme: string }) {
  return (
    <div className="grid gap-3">
      <ResultSample label={`${theme} result sample`} />
      <OutOfRangeSample label={`${theme} out-of-range sample`} />
      <ArithmeticSample label={`${theme} arithmetic sample`} />
      <OpenSample />
      <CalculatorSample />
    </div>
  );
}
