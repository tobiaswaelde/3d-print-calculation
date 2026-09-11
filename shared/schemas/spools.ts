import { z } from 'zod';
import Decimal from 'decimal.js';
import { listQuerySchema } from './master-data';
import { canonicalDecimal } from '../utils/decimal';

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((value) => value || null);
export const stockDecimalSchema = z
  .string()
  .max(40)
  .regex(/^\d{1,12}(?:\.\d{1,6})?$/)
  .transform(canonicalDecimal);
export const spoolSchema = z.object({
  code: z.string().trim().min(1).max(100),
  filamentId: z.string().min(1),
  purchaseLot: optionalText,
  location: optionalText,
  acquiredAt: z
    .union([z.iso.date(), z.literal('')])
    .nullish()
    .transform((value) => value || null),
  purchasePrice: stockDecimalSchema,
  initialNetWeightGrams: stockDecimalSchema.refine((value) => new Decimal(value).gt(0)),
});
export const stockMovementSchema = z
  .object({
    kind: z.enum(['RECEIPT', 'CORRECTION']),
    grams: z
      .string()
      .max(40)
      .regex(/^-?\d{1,12}(?:\.\d{1,6})?$/)
      .transform(canonicalDecimal),
    note: z.string().trim().min(1).max(2000),
    operationKey: z.uuid(),
  })
  .refine(
    (value) =>
      value.kind === 'RECEIPT' ? new Decimal(value.grams).gt(0) : !new Decimal(value.grams).isZero(),
    { path: ['grams'] },
  );
export const spoolListSchema = listQuerySchema.extend({
  filamentId: z.string().optional(),
  availableOnly: z.preprocess((value) => value === 'true' || value === true, z.boolean()),
});

export const stockThresholdSchema = z.object({ minimumStockGrams: stockDecimalSchema });
