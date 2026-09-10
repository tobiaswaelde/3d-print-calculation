import { z } from 'zod';

export const supportedLocaleSchema = z.enum(['de-DE', 'en-US']);
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const canonicalDecimalSchema = z
  .union([z.string(), z.number().finite()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^\d+(?:\.\d+)?$/, 'Must be a non-negative decimal'));
