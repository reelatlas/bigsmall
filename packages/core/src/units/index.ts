import type { Category, CategoryId, Unit } from '../types';
import { length, lengthUnits } from './length';

/** Every category the engine knows, in display order. Add new categories here and in CategoryId. */
export const categories: readonly Category[] = [length];

/** Every unit the engine knows. Order within a category is display order. */
export const units: readonly Unit[] = [...lengthUnits];

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
