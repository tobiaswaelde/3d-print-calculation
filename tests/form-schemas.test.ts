import { describe, expect, it } from 'vitest';
import { componentSchema, customerSchema, settingsSchema } from '../shared/schemas/master-data';
import { printDraftFormSchema } from '../shared/schemas/prints';

describe('application form validation', () => {
  it('accepts valid settings and rejects malformed decimal input', () => {
    expect(
      settingsSchema.parse({
        currency: 'EUR',
        defaultLocale: 'de-DE',
        electricityPricePerKwh: 0.32,
      }).electricityPricePerKwh,
    ).toBe('0.32');
    expect(
      settingsSchema.safeParse({
        currency: 'EUR',
        defaultLocale: 'de-DE',
        electricityPricePerKwh: -0.32,
      }).success,
    ).toBe(false);
  });

  it('validates the resource-specific master-data fields', () => {
    expect(customerSchema.safeParse({ name: '', email: 'invalid', note: '' }).success).toBe(false);
    expect(
      componentSchema.safeParse({
        type: 'HOTEND',
        name: 'High-flow hotend',
        manufacturer: '',
        model: '',
        purchasePrice: 89.9,
        expectedLifetimeHours: 1200,
        printerIds: ['printer-1'],
        note: '',
      }).success,
    ).toBe(true);
  });

  it('requires complete print references, positive material, and a non-zero duration', () => {
    const valid = {
      name: 'Prototype',
      customerId: null,
      printerId: 'printer-1',
      buildPlateId: 'plate-1',
      hotends: [{ componentId: 'hotend-1', hours: 1, minutes: 30 }],
      otherComponentIds: [],
      filaments: [{ filamentId: 'filament-1', usedGrams: 42.5 }],
      notes: '',
    };

    expect(printDraftFormSchema.safeParse(valid).success).toBe(true);
    expect(
      printDraftFormSchema.safeParse({
        ...valid,
        hotends: [{ componentId: 'hotend-1', hours: 0, minutes: 0 }],
      }).success,
    ).toBe(false);
    expect(
      printDraftFormSchema.safeParse({
        ...valid,
        filaments: [{ filamentId: 'filament-1', usedGrams: '0' }],
      }).success,
    ).toBe(false);
  });
});
