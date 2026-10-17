import {
  DEFAULT_SEPARATORS,
  getUnit,
  parse,
  type Category,
  type CategoryId,
  type Unit,
} from '@bigsmall/core';
import { useId, useRef, useState, type ReactNode } from 'react';
import { CategoryMenu } from '../../../components/CategoryMenu';
import {
  ConversionTable,
  type ConversionRow,
  type RowSection,
} from '../../../components/ConversionTable';
import { ChevronDownIcon, CloseIcon } from '../../../components/icons';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { UnitChip } from '../../../components/UnitChip';
import { ValueField } from '../../../components/ValueField';
import { FRESH_DISPLAY } from '../../../features/converter/settings';
import { initialState, selectTable } from '../../../features/converter/state';
import type { ConverterEnv } from '../../../features/converter/useConverter';
import {
  cx,
  FIELD_ROW,
  GROUP_TITLE,
  MENU_CHEVRON,
  NUMBER_SIZES,
  SHELL,
} from '../../../lib/recipes';

/*
 * Mock-ups of categories bigsmall does not have yet (docs/research/categories-1.md): cooking by
 * ingredient (pace and a temperature change, built on 2026-10-16, have left), drawn with the real box, table, and menus in
 * frozen states, as the gallery draws them. Nothing converts: every value is worked out by hand
 * for the mock, and is checked against its standard when the category is built (ADR 0020).
 */

const ENV: ConverterEnv = { locale: 'en-US', separators: DEFAULT_SEPARATORS, system: 'us' };
const noop = () => undefined;

/** Cooking, built since (ADR 0021): the mocks below are its lab rounds, kept until the lab retires. */
const COOKING = { id: 'cooking' as CategoryId };

/** The menu's categories, as the converter lists them. */
function menuCategories(): Category[] {
  return selectTable(initialState, ENV).categories;
}

/** A unit the engine has, for a chip. */
function unit(id: string): Unit {
  const found = getUnit(id);
  if (!found) throw new Error(`no unit ${id}`);
  return found;
}

/** A unit the engine does not have yet, for a chip: only its names show. */
function proposedUnit(
  category: CategoryId,
  id: string,
  symbol: string,
  name: string,
  plural: string,
): Unit {
  return {
    id,
    category,
    name,
    plural,
    symbol,
    aliases: [],
    system: 'si',
    tier: 'standard',
    exact: true,
    source: 'A mock-up (/dev/categories-lab)',
    kind: 'linear',
    factor: 1,
  };
}

/** A row as a mock lists it: its symbol, name, and value as the table would write it. */
interface MockRow {
  id: string;
  symbol: string;
  name: string;
  text: string;
  inBox?: boolean;
}

interface Mock {
  /** What the mock shows, over it. */
  caption: ReactNode;
  /** The category the menu shows chosen. */
  category: CategoryId;
  /** What the box holds, and the unit in its chip. */
  text: string;
  unit: Unit;
  /** A control beside the category menu (the ingredient's). */
  tool?: ReactNode;
  /** A box drawn still in place of the real one (two pills, which the real box cannot hold yet). */
  box?: ReactNode;
  sections: ReadonlyArray<{ label: string; rows: readonly MockRow[] }>;
  /** A line under the table. */
  note?: ReactNode;
  /** New in the latest round, marked so it is found (Sean, 2026-10-16: the new ones were missed). */
  fresh?: boolean;
}

/** A row of a unit the engine has, named as the table names it. */
function row(id: string, text: string, inBox = false): MockRow {
  const found = unit(id);
  return { id, symbol: found.symbol, name: found.plural, text, inBox };
}

function toRow({ id, symbol, name, text, inBox = false }: MockRow): ConversionRow {
  return { id, symbol, name, text, value: null, tone: 'value', inBox };
}

/** Marks a mock new in the latest round. */
const NEW_TAG = 'rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-ink';

/** A menu not built yet, drawn still as the category menu's trigger is at rest (MENU_TRIGGER). */
const STAND_IN = 'my-0.5 flex h-11 items-center gap-2 px-3 text-sm text-ink';

