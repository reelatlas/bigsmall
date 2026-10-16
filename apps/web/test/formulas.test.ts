import { units } from '@bigsmall/core';
import { describe, expect, it } from 'vitest';
import { formulaGroups, writtenFactor } from '../src/features/formulas/formulas';

describe('formulas', () => {
  const lines = formulaGroups().flatMap((group) => group.lines);
  const formula = (id: string) => lines.find((line) => line.id === id)?.formula;

  it('lists every unit the engine has, once', () => {
    expect(lines.map((line) => line.id).sort()).toEqual(units.map((unit) => unit.id).sort());
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
  });

  it('writes a factor to 16 digits, so float noise never shows', () => {
    expect(writtenFactor(0.031103476799999998)).toBe('0.0311034768');
    expect(writtenFactor(9_460_730_472_580_800)).toBe('9,460,730,472,580,800');
    expect(writtenFactor(0.5144444444444445)).toBe('0.5144444444444445');
    expect(writtenFactor(1e-9)).toBe('1E-9');
  });

  it('gives each line its source, exact or measured, as plain text too', () => {
    for (const line of lines) {
      expect(line.source.length, line.id).toBeGreaterThan(10);
      expect(line.plain, line.id).toContain(line.formula);
      expect(line.plain, line.id).toContain(line.exact ? ', exact.' : ', measured.');
    }
  });
});
