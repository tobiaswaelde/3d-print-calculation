import type { z } from 'zod';
import { apiError } from './http';

export function parseBody<TSchema extends z.ZodType>(schema: TSchema, input: unknown): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success)
    apiError(422, 'VALIDATION_ERROR', 'errors.validation', result.error.flatten().fieldErrors);
  return result.data;
}
