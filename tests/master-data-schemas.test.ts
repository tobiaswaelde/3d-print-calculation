import { describe, expect, it } from 'vitest';
import { filamentSchema, printerSchema } from '../shared/schemas/master-data';

describe('master data validation', () => {
  it('accepts zero purchase prices but rejects invalid divisors', () => {
    expect(
      printerSchema.safeParse({
        name: 'P1',
        purchasePrice: '0',
        expectedLifetimeHours: '1',
        averagePowerWatts: 0,
      }).success,
    ).toBe(true);
    expect(
      printerSchema.safeParse({
        name: 'P1',
        purchasePrice: '-1',
        expectedLifetimeHours: '1',
        averagePowerWatts: 0,
      }).success,
    ).toBe(false);
    expect(
      filamentSchema.safeParse({
        name: 'PLA',
        manufacturerId: 'manufacturer-1',
        material: 'PLA',
        purchasePrice: '20',
        netWeightGrams: '0',
      }).success,
    ).toBe(false);
  });

  it('preserves decimal quantities as strings', () => {
    const result = filamentSchema.parse({
      name: 'PLA',
      manufacturerId: 'manufacturer-1',
      material: 'PLA',
      purchasePrice: '19.99',
      netWeightGrams: '750.5',
    });
    expect(result.netWeightGrams).toBe('750.5');
  });

  it('normalizes filament fields while retaining the manufacturer reference', () => {
    const result = filamentSchema.parse({
      name: 'Custom name',
      manufacturerId: ' manufacturer-1 ',
      material: ' PLA ',
      color: ' #12ABEF ',
      purchasePrice: '19.99',
      netWeightGrams: '1000',
    });

    expect(result.manufacturerId).toBe('manufacturer-1');
    expect(result.material).toBe('PLA');
    expect(result.color).toBe('#12ABEF');
  });
});
