import { describe, expect, it } from 'vitest';
import { regionDefaults } from '../src/index';

describe('regionDefaults', () => {
  it('US gets US customary', () => {
    expect(regionDefaults('US')).toEqual({ region: 'US', system: 'us' });
  });

  it('GB gets imperial', () => {
    expect(regionDefaults('GB')).toEqual({ region: 'GB', system: 'imperial' });
  });

  it('everyone else gets metric', () => {
    expect(regionDefaults('DE').system).toBe('metric');
    expect(regionDefaults('JP').system).toBe('metric');
    expect(regionDefaults('CA').system).toBe('metric');
  });

  it('falls back to US when the region is unknown or missing', () => {
    expect(regionDefaults(undefined)).toEqual({ region: 'US', system: 'us' });
    expect(regionDefaults(null)).toEqual({ region: 'US', system: 'us' });
    expect(regionDefaults('')).toEqual({ region: 'US', system: 'us' });
    expect(regionDefaults('en-US')).toEqual({ region: 'US', system: 'us' });
  });

  it('normalizes case and whitespace', () => {
    expect(regionDefaults(' gb ').system).toBe('imperial');
  });
});
