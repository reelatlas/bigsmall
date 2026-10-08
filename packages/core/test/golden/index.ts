import { angle } from './angle';
import { area } from './area';
import { data } from './data';
import { energy } from './energy';
import { length } from './length';
import { mass } from './mass';
import { power } from './power';
import { pressure } from './pressure';
import { speed } from './speed';
import { temperature } from './temperature';
import { time } from './time';
import type { GoldenRow } from './types';
import { volume } from './volume';

/** Every sourced conversion, keyed by category. Add a file here when a category arrives. */
export const golden: Record<string, GoldenRow[]> = {
  length,
  mass,
  volume,
  temperature,
  area,
  speed,
  time,
  data,
  energy,
  pressure,
  power,
  angle,
};

export type { GoldenRow } from './types';
