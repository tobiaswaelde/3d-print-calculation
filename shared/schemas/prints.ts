import Decimal from 'decimal.js';
import { z } from 'zod';

const positiveDecimal = z
  .union([z.string(), z.number().finite()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^\d+(?:\.\d+)?$/))
  .refine((value) => new Decimal(value).greaterThan(0));

const printDurationFormSchema = z
  .object({
    componentId: z.string().min(1),
    hours: z.coerce.number().int().nonnegative(),
    minutes: z.coerce.number().int().min(0).max(59),
  })
  .refine((value) => value.hours > 0 || value.minutes > 0, {
    path: ['minutes'],
    message: 'Duration must be greater than zero',
  });

export const printDraftFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  customerId: z.string().min(1).nullable(),
  printerId: z.string().min(1),
  buildPlateId: z.string().min(1),
  hotends: z.array(printDurationFormSchema).min(1),
  otherComponentIds: z.array(z.string().min(1)).default([]),
  filaments: z.array(z.object({ filamentId: z.string().min(1), usedGrams: positiveDecimal })).min(1),
  notes: z.string().trim().max(5000),
});

export const printDraftSchema = z.object({
  name: z.string().trim().min(1).max(200),
  customerId: z
    .string()
    .min(1)
    .nullish()
    .transform((value) => value || null),
  printerId: z.string().min(1),
  buildPlateId: z.string().min(1),
  hotends: z
    .array(z.object({ componentId: z.string().min(1), durationSeconds: z.coerce.number().int().positive() }))
    .min(1),
  otherComponentIds: z.array(z.string().min(1)).default([]),
  filaments: z.array(z.object({ filamentId: z.string().min(1), usedGrams: positiveDecimal })).min(1),
  notes: z
    .string()
    .trim()
    .max(5000)
    .nullish()
    .transform((value) => value || null),
});

export const printListQuerySchema = z.object({
  search: z.string().trim().max(200).default(''),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['DRAFT', 'COMPLETED']).optional(),
  customerId: z.string().optional(),
  includeArchived: z.preprocess(
    (value) => (value === 'true' ? true : value === 'false' || value === undefined ? false : value),
    z.boolean(),
  ),
});

export const dashboardPeriodSchema = z.enum(['30d', '90d', 'all']).default('30d');
export type PrintDraftInput = z.output<typeof printDraftSchema>;