/** The box drawn still, as the real one is at rest (ValueField's shell and row). */
const BOX_STAND_IN = cx(
  'min-w-0 overflow-hidden rounded-lg border-edge bg-surface shadow-sm',
  SHELL,
);

/** A second pill in the box: an ingredient, drawn as a unit's chip is (UnitChip). */
const INGREDIENT_PILL =
  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-nested bg-accent-soft pr-2 pl-3 text-ink';

/** "2 cups flour" in the box as two pills: the unit's chip, then the ingredient's. */
function TwoPillBox({
  text,
  unitChip,
  ingredient,
}: {
  text: string;
  unitChip: Unit;
  ingredient: string;
}) {
  return (
    <div className={BOX_STAND_IN}>
      <div className={FIELD_ROW}>
        <span className={cx('min-w-0 flex-1 font-numeric text-ink', NUMBER_SIZES[0])}>{text}</span>
        <UnitChip unit={unitChip} compact={false} onOpen={noop} onRemove={noop} />
        <span className={INGREDIENT_PILL}>
          {ingredient}
          <CloseIcon width="16" height="16" className="text-ink-muted" />
        </span>
      </div>
    </div>
  );
}

/** A static stand-in for a menu not built yet. */
function MenuStandIn({ label, name }: { label: string; name: string }) {
  return (
    <span className="flex h-12 items-center" title={`${label}: a menu, once built`}>
      <span className={STAND_IN}>
        <span className="sr-only">{label} </span>
        {name}
        <ChevronDownIcon width="16" height="16" className={MENU_CHEVRON} />
      </span>
    </span>
  );
}

