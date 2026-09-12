import { describe, expect, it } from 'vitest';
import { setupSchema } from '../shared/schemas/auth';
import { componentSchema, customerSchema, settingsSchema } from '../shared/schemas/master-data';
import { featureSettingsSchema } from '../shared/schemas/features';
import {
  printDraftFormSchema,
  printListQuerySchema,
  printWorkflowUpdateSchema,
} from '../shared/schemas/prints';

describe('application form validation', () => {
  it('accepts feature choices during first-run setup', () => {
    expect(
      setupSchema.parse({
        displayName: 'Test User',
        email: 'test@example.test',
        password: 'test-password-123',
        electricityPrice: '0.32',
        printSeriesEnabled: false,
        spoolManagementEnabled: false,
      }),
    ).toMatchObject({ printSeriesEnabled: false, spoolManagementEnabled: false });
  });

  it('accepts valid settings and rejects malformed decimal input', () => {
    expect(
      settingsSchema.parse({
        currency: 'EUR',
        defaultLocale: 'de-DE',
        electricityPricePerKwh: 0.32,
        spoolManagementEnabled: true,
      }).electricityPricePerKwh,
    ).toBe('0.32');
    expect(
      settingsSchema.safeParse({
        currency: 'EUR',
        defaultLocale: 'de-DE',
        electricityPricePerKwh: -0.32,
        spoolManagementEnabled: true,
      }).success,
    ).toBe(false);
  });

  it('requires explicit boolean feature flags', () => {
    expect(featureSettingsSchema.parse({ printSeriesEnabled: true, spoolManagementEnabled: false })).toEqual({
      printSeriesEnabled: true,
      spoolManagementEnabled: false,
    });
    expect(featureSettingsSchema.safeParse({ printSeriesEnabled: 'yes' }).success).toBe(false);
  });

  it('validates the resource-specific master-data fields', () => {
    expect(customerSchema.safeParse({ name: '', email: 'invalid', note: '' }).success).toBe(false);
    expect(
      customerSchema.parse({
        name: 'Internal customer',
        email: '',
        excludeFromDashboard: true,
        note: '',
      }),
    ).toMatchObject({ excludeFromDashboard: true });
    expect(customerSchema.safeParse({ name: 'Invalid flag', excludeFromDashboard: 'true' }).success).toBe(
      false,
    );
    expect(
      componentSchema.safeParse({
        type: 'HOTEND',
        name: 'High-flow hotend',
        alwaysUsed: true,
        manufacturerId: '',
        model: '',
        purchasePrice: 89.9,
        expectedLifetimeHours: 1200,
        printerIds: ['printer-1'],
        note: '',
      }).success,
    ).toBe(true);
    expect(
      componentSchema.parse({
        type: 'OTHER',
        name: 'Filter',
        purchasePrice: 20,
        expectedLifetimeHours: 500,
      }).alwaysUsed,
    ).toBe(false);
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

  it('accepts the print workflow statuses and payment actions', () => {
    for (const status of ['DRAFT', 'PRINTING', 'PRINTED', 'SHIPPED', 'DONE']) {
      expect(printListQuerySchema.parse({ status }).status).toBe(status);
      expect(printWorkflowUpdateSchema.safeParse({ status }).success).toBe(true);
    }
    expect(printWorkflowUpdateSchema.safeParse({ status: 'COMPLETED' }).success).toBe(false);
    expect(printWorkflowUpdateSchema.safeParse({ paid: true }).success).toBe(true);
    expect(printWorkflowUpdateSchema.safeParse({}).success).toBe(false);
  });
});
