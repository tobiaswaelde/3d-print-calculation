import { describe, expect, it } from 'vitest';
import { calculateActualPrintCost } from '../shared/domain/print-outcome';
import { printOutcomeSchema } from '../shared/schemas/print-outcomes';

const source = {
  quantity: 2,
  currency: 'EUR',
  totalDurationSeconds: 3600,
  printerId: 'printer',
  snapshot: {
    printerName: 'Printer',
    printerHourlyRate: '1',
    printerPowerWatts: 100,
    electricityPricePerKwh: '0.3',
  },
  componentUsages: [
    { id: 'hotend', name: 'Hotend', type: 'HOTEND', hourlyRate: '0.5', appliedDurationSeconds: 3600 },
    { id: 'plate', name: 'Plate', type: 'BUILD_PLATE', hourlyRate: '0.1', appliedDurationSeconds: 3600 },
  ],
  filamentUsages: [{ id: 'usage', name: 'PLA', costPerGram: '0.02' }],
};
const input = printOutcomeSchema.parse({
  status: 'SUCCESS',
  durationSeconds: 1800,
  filaments: [{ usageId: 'usage', usedGrams: '10' }],
});

describe('actual print costs', () => {
  it('uses frozen rates with actual duration and material for successful and failed runs', () => {
    const result = calculateActualPrintCost(source, input);
    expect(result.totalCost).toBe('1.015');
    expect(result.costPerUnit).toBe('0.5075');
    expect(
      calculateActualPrintCost(source, { ...input, status: 'FAILED', failureReason: 'Adhesion' }),
    ).toEqual(result);
    expect(
      calculateActualPrintCost(source, {
        ...input,
        durationSeconds: 0,
        filaments: [{ usageId: 'usage', usedGrams: '0' }],
      }).totalCost,
    ).toBe('0');
  });
  it('rejects failures without a reason and missing, duplicate, or unknown usage', () => {
    expect(printOutcomeSchema.safeParse({ ...input, status: 'FAILED' }).success).toBe(false);
    expect(printOutcomeSchema.safeParse({ ...input, durationSeconds: -1 }).success).toBe(false);
    expect(
      printOutcomeSchema.safeParse({ ...input, filaments: [...input.filaments, ...input.filaments] }).success,
    ).toBe(false);
    expect(() =>
      calculateActualPrintCost(source, { ...input, filaments: [{ usageId: 'other', usedGrams: '1' }] }),
    ).toThrow();
  });
});
