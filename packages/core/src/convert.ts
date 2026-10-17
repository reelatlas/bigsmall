import type { Unit } from './types';
import { getUnit } from './units';

export type ConversionErrorCode = 'unknown-unit' | 'category-mismatch' | 'not-finite' | 'no-scale';

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;

  constructor(message: string, code: ConversionErrorCode) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
  }
}

/** Express `value` of `unit` in the category's base unit. */
export function toBase(unit: Unit, value: number): number {
  switch (unit.kind) {
    case 'linear':
      return value * unit.factor;
    case 'affine':
      return (value + unit.offset) * unit.factor;
    case 'reciprocal':
      return unit.factor / value;
    case 'functional':
      return unit.toBase(value);
  }
}

/** Express a base-unit `value` in `unit`. */
export function fromBase(unit: Unit, value: number): number {
  switch (unit.kind) {
    case 'linear':
      return value / unit.factor;
    case 'affine':
      return value / unit.factor - unit.offset;
    case 'reciprocal':
      return unit.factor / value;
    case 'functional':
      return unit.fromBase(value);
  }
}

/**
 * Convert `value` between two units of the same category.
 * Always goes from -> base -> to; never chains through intermediate units.
 * Accepts unit ids or unit objects.
 */
export function convert(value: number, from: Unit | string, to: Unit | string): number {
  const source = resolve(from);
  const target = resolve(to);
  if (source.category !== target.category) {
    throw new ConversionError(
      `Cannot convert ${source.category} (${source.id}) to ${target.category} (${target.id})`,
      'category-mismatch',
    );
  }
  if (!Number.isFinite(value)) {
    throw new ConversionError('Value must be a finite number', 'not-finite');
  }
  if (source.id === target.id) return value;
  return fromBase(target, toBase(source, value));
}

/**
 * Convert a change of `value`, a difference between two readings rather than a reading: by the
 * scales' degree sizes alone, their zero points left out, so 5 °C warmer is 9 °F warmer, where a
 * reading of 5 °C is 41 °F (Sean, 2026-10-16). The sign stays as given: −25 °F is −13.89 °C.
 * Only units with a size of their own, a factor (temperature's are linear or affine); a reciprocal
 * or functional unit has no change to convert, and throws.
 */
export function convertChange(value: number, from: Unit | string, to: Unit | string): number {
  const source = resolve(from);
  const target = resolve(to);
  if (source.category !== target.category) {
    throw new ConversionError(
      `Cannot convert ${source.category} (${source.id}) to ${target.category} (${target.id})`,
      'category-mismatch',
    );
  }
  if (!Number.isFinite(value)) {
    throw new ConversionError('Value must be a finite number', 'not-finite');
  }
  if (source.id === target.id) return value;
  return (value * degree(source)) / degree(target);
}

/** A unit's size in its category's base unit, its zero point left out. */
function degree(unit: Unit): number {
  if (unit.kind === 'linear' || unit.kind === 'affine') return unit.factor;
  throw new ConversionError(`${unit.id} has no size of its own to change by`, 'no-scale');
}

function resolve(ref: Unit | string): Unit {
  if (typeof ref !== 'string') return ref;
  const unit = getUnit(ref);
  if (!unit) throw new ConversionError(`Unknown unit "${ref}"`, 'unknown-unit');
  return unit;
}
