import { DEFAULT_SEPARATORS, getIngredient, getShoeBrand, getUnit, parse } from '@bigsmall/core';
import { useId, useRef } from 'react';
import { Calculator, SendButton } from '../../../components/Calculator';
import { CategoryMenu } from '../../../components/CategoryMenu';
import { CategoryTiles } from '../../../components/CategoryTiles';
import { ConversionTable } from '../../../components/ConversionTable';
import { EraserIcon, RedoIcon, UndoIcon } from '../../../components/icons';
import { MoreMenu, type MoreMenuItem } from '../../../components/MoreMenu';
import { NumberText } from '../../../components/NumberText';
import { Tabs } from '../../../components/Tabs';
import { UnitMatches } from '../../../components/UnitMatches';
import { ValueField } from '../../../components/ValueField';
import {
  initialState,
  selectTable,
  TABLE_PRECISION,
  type ConverterState,
  type TableRow,
  type TableView,
} from '../../../features/converter/state';
import {
  FRESH_DISPLAY,
  FRESH_RULE,
  sectionsOf,
  shows,
  type Display,
  type ViewRule,
} from '../../../features/converter/settings';
import type { ConverterEnv } from '../../../features/converter/useConverter';

// Gallery-only: the real components in frozen states, so every theme is checked against what
// ships. Nothing here dispatches; typing into a sample changes nothing.

const ENV: ConverterEnv = { locale: 'en-US', separators: DEFAULT_SEPARATORS, system: 'us' };
const noop = () => undefined;
/** A phone's width for the samples that show a row giving way: 320 px, the narrowest supported. */
const PHONE = 'max-w-80';

/** The tools More lists in the gallery: the toolbar's right end, redo with nothing to redo. */
const FOLDED: readonly MoreMenuItem[] = [
  { id: 'undo', label: 'Undo', icon: <UndoIcon />, onPress: noop },
  { id: 'redo', label: 'Redo', icon: <RedoIcon />, onPress: noop, disabled: true },
  { id: 'clear', label: 'Clear all', icon: <EraserIcon />, onPress: noop },
];

/** The field in a frozen state: what is typed, the unit in its chip, and an ingredient or a brand beside it. */
function FieldSample({
  label,
  text,
  unitId,
  ingredientId,
  brandId,
}: {
  label: string;
  text: string;
  unitId: string;
  ingredientId?: string;
  brandId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hint = useId();
  const list = useId();
  return (
    <ValueField
      inputRef={inputRef}
      label={label}
      text={text}
      parsed={parse(text)}
      locale={ENV.locale}
      unit={getUnit(unitId) ?? null}
      ingredient={ingredientId ? (getIngredient(ingredientId) ?? null) : null}
      brand={brandId ? (getShoeBrand(brandId) ?? null) : null}
      placeholder="Number"
      describedBy={hint}
      popup={{ expanded: false, controls: list, activeId: undefined, kind: 'grid' }}
      onChange={noop}
      onKeyDown={noop}
      onClear={noop}
      onChipOpen={noop}
      onChipRemove={noop}
      unitPicks={brandId !== undefined}
      onUnitOpen={noop}
    />
  );
}

/** The calculator mid-sum, one send confirmed beside one with nothing to send. */
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
            <SendButton symbol="mL" confirmed unavailable={false} />
            <SendButton confirmed={false} unavailable />
          </>
        }
      />
    </div>
  );
}

/** The table's view of a state, from the real selector; every unit shows without a rule. */
function tableOf(state: Partial<ConverterState>, rule?: ViewRule): TableView {
  return selectTable({ ...initialState, ...state }, rule ? { ...ENV, rule } : ENV);
}

/** Names on and six significant digits, the way the table showed before Settings. */
const NAMED: Display = { ...FRESH_DISPLAY, names: 'both', places: null };

/** Symbol only: the names off the screen. */
const SYMBOLS: Display = { ...FRESH_DISPLAY, names: 'symbol' };

/** A table in a frozen state: nothing it does changes anything. */
function TableSample({
  view,
  title,
  display = FRESH_DISPLAY,
  rule,
  cursor = -1,
  copied = null,
  editing = false,
  hiddenOpen = false,
  itemId,
}: {
  view: TableView;
  title: string;
  display?: Display;
  rule?: ViewRule;
  cursor?: number;
  copied?: string | null;
  editing?: boolean;
  hiddenOpen?: boolean;
  itemId: (index: number) => string;
}) {
  const id = useId();
  if (view.kind !== 'units') return null;
  return (
    <ConversionTable<TableRow>
      id={id}
      title={title}
      sections={view.sections}
      hidden={view.hidden}
      every={sectionsOf(view.all, ENV.system)}
      message={view.message}
      display={display}
      significant={TABLE_PRECISION}
      locale={ENV.locale}
      cursor={cursor}
      itemId={itemId}
      copied={copied}
      onPick={noop}
      onCopy={noop}
      editing={editing}
      hiddenOpen={hiddenOpen}
      isShown={(row) => !rule || row.inBox || shows(row.unit, rule, ENV.system)}
      onChoose={noop}
      onEditing={noop}
      onHiddenOpen={noop}
    />
  );
}

/**
 * The table's pieces in frozen states, from the real table view: the category menu before and
 * after a category is chosen; the start's categories, the cursor on one; 250 mL in every unit of
 * volume in its sections, names on, milliliters marked as the unit in the box, the cursor on
 * cups, its copy button laid over its end and confirmed; Area chosen with no unit, symbols alone,
 * each value a dash, the symbols lined up on their last letter with their exponents hanging after
 * it; a million square kilometers in a phone's width, the names given way in every row and the
 * exponent markers bold; 6.3 feet as decimals with their fractions (Both); a fresh visit's volume
 * with its Hidden list open, and in Edit; a value with no answer; and the matches for "250 p" from
 * every category, the hidden ones shown. The tables' titles are for screen readers; on the page the
 * category menu over the box names them.
 */
