import { describe, expect, it } from 'vitest';
import { canonicalDecimal } from '../shared/utils/decimal';

describe('canonicalDecimal', () => {
  it('preserves decimal arithmetic without binary floating-point output', () => {
    expect(canonicalDecimal('0.1000')).toBe('0.1');
    expect(canonicalDecimal('1.234567890123456789')).toBe('1.234567890123456789');
  });
});
