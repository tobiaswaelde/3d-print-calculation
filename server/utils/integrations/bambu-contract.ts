import { z } from 'zod';
export const bambuPrinterSchema = z.object({ id: z.number().int().positive(), name: z.string().max(200) });
const tray = z.object({
  id: z.number().int().min(0).max(255),
  tray_type: z.string().max(64).nullish(),
  tray_color: z.string().max(16).nullish(),
});
export const bambuStateSchema = bambuPrinterSchema.extend({
  connected: z.boolean(),
  state: z.string().max(64).nullish(),
  ams: z
    .array(z.object({ id: z.number().int().min(0).max(255), tray: z.array(tray).max(16) }))
    .max(16)
    .default([]),
  vt_tray: z.array(tray).max(4).default([]),
});
export const bambuLogSchema = z.object({
  id: z.number().int().positive(),
  printer_id: z.number().int().positive().nullable(),
  print_name: z.string().max(200).nullish(),
  status: z.string().max(64),
  completed_at: z.string().max(64).nullish(),
  duration_seconds: z.number().int().min(0).max(2147483647).nullish(),
  filament_used_grams: z.number().finite().nonnegative().nullish(),
  failure_reason: z.string().max(2000).nullish(),
});
export const bambuLogPageSchema = z.object({
  items: z.array(bambuLogSchema).max(50),
  total: z.number().int().nonnegative(),
});
export const bambuAssignmentsSchema = z
  .array(
    z.object({
      printer_id: z.number().int(),
      ams_id: z.number().int(),
      tray_id: z.number().int(),
      spoolman_spool_id: z.number().int().positive(),
    }),
  )
  .max(2000);
export function terminalOutcome(status: string, completedAt: string | null | undefined) {
  if (!completedAt || !Number.isFinite(Date.parse(completedAt))) return null;
  return status === 'completed' ? 'SUCCESS' : status === 'failed' ? 'FAILED' : null;
}
