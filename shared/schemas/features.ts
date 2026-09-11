import { z } from 'zod';

export const featureSettingsSchema = z.object({
  printSeriesEnabled: z.boolean(),
  spoolManagementEnabled: z.boolean(),
});

export type FeatureSettings = z.infer<typeof featureSettingsSchema>;
