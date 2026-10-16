import type { Category, CategoryId, Unit } from '../types';
import { angle, angleUnits } from './angle';
import { area, areaUnits } from './area';
import { data, dataUnits } from './data';
import { energy, energyUnits } from './energy';
import { force, forceUnits } from './force';
import { fuelEconomy, fuelEconomyUnits } from './fuel-economy';
import { length, lengthUnits } from './length';
import { mass, massUnits } from './mass';
import { power, powerUnits } from './power';
import { pressure, pressureUnits } from './pressure';
import { speed, speedUnits } from './speed';
import { temperature, temperatureUnits } from './temperature';
import { time, timeUnits } from './time';
import { torque, torqueUnits } from './torque';
import { volume, volumeUnits } from './volume';

/** Every category the engine knows, in display order. Add new categories here and in CategoryId. */
export const categories: readonly Category[] = [
  length,
  mass,
  volume,
  temperature,
  area,
  speed,
  time,
  data,
  fuelEconomy,
  energy,
  pressure,
  power,
  force,
  torque,
  angle,
];

/** Every unit the engine knows. Order within a category is display order (most common first). */
export const units: readonly Unit[] = [
  ...lengthUnits,
  ...massUnits,
  ...volumeUnits,
  ...temperatureUnits,
  ...areaUnits,
  ...speedUnits,
  ...timeUnits,
  ...dataUnits,
  ...fuelEconomyUnits,
  ...energyUnits,
  ...pressureUnits,
  ...powerUnits,
  ...forceUnits,
  ...torqueUnits,
  ...angleUnits,
];

const unitById: ReadonlyMap<string, Unit> = new Map(units.map((u) => [u.id, u]));
const categoryById: ReadonlyMap<string, Category> = new Map(categories.map((c) => [c.id, c]));

export function getUnit(id: string): Unit | undefined {
  return unitById.get(id);
}

export function getCategory(id: string): Category | undefined {
  return categoryById.get(id);
}

export function unitsIn(category: CategoryId): Unit[] {
  return units.filter((u) => u.category === category);
}
