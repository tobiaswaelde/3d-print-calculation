import Decimal from 'decimal.js';
import { z } from 'zod';
import { currencySchema, supportedLocaleSchema } from './common';

function decimalSchema(options: { positive?: boolean } = {}) {
  return z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d+)?$/)
    .refine(
      (value) => {
        const decimal = new Decimal(value);
        return options.positive ? decimal.greaterThan(0) : decimal.greaterThanOrEqualTo(0);
      },
      options.positive ? 'Must be greater than zero' : 'Must not be negative',
    );
}

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((value) => value || null);

export const settingsSchema = z.object({
  currency: currencySchema,
  defaultLocale: supportedLocaleSchema,
  electricityPricePerKwh: decimalSchema(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z
    .union([z.literal(''), z.email()])
    .nullish()
    .transform((value) => value?.trim().toLowerCase() || null),
  note: optionalText,
});

export const printerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  manufacturer: optionalText,
  model: optionalText,
  purchasePrice: decimalSchema(),
  expectedLifetimeHours: decimalSchema({ positive: true }),
  averagePowerWatts: z.coerce.number().int().nonnegative(),
  note: optionalText,
});

export const componentSchema = z.object({
  type: z.enum(['HOTEND', 'BUILD_PLATE', 'OTHER']),
  name: z.string().trim().min(1).max(200),
  manufacturer: optionalText,
  model: optionalText,
  purchasePrice: decimalSchema(),
  expectedLifetimeHours: decimalSchema({ positive: true }),
  printerIds: z.array(z.string().min(1)).default([]),
  note: optionalText,
});

export const filamentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  manufacturer: z.string().trim().min(1).max(200),
  material: z.string().trim().min(1).max(100),
  color: optionalText,
  purchasePrice: decimalSchema(),
  netWeightGrams: decimalSchema({ positive: true }),
  note: optionalText,
});

export const archiveSchema = z.object({ archived: z.boolean() });
export const listQuerySchema = z.object({
  search: z.string().trim().max(200).default(''),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  includeArchived: z.coerce.boolean().default(false),
});