/** One mock: the toolbar's menus, the box, the table, and a line under it. */
function MockView({
  mock,
  phone,
  categories,
}: {
  mock: Mock;
  phone: boolean;
  categories: readonly Category[];
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const sections: RowSection<ConversionRow>[] = mock.sections.map((section, at) => ({
    key: `${at}`,
    label: section.label,
    rows: section.rows.map(toRow),
  }));
  const label =
    typeof mock.caption === 'string' ? mock.caption : `${mock.text} ${mock.unit.symbol}`;
  return (
    <figure className={cx('m-0 w-full', phone ? 'max-w-90' : 'max-w-xl')}>
      <figcaption className="mb-3 max-w-prose text-sm text-ink-muted">
        {mock.fresh && <span className={cx(NEW_TAG, 'mr-2')}>New</span>}
        {mock.caption}
      </figcaption>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <CategoryMenu categories={categories} value={mock.category} onChoose={noop} />
        {mock.tool}
      </div>
      {mock.box ?? (
        <ValueField
          inputRef={inputRef}
          label={`Value, ${label}`}
          text={mock.text}
          parsed={parse(mock.text)}
          locale={ENV.locale}
          unit={mock.unit}
          placeholder="Number or unit"
          describedBy={`${id}-note`}
          popup={{ expanded: false, controls: `${id}-table`, activeId: undefined, kind: 'grid' }}
          onChange={noop}
          onKeyDown={noop}
          onClear={noop}
          onChipOpen={noop}
          onChipRemove={noop}
        />
      )}
      <div className="@container mt-2">
        <ConversionTable<ConversionRow>
          id={`${id}-table`}
          title={`${label}, a mock-up`}
          sections={sections}
          hidden={[]}
          every={sections}
          message={null}
          display={FRESH_DISPLAY}
          locale={ENV.locale}
          cursor={-1}
          itemId={(index) => `${id}-row-${index}`}
          copied={null}
          onPick={noop}
          onCopy={noop}
          editing={false}
          hiddenOpen={false}
          isShown={() => true}
          onChoose={noop}
          onEditing={noop}
          onHiddenOpen={noop}
        />
      </div>
      <p id={`${id}-note`} className="mt-2 max-w-prose text-sm text-ink-muted">
        {mock.note}
      </p>
    </figure>
  );
}

// Cooking by ingredient: volume and weight together, through the ingredient's density.

const STICK = proposedUnit(COOKING.id, 'stick', 'stick', 'stick', 'sticks');

const FLOUR_NOTE =
  'All-purpose flour: about 125 g a cup, spooned and leveled (USDA FoodData Central). Sifted or scooped, it moves by a tenth or more, so weights show ≈. The cup is the US cup, 236.6 mL; the metric cup is 250 mL, a US nutrition label’s 240 mL.';

const FLOUR = <MenuStandIn label="Ingredient" name="All-purpose flour" />;

const COOKING_MOCKS: readonly Mock[] = [
  {
    caption:
      'A: “2 cups flour”, the ingredient in a menu by the category; weight first, then volume.',
    category: COOKING.id,
    text: '2',
    unit: unit('us-cup'),
    tool: FLOUR,
    sections: [
      {
        label: 'Weight',
        rows: [
          row('gram', '≈ 250.00'),
          row('kilogram', '≈ 0.25'),
          row('ounce', '≈ 8.82'),
          row('pound', '≈ 0.55'),
        ],
      },
      {
        label: 'Volume',
        rows: [
          row('us-cup', '2.00', true),
          row('us-tablespoon', '32.00'),
          row('us-teaspoon', '96.00'),
          row('us-fluid-ounce', '16.00'),
          row('milliliter', '473.18'),
          row('liter', '0.47'),
        ],
      },
    ],
    note: FLOUR_NOTE,
  },
  {
    caption: 'B: the same, by system, as every table is today.',
    category: COOKING.id,
    text: '2',
    unit: unit('us-cup'),
    tool: FLOUR,
    sections: [
      {
        label: 'US (customary)',
        rows: [
          row('us-cup', '2.00', true),
          row('us-tablespoon', '32.00'),
          row('us-teaspoon', '96.00'),
          row('us-fluid-ounce', '16.00'),
          row('ounce', '≈ 8.82'),
          row('pound', '≈ 0.55'),
        ],
      },
      {
        label: 'Metric',
        rows: [
          row('milliliter', '473.18'),
          row('liter', '0.47'),
          row('gram', '≈ 250.00'),
          row('kilogram', '≈ 0.25'),
        ],
      },
    ],
  },
  {
    caption: 'C: an ingredient’s own unit, “1 stick butter”.',
    category: COOKING.id,
    text: '1',
    unit: STICK,
    tool: <MenuStandIn label="Ingredient" name="Butter" />,
    sections: [
      {
        label: 'Butter',
        rows: [{ id: 'stick', symbol: 'stick', name: 'stick', text: '1.00', inBox: true }],
      },
      {
        label: 'Weight',
        rows: [row('gram', '113.40'), row('ounce', '4.00'), row('pound', '0.25')],
      },
      {
        label: 'Volume',
        rows: [
          row('us-cup', '≈ 0.50'),
          row('us-tablespoon', '≈ 8.00'),
          row('milliliter', '≈ 118.29'),
        ],
      },
    ],
    note: 'A US stick of butter is a quarter pound, 113.4 g; its 8 tablespoons are the wrapper’s marks, so its volumes show ≈.',
  },
  {
    caption: 'D, your idea: two pills in the box, the unit and the ingredient, each removable.',
    fresh: true,
    category: COOKING.id,
    text: '2',
    unit: unit('us-cup'),
    box: <TwoPillBox text="2" unitChip={unit('us-cup')} ingredient="all-purpose flour" />,
    sections: [
      {
        label: 'Weight',
        rows: [
          row('gram', '≈ 250.00'),
          row('kilogram', '≈ 0.25'),
          row('ounce', '≈ 8.82'),
          row('pound', '≈ 0.55'),
        ],
      },
      {
        label: 'Volume',
        rows: [
          row('us-cup', '2.00', true),
          row('us-tablespoon', '32.00'),
          row('milliliter', '473.18'),
        ],
      },
    ],
    note: 'Removing the flour pill leaves 2 cups in Volume; removing the cup leaves flour, waiting for an amount.',
  },
];

interface Part {
  id: string;
  title: string;
  intro: ReactNode;
  /** In plain words: how it would read, and where it could confuse (Sean, 2026-10-16). */
  explain: readonly ReactNode[];
  mocks: readonly Mock[];
  questions: readonly ReactNode[];
}

/** The baking staples to start with, each with its grams per cup from USDA FoodData Central once built. */
const INGREDIENTS =
  'Flours (all-purpose, bread, whole wheat, cake, almond), sugars (granulated, brown packed, powdered), butter, oils (vegetable, olive), shortening, milk, heavy cream, sour cream, yogurt, shredded cheese, water, honey, maple syrup, molasses, cocoa powder, rolled oats, rice (uncooked), cornstarch, baking soda, baking powder, table salt, instant yeast, chocolate chips, chopped nuts, peanut butter, and eggs (large, counted).';

const PARTS: readonly Part[] = [
  {
    id: 'cooking',
    title: 'Cooking by ingredient',
    intro:
      'A cup of flour weighs about 125 g, a cup of sugar about 200 g: between volume and weight, the ingredient decides. Typing “2 cups flour” would read the ingredient and show the amount in every unit, weights and volumes together.',
    explain: [
      'The use: a recipe in cups and a scale in grams, or the reverse. Volume and weight measure different things, so only the ingredient connects them: a cup of flour is about 125 g, of sugar about 200 g, of butter 227 g. Without it no converter can say how many grams 2 cups of flour is; Google’s cannot, and it is one of the most searched conversions.',
      'What Cooking adds: one table with the ingredient’s weights and volumes together, the same amount in each. Not length: an ingredient changes only how volume and weight relate.',
      'Two pills (D, your idea): the box reads “2 · cups · all-purpose flour”, each pill removable, so the box says the whole question. My recommendation: D, weight first.',
      `The ingredients, about thirty to start: ${INGREDIENTS}`,
    ],
    mocks: COOKING_MOCKS,
    questions: [
      'The ingredient as a second pill in the box (D), or in a menu beside the category (A).',
      'Weight first, then volume (A), or by system as every table is today (B).',
      'Weights to two places, as every table writes them (≈ 250.00 g), or to the gram for cooking.',
      'The US cup for a US visitor and the metric cup elsewhere, the cup’s definition said under the table either way.',
      'An ingredient’s own units, a stick of butter or an egg, each with its source (C).',
    ],
  },
];

type Width = 'wide' | 'phone';

const WIDTHS = [
  { value: 'wide', label: 'Wide' },
  { value: 'phone', label: 'Phone' },
] as const;

/**
 * The lab: each proposed category's mocks, wide or at a phone's width, then the questions it
 * leaves for Sean. The theme menu in the header shows them in every theme.
 */
export function CategoriesLab() {
  const [width, setWidth] = useState<Width>('wide');
  const categories = menuCategories();
  const phone = width === 'phone';
  return (
    <div className="mt-6 grid gap-12">
      <fieldset className="grid w-fit">
        <legend className={GROUP_TITLE}>Width</legend>
        <SegmentedControl name="mock-width" options={WIDTHS} value={width} onChange={setWidth} />
      </fieldset>
      <p className="max-w-prose rounded-md border border-line bg-surface p-3 text-sm">
        <span className={cx(NEW_TAG, 'mr-2')}>New</span>
        In this round (2026-10-16): Cooking D, two pills in the box, marked New; the part says how
        it reads, with a recommendation. Pace (B), a temperature change (D), and the open category
        menu were decided and built, and have left the lab.
      </p>
      {PARTS.map((part) => (
        <section key={part.id} aria-labelledby={`part-${part.id}`} className="grid gap-6">
          <div className="grid max-w-prose gap-2">
            <h2 id={`part-${part.id}`} className="font-display text-xl font-semibold">
              {part.title}
            </h2>
            <p className="text-sm text-ink-muted">{part.intro}</p>
            <ul className="grid list-disc gap-1 pl-5 text-sm">
              {part.explain.map((line, at) => (
                <li key={at}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-10">
            {part.mocks.map((mock, at) => (
              <MockView key={at} mock={mock} phone={phone} categories={categories} />
            ))}
          </div>
          <div className="grid max-w-prose gap-2">
            <h3 className={GROUP_TITLE}>To decide</h3>
            <ol className="grid list-decimal gap-1 pl-5 text-sm">
              {part.questions.map((question, at) => (
                <li key={at}>{question}</li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
