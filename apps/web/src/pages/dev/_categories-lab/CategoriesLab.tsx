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
import { ChevronDownIcon } from '../../../components/icons';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { ValueField } from '../../../components/ValueField';
import { FRESH_DISPLAY } from '../../../features/converter/settings';
import { initialState, selectTable } from '../../../features/converter/state';
import type { ConverterEnv } from '../../../features/converter/useConverter';
import { cx, GROUP_TITLE, MENU_CHEVRON } from '../../../lib/recipes';

/*
 * Mock-ups of categories bigsmall does not have yet (docs/research/categories-1.md): pace, a
 * temperature change, and cooking by ingredient, drawn with the real box, table, and menus in
 * frozen states, as the gallery draws them. Nothing converts: every value is worked out by hand
 * for the mock, and is checked against its standard when the category is built (ADR 0020).
 */

const ENV: ConverterEnv = { locale: 'en-US', separators: DEFAULT_SEPARATORS, system: 'us' };
const noop = () => undefined;

/** A category the menu does not have yet, so a mock's menu can show it chosen. */
function proposedCategory(id: string, name: string): Category {
  return {
    id: id as CategoryId,
    name,
    aliases: [],
    baseUnit: '',
    tier: 'basic',
    group: 'everyday',
  };
}

const TEMPERATURE_CHANGE = proposedCategory('temperature-change', 'Temperature change');
const COOKING = proposedCategory('cooking', 'Cooking');

/** The menu's categories with the proposed ones where they would sit. */
function menuCategories(): Category[] {
  const view = selectTable(initialState, ENV);
  return view.categories.flatMap((category) => {
    if (category.id === 'temperature') return [category, TEMPERATURE_CHANGE];
    if (category.id === 'volume') return [category, COOKING];
    return [category];
  });
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
    tier: 'basic',
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
  sections: ReadonlyArray<{ label: string; rows: readonly MockRow[] }>;
  /** A line under the table. */
  note?: ReactNode;
}

/** A row of a unit the engine has, named as the table names it. */
function row(id: string, text: string, inBox = false): MockRow {
  const found = unit(id);
  return { id, symbol: found.symbol, name: found.plural, text, inBox };
}

function toRow({ id, symbol, name, text, inBox = false }: MockRow): ConversionRow {
  return { id, symbol, name, text, value: null, tone: 'value', inBox };
}

/** A menu not built yet, drawn still as the category menu's trigger is at rest (MENU_TRIGGER). */
const STAND_IN = 'my-0.5 flex h-11 items-center gap-2 px-3 text-sm text-ink';

/** A link's look in running text, for a proposed link that goes nowhere yet (LINK, inline). */
const LINK_LOOK =
  'font-medium text-ink underline decoration-accent decoration-2 underline-offset-4';

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
      <figcaption className="mb-3 max-w-prose text-sm text-ink-muted">{mock.caption}</figcaption>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <CategoryMenu categories={categories} value={mock.category} onChoose={noop} />
        {mock.tool}
      </div>
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

// Pace, inside Speed: minutes and seconds per distance, beside the speeds they equal.

const MINUTE_PER_KILOMETER = proposedUnit(
  'speed',
  'minute-per-kilometer',
  'min/km',
  'minute per kilometer',
  'minutes per kilometer',
);

const PACE: readonly Mock[] = [
  {
    caption: 'A runner types “5:30 /km”, a pace.',
    category: 'speed',
    text: '5:30',
    unit: MINUTE_PER_KILOMETER,
    sections: [
      {
        label: 'US (customary)',
        rows: [
          row('mile-per-hour', '6.78'),
          row('foot-per-second', '9.94'),
          { id: 'minute-per-mile', symbol: 'min/mi', name: 'minutes per mile', text: '8:51' },
        ],
      },
      {
        label: 'Metric',
        rows: [
          row('meter-per-second', '3.03'),
          row('kilometer-per-hour', '10.91'),
          {
            id: 'minute-per-kilometer',
            symbol: 'min/km',
            name: 'minutes per kilometer',
            text: '5:30',
            inBox: true,
          },
        ],
      },
      { label: 'Other', rows: [row('knot', '5.89')] },
    ],
    note: 'Paces in minutes and seconds, to the second, beside the speeds they equal.',
  },
  {
    caption: 'A treadmill says “10 km/h”: the pace it means.',
    category: 'speed',
    text: '10',
    unit: unit('kilometer-per-hour'),
    sections: [
      {
        label: 'US (customary)',
        rows: [
          row('mile-per-hour', '6.21'),
          row('foot-per-second', '9.11'),
          { id: 'minute-per-mile', symbol: 'min/mi', name: 'minutes per mile', text: '9:39' },
        ],
      },
      {
        label: 'Metric',
        rows: [
          row('meter-per-second', '2.78'),
          row('kilometer-per-hour', '10.00', true),
          {
            id: 'minute-per-kilometer',
            symbol: 'min/km',
            name: 'minutes per kilometer',
            text: '6:00',
          },
        ],
      },
      { label: 'Other', rows: [row('knot', '5.40')] },
    ],
  },
];

