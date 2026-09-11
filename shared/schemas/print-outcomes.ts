import { z } from 'zod';
import { canonicalDecimal } from '../utils/decimal';

export const outcomeStatusSchema = z.enum(['SUCCESS', 'FAILED']);
export const printOutcomeSchema = z
  .object({
    status: outcomeStatusSchema,
    durationSeconds: z.number().int().min(0).max(2147483647),
    filaments: z
      .array(
        z.object({
          usageId: z.string().min(1),
          usedGrams: z
            .string()
            .max(100)
            .regex(/^\d+(?:\.\d+)?$/)
            .transform(canonicalDecimal),
        }),
      )
      .min(1)
      .max(1000),
    failureReason: z
      .string()
      .trim()
      .max(2000)
      .nullish()
      .transform((value) => value || null),
    note: z
      .string()
      .trim()
      .max(5000)
      .nullish()
      .transform((value) => value || null),
  })
  .superRefine((value, context) => {
    if (value.status === 'FAILED' && !value.failureReason)
      context.addIssue({ code: 'custom', path: ['failureReason'], message: 'A failure reason is required' });
    if (new Set(value.filaments.map((line) => line.usageId)).size !== value.filaments.length)
      context.addIssue({
        code: 'custom',
        path: ['filaments'],
        message: 'Each usage must occur exactly once',
      });
  });
export type PrintOutcomeInput = z.output<typeof printOutcomeSchema>;

export const printOutcomeCorrectionSchema = printOutcomeSchema
  .and(
    z.object({
      expectedRevision: z.number().int().positive(),
      operationKey: z.uuid(),
    }),
  )
  .refine((value) => !!value.note, { path: ['note'], message: 'Explain the correction' });
