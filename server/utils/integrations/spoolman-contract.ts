import { z } from 'zod';
const amount = z.number().finite();
export const spoolmanSpoolSchema = z.object({
  id: z.number().int().positive(),
  filament: z.object({
    id: z.number().int().positive(),
    name: z.string().max(200).nullish(),
    material: z.string().max(64).nullish(),
    color_hex: z
      .string()
      .regex(/^[a-fA-F0-9]{6,8}$/)
      .nullish(),
    price: amount.nonnegative().nullish(),
    weight: amount.positive().nullish(),
    vendor: z.object({ id: z.number().int().positive(), name: z.string().min(1).max(200) }).nullish(),
  }),
  price: amount.nonnegative().nullish(),
  initial_weight: amount.positive().nullish(),
  remaining_weight: amount.nullish(),
  location: z.string().max(200).nullish(),
  archived: z.boolean(),
});
export type RemoteSpool = z.infer<typeof spoolmanSpoolSchema>;
