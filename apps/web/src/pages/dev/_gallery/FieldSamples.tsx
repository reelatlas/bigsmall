import { DEFAULT_SEPARATORS, getUnit, parse, search } from '@bigsmall/core';
import { useId, useState } from 'react';
import { Button } from '../../../components/Button';
import { CopiedIcon } from '../../../components/icons';
import { Calculator, SendButton } from '../../../components/Calculator';
import { ConversionTable } from '../../../components/ConversionTable';
import { LayoutSwitch } from '../../../components/LayoutSwitch';
import { NumberText } from '../../../components/NumberText';
import {
  BACK_ITEM,
  SuggestionPanel,
  toSuggestionItem,
  type SuggestionItem,
} from '../../../components/SuggestionPanel';
import { SmartInput } from '../../../features/converter/SmartInput';
import { initialState, selectTable, type BoxView } from '../../../features/converter/state';
import type { ConverterEnv } from '../../../features/converter/useConverter';
import type { Layout } from '../../../lib/layout';
import { cx, FIELD_ROW, NUMBER_SIZES, SHELL, SHELL_BORDERED } from '../../../lib/recipes';

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
      onEnter={noop}
      escapeTarget={null}
      examples=""
      counterpart={null}
      trailing={
        <Button variant="ghost" square nested tabIndex={-1} aria-label="Copy sample value">
          <CopiedIcon />
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
      onEnter={noop}
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
      onEnter={noop}
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
        display={<NumberText text="12×3" parsed={parse('12×3')} running="36" />}
        decimalMark="."
        onPress={noop}
        onEscape={noop}
        onClose={noop}
        focusOnOpen={false}
        footer={
          <>
            <SendButton ordinal="1st" symbol="mL" confirmed unavailable={false} />
            <SendButton ordinal="2nd" confirmed={false} unavailable={false} />
            <SendButton symbol="mL" confirmed={false} unavailable />
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
    ...search(query, { category: 'length', limit: 4 }).results.map(toSuggestionItem),
  ];
  return (
    <div className="group" data-open>
      <div className={cx('rounded-lg', SHELL, SHELL_BORDERED)}>
        <div className={FIELD_ROW}>
          <span className={cx('flex-1 font-numeric text-ink', NUMBER_SIZES[0])}>5 me</span>
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

/**
 * The table layout's rows for 250 mL with cups heading them, from the real table view: milliliters
 * marked as the unit in the box, one copy confirmed. A second table shows a value with no answer.
 */
function TableSample() {
  const table = selectTable(
    {
      ...initialState,
      a: { text: '250', unit: 'milliliter' },
      b: { text: '', unit: 'us-cup' },
    },
    { ...ENV, tier: 'basic' },
  );
  if (!table) return null;
  return (
    <>
      <ConversionTable
        title="Volume"
        headline={table.headline}
        rows={table.rows}
        message={null}
        copied="liter"
        onUse={noop}
        onCopy={noop}
      />
      <ConversionTable
        title="Length"
        headline={null}
        rows={[]}
        message="Too large to convert"
        copied={null}
        onUse={noop}
        onCopy={noop}
      />
    </>
  );
}

/** The header's layout switch, live here so both options' looks can be checked. */
function LayoutSwitchSample() {
  const [layout, setLayout] = useState<Layout>('table');
  return (
    <div className="flex">
      <LayoutSwitch value={layout} onChange={setLayout} />
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
      <TableSample />
      <LayoutSwitchSample />
    </div>
  );
}
