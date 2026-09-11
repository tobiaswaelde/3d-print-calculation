import { describe, expect, it } from 'vitest';
import { createPrinterSchema, filamentSchema, printerSchema } from '../shared/schemas/master-data';

describe('master data validation', () => {
  it('accepts zero purchase prices but rejects invalid divisors', () => {
    expect(
      printerSchema.safeParse({
        name: 'P1',
        manufacturerId: 'manufacturer-1',
        purchasePrice: '0',
        expectedLifetimeHours: '1',
        averagePowerWatts: 0,
      }).success,
    ).toBe(true);
    expect(
      printerSchema.safeParse({
        name: 'P1',
        manufacturerId: 'manufacturer-1',
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
        colorName: 'Black',
        colorHex: '#000000',
        purchasePrice: '20',
        netWeightGrams: '0',
      }).success,
    ).toBe(false);
  });

  it('requires a printer manufacturer while accepting the legacy manufacturer name', () => {
    const printer = {
      name: 'P1',
      purchasePrice: '100',
      expectedLifetimeHours: '1000',
      averagePowerWatts: 100,
    };

    expect(printerSchema.safeParse(printer).success).toBe(false);
    expect(
      createPrinterSchema({ manufacturerRequired: 'Ein Hersteller ist erforderlich.' }).safeParse(printer)
        .error?.issues[0]?.message,
    ).toBe('Ein Hersteller ist erforderlich.');
    expect(printerSchema.parse({ ...printer, manufacturerId: ' manufacturer-1 ' }).manufacturerId).toBe(
      'manufacturer-1',
    );
    expect(printerSchema.parse({ ...printer, manufacturer: ' Legacy Maker ' }).manufacturer).toBe(
      'Legacy Maker',
    );
  });

  it('preserves decimal quantities as strings', () => {
    const result = filamentSchema.parse({
      name: 'PLA',
      manufacturerId: 'manufacturer-1',
      material: 'PLA',
      colorName: 'Black',
      colorHex: '#000000',
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
      colorName: ' Teal ',
      colorHex: ' #12abef ',
      purchasePrice: '19.99',
      netWeightGrams: '1000',
    });

    expect(result.manufacturerId).toBe('manufacturer-1');
    expect(result.material).toBe('PLA');
    expect(result.colorName).toBe('Teal');
    expect(result.colorHex).toBe('#12ABEF');
  });

  it('requires a color name and a six-digit hex code', () => {
    const base = {
      manufacturerId: 'manufacturer-1',
      material: 'PLA',
      colorName: 'Teal',
      colorHex: '#12ABEF',
      purchasePrice: '19.99',
      netWeightGrams: '1000',
    };

    expect(filamentSchema.safeParse({ ...base, colorName: '' }).success).toBe(false);
    expect(filamentSchema.safeParse({ ...base, colorHex: 'teal' }).success).toBe(false);
  });
});
