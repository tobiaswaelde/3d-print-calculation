import { describe, expect, it } from 'vitest';
import { calculatePrintCost } from '../shared/domain/print-calculation';

const input = {
  printer: {
    id: 'p',
    name: 'Printer',
    purchasePrice: '1200',
    expectedLifetimeHours: '6000',
    averagePowerWatts: 120,
  },
  buildPlate: { id: 'b', name: 'Plate', purchasePrice: '60', expectedLifetimeHours: '1200' },
  hotends: [
    {
      id: 'h1',
      name: 'Hotend 1',
      purchasePrice: '100',
      expectedLifetimeHours: '2000',
      durationSeconds: 3600,
    },
    { id: 'h2', name: 'Hotend 2', purchasePrice: '90', expectedLifetimeHours: '1800', durationSeconds: 1800 },
  ],
  otherComponents: [{ id: 'o', name: 'Enclosure', purchasePrice: '300', expectedLifetimeHours: '3000' }],
  filaments: [
    { id: 'f1', name: 'PLA', purchasePrice: '29.99', netWeightGrams: '1000', usedGrams: '42.5' },
    { id: 'f2', name: 'PETG', purchasePrice: '24', netWeightGrams: '750', usedGrams: '10.25' },
  ],
  electricityPricePerKwh: '0.32',
  currency: 'EUR',
} as const;

describe('calculatePrintCost', () => {
  it('uses each source lifetime and sums multiple durations deterministically', () => {
    const result = calculatePrintCost(input);
    expect(result.totalDurationSeconds).toBe(5400);
    expect(result.printerCost).toBe('0.3');
    expect(result.componentCost).toBe('0.3');
    expect(result.electricityCost).toBe('0.0576');
    expect(result.filamentCost).toBe('1.602575');
    expect(result.totalCost).toBe('2.260175');
  });

  it('keeps repeating divisions deterministic and permits zero-cost inputs', () => {
    const result = calculatePrintCost({
      ...input,
      printer: { ...input.printer, purchasePrice: '0', expectedLifetimeHours: '3' },
    });
    expect(result.printerCost).toBe('0');
    expect(result.totalCost).toBe('1.960175');
  });

  it('rejects zero denominators, durations, and weights', () => {
    expect(() =>
      calculatePrintCost({ ...input, buildPlate: { ...input.buildPlate, expectedLifetimeHours: '0' } }),
    ).toThrow();
    expect(() =>
      calculatePrintCost({ ...input, hotends: [{ ...input.hotends[0], durationSeconds: 0 }] }),
    ).toThrow();
    expect(() =>
      calculatePrintCost({ ...input, filaments: [{ ...input.filaments[0], usedGrams: '0' }] }),
    ).toThrow();
  });
});
