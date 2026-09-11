import { expect, it } from 'vitest';
import { spoolSchema, stockMovementSchema } from '../shared/schemas/spools';

it('validates stock receipts, signed corrections, and immutable opening inputs', () => {
  const operationKey = '12345678-1234-4234-8234-123456789abc';
  expect(
    stockMovementSchema.parse({ kind: 'CORRECTION', grams: '-0001.2500', note: 'Weighed', operationKey })
      .grams,
  ).toBe('-1.25');
  expect(
    stockMovementSchema.safeParse({ kind: 'RECEIPT', grams: '-1', note: 'Delivery', operationKey }).success,
  ).toBe(false);
  expect(
    stockMovementSchema.safeParse({ kind: 'CORRECTION', grams: '0', note: 'No change', operationKey })
      .success,
  ).toBe(false);
  expect(
    stockMovementSchema.safeParse({ kind: 'CORRECTION', grams: '1e6', note: 'Invalid', operationKey })
      .success,
  ).toBe(false);
  expect(
    spoolSchema.safeParse({
      code: 'S-1',
      filamentId: 'filament',
      purchasePrice: '20',
      initialNetWeightGrams: '0',
    }).success,
  ).toBe(false);
});