function TableSamples() {
  const id = useId();
  /** Each list's own item ids, as the page shows one list at a time. */
  const itemIds = (list: string) => (index: number) => `${id}-${list}-${index}`;
  const start = tableOf({});
  const values = tableOf({ text: '250', unit: 'milliliter', category: 'volume' });
  const dashes = tableOf({ category: 'area' });
  const narrow = tableOf({ text: '1000000', unit: 'square-kilometer', category: 'area' });
  const matches = tableOf({ text: '250 p' }, FRESH_RULE);
  const feet = tableOf({ text: '6.3', unit: 'foot', category: 'length' });
  const fresh = tableOf({ text: '2', unit: 'us-cup', category: 'volume' }, FRESH_RULE);
  const tooLarge = tableOf({ text: '1e400', unit: 'meter', category: 'length' });
  const cups = values.kind === 'units' ? values.rows.findIndex((row) => row.id === 'us-cup') : -1;
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <CategoryMenu categories={start.categories} value={null} onChoose={noop} />
        <CategoryMenu categories={start.categories} value="volume" onChoose={noop} />
      </div>
      {/* More, closed and open: the tools a toolbar's row had no room for (ADR 0023). */}
      <div className="flex min-h-44 justify-end gap-3">
        <MoreMenu items={FOLDED} />
        <MoreMenu items={FOLDED} openAtFirst />
      </div>
      {/* Tabs: a few views of one place, the tab their title (the About page). */}
      <Tabs
        label="Tabs sample"
        linked={false}
        tabs={[
          { id: 'one', label: 'Feedback' },
          { id: 'two', label: 'Every formula' },
        ]}
        one={<p className="text-sm text-ink-muted">The first view, open at rest.</p>}
        two={<p className="text-sm text-ink-muted">The second view.</p>}
      />
      {start.kind === 'start' && (
        <CategoryTiles
          id={`${id}-start`}
          categories={start.categories}
          cursor={2}
          itemId={itemIds('start')}
          onPick={noop}
        />
      )}
      <TableSample
        view={values}
        title="Volume"
        display={NAMED}
        cursor={cups}
        copied="us-cup"
        itemId={itemIds('values')}
      />
      <TableSample
        view={dashes}
        title="Area, no unit yet, symbols only"
        display={SYMBOLS}
        itemId={itemIds('dashes')}
      />
      <div className={PHONE}>
        <TableSample
          view={narrow}
          title="Area, on a phone"
          display={NAMED}
          itemId={itemIds('narrow')}
        />
      </div>
      <TableSample
        view={feet}
        title="Length, decimals and fractions"
        display={{ ...FRESH_DISPLAY, format: 'both' }}
        itemId={itemIds('both')}
      />
      <div className={PHONE}>
        <TableSample
          view={feet}
          title="Length, decimals and fractions, on a phone"
          display={{ ...FRESH_DISPLAY, format: 'both' }}
          itemId={itemIds('both-narrow')}
        />
      </div>
      <TableSample
        view={fresh}
        title="Volume, its hidden units"
        rule={FRESH_RULE}
        hiddenOpen
        itemId={itemIds('hidden')}
      />
      <TableSample
        view={fresh}
        title="Volume, in Edit"
        rule={FRESH_RULE}
        editing
        itemId={itemIds('edit')}
      />
      <TableSample view={tooLarge} title="Length" itemId={itemIds('message')} />
      {/* Cooking: Weight, then Volume, the weights measured through the flour's density (≈). */}
      <TableSample
        view={tableOf({
          text: '2',
          unit: 'us-cup',
          ingredient: 'all-purpose-flour',
          category: 'cooking',
        })}
        title="Cooking, all-purpose flour"
        itemId={itemIds('cooking')}
      />
      {matches.kind === 'matches' && (
        <UnitMatches
          id={`${id}-matches`}
          hiddenId={`${id}-matches-hidden`}
          matches={matches.rows}
          counts={matches.counts}
          query={matches.query}
          notFound=""
          cursor={1}
          itemId={itemIds('matches')}
          onPick={noop}
          hidden={matches.hidden}
          revealed
          onReveal={noop}
          symbolOnly={false}
        />
      )}
    </>
  );
}

export function FieldSamples({ theme }: { theme: string }) {
  return (
    <div className="grid gap-3">
      {/* A long number with its exponent marker in bold, the chip giving up its name for it. */}
      <FieldSample label={`${theme} exponent sample`} text="1.23456789E23" unitId="millimeter" />
      {/* Arithmetic, its running value following it in the muted color. */}
      <FieldSample label={`${theme} arithmetic sample`} text="12×3" unitId="liter" />
      {/* Empty, its placeholder saying what it takes. */}
      <FieldSample label={`${theme} empty sample`} text="" unitId="" />
      {/* Cooking's two pills, the unit and the ingredient (ADR 0021), and on a phone, where they
          take a line of their own under the number. */}
      <FieldSample
        label={`${theme} cooking sample`}
        text="2"
        unitId="us-cup"
        ingredientId="all-purpose-flour"
      />
      <div className={PHONE}>
        <FieldSample
          label={`${theme} cooking phone sample`}
          text="250"
          unitId="us-cup"
          ingredientId="brown-sugar"
        />
      </div>
      {/* Shoe size's two pills, the scale and the brand (ADR 0028), the same shape. */}
      <FieldSample label={`${theme} shoe brand sample`} text="10" unitId="us-men" brandId="nike" />
      <CalculatorSample />
      <TableSamples />
    </div>
  );
}
