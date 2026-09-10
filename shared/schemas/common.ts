import { z } from 'zod';

export const supportedLocaleSchema = z.enum(['de-DE', 'en-US']);
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const canonicalDecimalSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d+)?$/, 'Must be a non-negative decimal');
