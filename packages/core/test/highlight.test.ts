import { describe, expect, it } from 'vitest';
import { matchSpan } from '../src/index';

/** The marked part of `text`, or null. */
function marked(text: string, query: string): string | null {
  const span = matchSpan(text, query);
  return span ? text.slice(span.start, span.end) : null;
}

describe('matchSpan', () => {
  it('marks a prefix', () => {
    expect(matchSpan('meters', 'me')).toEqual({ start: 0, end: 2 });
    expect(marked('meters per second', 'me')).toBe('me');
    expect(marked('Volume', 'vol')).toBe('Vol');
  });

  it('marks the first occurrence inside a word', () => {
    expect(matchSpan('millimeters', 'me')).toEqual({ start: 5, end: 7 });
  });

  it('ignores case, spacing, and periods the way search does', () => {
    expect(marked('Fahrenheit', 'FAHR')).toBe('Fahr');
    expect(marked('fl oz', 'floz')).toBe('fl oz');
    expect(marked('fluid ounces', 'fluid  oun')).toBe('fluid oun');
    expect(marked('meters per second', 'meters per')).toBe('meters per');
    expect(marked('sq. ft.', 'sqft')).toBe('sq. ft');
  });

  it('matches superscripts and degree signs', () => {
    expect(marked('m²', 'm2')).toBe('m²');
    expect(marked('km²', 'm2')).toBe('m²');
    expect(marked('°F', 'f')).toBe('°F');
    expect(marked('°F', '°f')).toBe('°F');
    expect(marked('°', '°')).toBe('°');
    expect(marked('°C', '°')).toBe('°');
    expect(marked('°C', '°c')).toBe('°C');
    expect(marked('degrees Fahrenheit', 'fahr')).toBe('Fahr');
  });

  it('does not pull a leading space into the mark', () => {
    expect(marked('fl oz', 'oz')).toBe('oz');
  });

  it('returns null when the label does not contain the query', () => {
    expect(matchSpan('meters', 'metre')).toBeNull();
    expect(matchSpan('Volume', 'fluids')).toBeNull();
    expect(matchSpan('meters', '')).toBeNull();
    expect(matchSpan('meters', '  ')).toBeNull();
  });
});
