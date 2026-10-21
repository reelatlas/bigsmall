import { ingredients, shoeBrands, units } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import { formulaGroups, writtenFactor } from '../src/features/formulas/formulas';

describe('formulas', () => {
  const lines = formulaGroups().flatMap((group) => group.lines);
  const formula = (id: string) => lines.find((line) => line.id === id)?.formula;

  it('lists every unit the engine has, once, and under Cooking every ingredient', () => {
    const unitLines = lines.filter(
      (line) => !line.id.startsWith('ingredient:') && !line.id.startsWith('brand:'),
    );
    expect(unitLines.map((line) => line.id).sort()).toEqual(units.map((unit) => unit.id).sort());
    const cooking = formulaGroups().find((group) => group.category.id === 'cooking');
    expect(cooking?.lines.map((line) => line.id)).toEqual(
      ingredients.map((ingredient) => `ingredient:${ingredient.id}`),
    );
    expect(cooking?.summary).toBe(`${ingredients.length} ingredients by the cup`);
    expect(formula('ingredient:brown-sugar')).toBe('1 cup = 211 g');
  });

  it('lists every brand’s chart under Shoe size, by convention, with its page and date (ADR 0028)', () => {
    const shoe = formulaGroups().find((group) => group.category.id === 'shoe-size');
    const charts = shoe?.lines.filter((line) => line.id.startsWith('brand:')) ?? [];
    expect(charts).toHaveLength(
      shoeBrands.reduce((count, brand) => count + brand.charts.length, 0),
    );
    expect(charts.map((line) => line.id)).toEqual(
      shoeBrands.flatMap((brand) => brand.charts.map((chart) => `brand:${brand.id}:${chart.line}`)),
    );
    expect(shoe?.summary).toBe(`10 units in Mondopoint, ${charts.length} brands’ charts`);
    const nike = charts.find((line) => line.id === 'brand:nike:men');
    expect(nike).toMatchObject({
      name: 'Nike, the men’s chart',
      basis: 'by convention',
      exact: false,
    });
    expect(nike?.formula).toBe('38 sizes: US men, US women, UK, EU, JP, the foot in mm');
    expect(nike?.source).toContain(
      'nike.com/size-fit/mens-footwear, read 2026-10-20; its length the foot’s.',
    );
    expect(formula('brand:birkenstock:unisex')).toContain('EU, the foot in mm');
    expect(shoe?.lines.find((line) => line.id === 'brand:birkenstock:unisex')?.source).toContain(
      'Whole EU sizes',
    );
    expect(formula('brand:puma:women')).toBe('12 sizes: US women, UK, EU');
  });

  it('writes each kind of unit as its formula in the base unit', () => {
    expect(formula('meter')).toBe('m, the base unit');
    expect(formula('mile')).toBe('1 mi = 1609.344 m');
    expect(formula('fahrenheit')).toBe('K = (°F + 459.67) × 5/9');
    expect(formula('celsius')).toBe('K = °C + 273.15');
    expect(formula('rankine')).toBe('K = °R × 5/9');
    expect(formula('liter-per-100-kilometers')).toBe('km/L = 100 ÷ (L/100 km)');
    expect(formula('degree')).toBe('1 ° = π/180 rad');
    expect(formula('pound-force')).toBe('1 lbf = 4.4482216152605 N');
    // A pair by its parts' ratio, from core (ADR 0026).
    expect(formula('foot-inch')).toBe('1 ft = 12 in');
    expect(formula('stone-pound')).toBe('1 st = 14 lb');
    expect(formula('hour-minute-second')).toBe('1 h = 60 min, 1 min = 60 s');
    expect(formula('degree-arcminute-arcsecond')).toBe('1° = 60′, 1′ = 60″');
  });

  it('writes a factor to 16 digits, so float noise never shows', () => {
    expect(writtenFactor(0.031103476799999998)).toBe('0.0311034768');
    expect(writtenFactor(9_460_730_472_580_800)).toBe('9,460,730,472,580,800');
    expect(writtenFactor(0.5144444444444445)).toBe('0.5144444444444445');
    expect(writtenFactor(1e-9)).toBe('1E-9');
  });

  it('gives each line its source and its basis, exact, measured, or by convention, as plain text too', () => {
    for (const line of lines) {
      expect(line.source.length, line.id).toBeGreaterThan(10);
      expect(line.plain, line.id).toContain(line.formula);
      expect(line.plain, line.id).toContain(`, ${line.basis}.`);
      expect(line.basis === 'exact', line.id).toBe(line.exact);
    }
    // A shoe scale is a body's convention (ADR 0027); its children's table says its span.
    const uk = lines.find((line) => line.id === 'uk');
    expect(uk?.basis).toBe('by convention');
    expect(lines.find((line) => line.id === 'mondopoint')?.basis).toBe('exact');
    expect(lines.find((line) => line.id === 'us-children')?.formula).toBe(
      'mm from US C by a table, 118.5 to 194 mm',
    );
  });
});