// A temperature change: the same scales without their zero points.

const TEMPERATURE: readonly Mock[] = [
  {
    caption: 'Temperature, as today: a reading. 5 °C on a thermometer is 41 °F.',
    category: 'temperature',
    text: '5',
    unit: unit('celsius'),
    sections: [
      { label: 'US (customary)', rows: [row('fahrenheit', '41.00')] },
      { label: 'Metric', rows: [row('celsius', '5.00', true), row('kelvin', '278.15')] },
    ],
    note: (
      <>
        Proposed, under Temperature’s table: “Converting a change, like 5 °C warmer?{' '}
        <span className={LINK_LOOK}>Temperature change</span>”
      </>
    ),
  },
  {
    caption: 'Temperature change, new: a difference. 5 °C warmer is 9 °F warmer.',
    category: TEMPERATURE_CHANGE.id,
    text: '5',
    unit: unit('celsius'),
    sections: [
      { label: 'US (customary)', rows: [row('fahrenheit', '9.00')] },
      { label: 'Metric', rows: [row('celsius', '5.00', true), row('kelvin', '5.00')] },
    ],
    note: 'One degree Celsius of change is 1.8 °F and 1 K: the factors alone, no offsets.',
  },
  {
    caption:
      'An oven 25 °F lower is 13.89 °C lower. Temperature, reading it as a thermometer, says −3.89 °C.',
    category: TEMPERATURE_CHANGE.id,
    text: '25',
    unit: unit('fahrenheit'),
    sections: [
      { label: 'US (customary)', rows: [row('fahrenheit', '25.00', true)] },
      { label: 'Metric', rows: [row('celsius', '13.89'), row('kelvin', '13.89')] },
    ],
  },
];

// Cooking by ingredient: volume and weight together, through the ingredient's density.

const STICK = proposedUnit(COOKING.id, 'stick', 'stick', 'stick', 'sticks');

const FLOUR_NOTE =
  'All-purpose flour: about 125 g a cup, spooned and leveled (USDA FoodData Central). Sifted or scooped, it moves by a tenth or more, so weights show ≈. The cup is the US cup, 236.6 mL; the metric cup is 250 mL, a US nutrition label’s 240 mL.';

const FLOUR = <MenuStandIn label="Ingredient" name="All-purpose flour" />;

const COOKING_MOCKS: readonly Mock[] = [
  {
    caption: 'A: “2 cups flour”, weight first, then volume.',
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
];

interface Part {
  id: string;
  title: string;
  intro: ReactNode;
  mocks: readonly Mock[];
  questions: readonly ReactNode[];
}

const PARTS: readonly Part[] = [
  {
    id: 'pace',
    title: 'Pace, inside Speed',
    intro:
      'Runners give speed as time per distance, 5:30 a kilometer. As units of Speed, the way L/100 km sits in Fuel economy, one table answers both a pace and a treadmill’s speed.',
    mocks: PACE,
    questions: [
      'Paces with their systems, as here (min/km under Metric, min/mi under US), or in a Pace section of their own.',
      'To the second for running (5:30); a swimmer’s pace per 100 m to the tenth (1:32.5), and a rower’s per 500 m: in Specialty, or later.',
      'Typed “5:30 /km”, “5:30 min/km”, or “5:30/km”, it is a pace; “5:30” alone asks for a unit, as a number alone does today.',
    ],
  },
  {
    id: 'temperature-change',
    title: 'A temperature change',
    intro:
      'Temperature converts a reading: 20 °C on a thermometer is 68 °F, through the scales’ zero points. A change has no zero point: a forecast’s “5 °C warmer” is 9 °F warmer, where reading 5 °C as a temperature gives 41 °F. Engineering converters keep it as its own kind (unitconverters.net’s Temperature Interval); Google’s converter has none.',
    mocks: TEMPERATURE,
    questions: [
      'A category of its own beside Temperature, as here, found by typing “5 °C change”, “5 °C warmer”, or “temperature difference”; categories have no modes (ADR 0016).',
      'The line under Temperature’s table that leads to it: yes or no.',
      'A rise written “+9.00” and a drop “−9.00”, or the bare number, as here.',
    ],
  },
  {
    id: 'cooking',
    title: 'Cooking by ingredient',
    intro:
      'A cup of flour weighs about 125 g, a cup of sugar about 200 g: between volume and weight, the ingredient decides. Typing “2 cups flour” would read the ingredient and show the amount in every unit, weights and volumes together.',
    mocks: COOKING_MOCKS,
    questions: [
      'The ingredient in a menu beside the category, as here, or as a second chip in the box.',
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
      {PARTS.map((part) => (
        <section key={part.id} aria-labelledby={`part-${part.id}`} className="grid gap-6">
          <div className="grid max-w-prose gap-2">
            <h2 id={`part-${part.id}`} className="font-display text-xl font-semibold">
              {part.title}
            </h2>
            <p className="text-sm text-ink-muted">{part.intro}</p>
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
