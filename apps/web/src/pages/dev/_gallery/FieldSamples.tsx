import { DEFAULT_SEPARATORS, getUnit, parse, search } from '@bigsmall/core';
import { useId, useState } from 'react';
import { Button } from '../../../components/Button';
import { CopiedIcon } from '../../../components/icons';
import { Calculator, SendButton } from '../../../components/Calculator';
import { CategoryMenu } from '../../../components/CategoryMenu';
import { CategoryTiles } from '../../../components/CategoryTiles';
import { ConversionTable } from '../../../components/ConversionTable';
import { LayoutSwitch } from '../../../components/LayoutSwitch';
import { NumberText } from '../../../components/NumberText';
import {
  BACK_ITEM,
  SuggestionPanel,
  toSuggestionItem,
  type SuggestionItem,
} from '../../../components/SuggestionPanel';
import { UnitMatches } from '../../../components/UnitMatches';
import { SmartInput } from '../../../features/converter/SmartInput';
import {
  initialState,
  selectTable,
  type BoxView,
  type ConverterState,
  type TableView,
} from '../../../features/converter/state';
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

/** The table layout's view of a state, from the real selector. */
function tableOf(state: Partial<ConverterState>): TableView {
  return selectTable({ ...initialState, ...state }, { ...ENV, tier: 'basic' });
}

/**
 * The table layout's pieces in frozen states, from the real table view: the category menu before
 * and after a category is chosen; the start's categories, the cursor on one; 250 mL in every unit
 * of volume, milliliters marked as the unit in the box, the cursor on cups and one copy
 * confirmed; Volume chosen with no unit, each value a dash; a value with no answer; and the
 * matches for "250 p" from every category. The tables' titles are for screen readers; on the page
 * the category menu over the box names them.
 */
function TableSamples() {
  const id = useId();
  /** Each list's own item ids, as each table layout has one list at a time. */
  const itemIds = (list: string) => (index: number) => `${id}-${list}-${index}`;
  const start = tableOf({});
  const values = tableOf({ a: { text: '250', unit: 'milliliter' }, category: 'volume' });
  const dashes = tableOf({ a: { text: '', unit: null }, category: 'volume' });
  const matches = tableOf({ a: { text: '250 p', unit: null } });
  const cups = values.kind === 'units' ? values.rows.findIndex((row) => row.id === 'us-cup') : -1;
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <CategoryMenu categories={start.categories} value={null} onChoose={noop} />
        <CategoryMenu categories={start.categories} value="volume" onChoose={noop} />
      </div>
      {start.kind === 'start' && (
        <CategoryTiles
          id={`${id}-start`}
          categories={start.categories}
          cursor={2}
          itemId={itemIds('start')}
          onPick={noop}
        />
      )}
      {values.kind === 'units' && (
        <ConversionTable
          id={`${id}-values`}
          title="Volume"
          rows={values.rows}
          message={null}
          cursor={cups}
          itemId={itemIds('values')}
          copied="liter"
          onPick={noop}
          onCopy={noop}
        />
      )}
      {dashes.kind === 'units' && (
        <ConversionTable
          id={`${id}-dashes`}
          title="Volume, no unit yet"
          rows={dashes.rows}
          message={null}
          cursor={-1}
          itemId={itemIds('dashes')}
          copied={null}
          onPick={noop}
          onCopy={noop}
        />
      )}
      <ConversionTable
        id={`${id}-message`}
        title="Length"
        rows={[]}
        message="Too large to convert"
        cursor={-1}
        itemId={itemIds('message')}
        copied={null}
        onPick={noop}
        onCopy={noop}
      />
      {matches.kind === 'matches' && (
        <UnitMatches
          id={`${id}-matches`}
          matches={matches.rows}
          counts={matches.counts}
          query={matches.query}
          notFound=""
          cursor={1}
          itemId={itemIds('matches')}
          onPick={noop}
        />
      )}
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
      <TableSamples />
      <LayoutSwitchSample />
    </div>
  );
}
