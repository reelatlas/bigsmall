import { describe, expect, it } from 'vitest';
import { cssTime } from '../src/lib/css-time';

describe('cssTime', () => {
  it('reads milliseconds as the themes write them', () => {
    expect(cssTime('400ms')).toBe(400);
    expect(cssTime(' 1200ms ')).toBe(1200);
    expect(cssTime('0ms')).toBe(0);
  });

  it('reads seconds as the built site writes them', () => {
    expect(cssTime('.4s')).toBe(400);
    expect(cssTime('1.2s')).toBe(1200);
    expect(cssTime('0s')).toBe(0);
  });

  it('is 0 for anything that is not a time', () => {
    expect(cssTime('')).toBe(0);
    expect(cssTime('400')).toBe(0);
    expect(cssTime('fast')).toBe(0);
  });
});
