import { z } from 'zod';
import { canonicalDecimalSchema, currencySchema, supportedLocaleSchema } from './common';

export const setupSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(256),
  locale: supportedLocaleSchema.default('de-DE'),
  currency: currencySchema.default('EUR'),
  electricityPrice: canonicalDecimalSchema,
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(256),
});
