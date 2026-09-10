import { describe, expect, it } from 'vitest';
import { compareSemver } from '../app/utils/semver';

describe('semantic version comparison', () => {
  it('compares release versions numerically', () => {
    expect(compareSemver('0.3.0', '0.2.0')).toBe(1);
    expect(compareSemver('v0.2.0', '0.2.0')).toBe(0);
    expect(compareSemver('0.1.9', '0.2.0')).toBe(-1);
  });
});
