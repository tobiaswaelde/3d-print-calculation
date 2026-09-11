import { printQuantitySchema } from './prints';
import { z } from 'zod';
import { listQuerySchema } from './master-data';
export const seriesSchema = z.object({
  name: z.string().trim().min(1).max(200),
  customerId: z
    .string()
    .min(1)
    .nullish()
    .transform((value) => value || null),
  targetQuantity: z.preprocess(
    (value) => (value === '' ? null : value),
    printQuantitySchema.nullish().transform((value) => value ?? null),
  ),
  notes: z
    .string()
    .trim()
    .max(5000)
    .nullish()
    .transform((value) => value || null),
  autoComplete: z.boolean().default(true),
});
export const seriesListSchema = listQuerySchema.extend({
  customerId: z.string().optional(),
  status: z.enum(['OPEN', 'COMPLETED']).optional(),
});
export const seriesStateSchema = z.object({ status: z.enum(['OPEN', 'COMPLETED']) });
export const nextRunSchema = z.object({ sourcePrintId: z.string().min(1) });
