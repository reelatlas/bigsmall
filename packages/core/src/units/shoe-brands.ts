/**
 * A shoe brand whose own size chart the converter carries beside ISO's rule (ADR 0028;
 * docs/research/shoe-sizes-2.md): the words are typed here, once; the charts are data core is
 * given (ADR 0029): `docs/research/shoe-sizes-2/write_brands.py` writes
 * `packages/core/data/shoe-brands.json` from the research record, every cell as the brand prints
 * it, `packages/core/test/shoe-brands.test.ts` holds the file to it, and the web app fetches it
 * once wanted (`shoe-brand-charts.ts`).
 */
export interface ShoeBrand {
  /** Stable identifier used in URLs. Lowercase, ASCII, kebab-case. */
  id: string;
  /** As the brand writes it ("adidas", "Dr. Martens", "HOKA"). */
  name: string;
  /** Other names people type ("birks", "chucks", "timbs"). */
  aliases: readonly string[];
  /**
   * Short keys that count only where the category is named, as a unit's `shorthand` does: "on",
   * "nb", "ua", and "docs" would otherwise read a brand into any query.
   */
  shorthand?: readonly string[];
  /** The site its chart is cited to, in the line under the table ("nike.com"). */
  site: string;
  /**
   * What its chart alone would hide, a fact the numbers cannot show, for the line under the table
   * (Birkenstock's whole EU sizes, Nike's JP label); never fit advice, which the brands' rows show
   * (Sean, 2026-10-20).
   */
  fact?: string;
  /**
   * The brand's own rule for a foot where its chart prints none (docs/RESEARCH.md §9, tier 2):
   * its Japan label is the foot plus this many centimetres, so a row's foot is the label less it
   * (On's FAQ: about a centimetre).
   */
  labelMinusCm?: number;
}

function brand(
  id: string,
  name: string,
  site: string,
  aliases: readonly string[],
  extra: { shorthand?: readonly string[]; fact?: string; labelMinusCm?: number } = {},
): ShoeBrand {
  return { id, name, aliases, site, ...extra };
}

/**
 * The twenty brands of the first batch, in the order their rows are listed, by name. The name is
 * a key itself, so an alias never repeats it (the registry's rule for a unit's keys); a shorthand
 * key may be the name ("On"), which then counts only where the category is named.
 */
export const shoeBrands: readonly ShoeBrand[] = [
  brand('adidas', 'adidas', 'adidas.com', []),
  brand('asics', 'Asics', 'asics.com', [], {
    fact: 'Its NZ and AU pages say to add 1 to 1.5 cm to the foot to read its CM column, so the foot is the label less a centimetre; its US page adds a half size for running shoes.',
    labelMinusCm: 1,
  }),
  brand('birkenstock', 'Birkenstock', 'birkenstock.com', ['birkenstocks', 'birks'], {
    fact: 'Whole EU sizes: two US half sizes share one.',
  }),
  brand('brooks', 'Brooks', 'brooksrunning.com', [], {
    fact: 'Its foot lengths are its UK site’s, brooksrunning.com/en_gb; its US page prints the same sizes without them.',
  }),
  brand('clarks', 'Clarks', 'clarks.com', ['clark'], {
    fact: 'Its GB and US pages joined on the UK size they share.',
  }),
  brand('converse', 'Converse', 'converse.com', ['chucks', 'chuck taylor', 'chuck taylors'], {
    fact: 'The Chuck Taylor All Star table.',
  }),
  brand('crocs', 'Crocs', 'crocs.com', [], { fact: 'Whole sizes; its EU is a pair, 43–44.' }),
  brand('dr-martens', 'Dr. Martens', 'drmartens.com', ['doc martens', 'doctor martens'], {
    shorthand: ['docs'],
    fact: 'Whole sizes, the half sizes US women’s only; the brand says sizes differ between silhouettes.',
  }),
  brand('hoka', 'HOKA', 'hoka.com', ['hokas', 'hoka one one']),
  brand('new-balance', 'New Balance', 'newbalance.com', [], {
    shorthand: ['nb'],
    fact: 'Its length column is the standard centimetre label: measured inside, its 9 is every brand’s 9, so its sizes read by ISO’s label.',
  }),
  brand('nike', 'Nike', 'nike.com', ['nikes']),
  brand('on', 'On', 'on.com', [], {
    shorthand: ['on'],
    fact: 'Its FAQ says its JP label is the foot plus about a centimetre.',
    labelMinusCm: 1,
  }),
  brand('puma', 'Puma', 'us.puma.com', ['pumas'], {
    fact: 'Its printed lengths are the shoe’s inside: at a US 9, 27.0 cm against RunRepeat’s 26.96 cm median over 18 models.',
  }),
  brand('reebok', 'Reebok', 'reebok.com', ['reeboks'], {
    fact: 'UK and EU from its Australian guide, reebok.com.au; its US page prints US sizes and inches alone.',
  }),
  brand('salomon', 'Salomon', 'salomon.com', []),
  brand('skechers', 'Skechers', 'skechers.com', ['sketchers'], {
    fact: 'Its Australian guide prints a CM column it never explains; its sizes read by ISO’s label.',
  }),
  brand('timberland', 'Timberland', 'timberland.com', ['timberlands', 'timbs']),
  brand('ugg', 'UGG', 'ugg.com', ['uggs']),
  brand('under-armour', 'Under Armour', 'underarmour.com', ['under armor'], {
    shorthand: ['ua'],
    fact: 'Its CM column is the standard centimetre label: measured inside, its 9 is every brand’s 9, so its sizes read by ISO’s label.',
  }),
  brand('vans', 'Vans', 'vans.com', [], {
    fact: 'Its length column is the standard centimetre label: measured inside, its 9 is every brand’s 9, so its sizes read by ISO’s label.',
  }),
];
