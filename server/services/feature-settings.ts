import { randomUUID } from 'node:crypto';
import { featureSettingsSchema } from '#shared/schemas/features';
import { db } from '../utils/db';
import { parseBody } from '../utils/validation';
import { readFeatureFlags } from '../utils/features';

export function readFeatureSettings() {
  return readFeatureFlags();
}

export async function updateFeatureSettings(input: unknown) {
  const data = parseBody(featureSettingsSchema, input);
  return db.$transaction(async (transaction) => {
    const current = await readFeatureFlags(transaction);
    if (data.spoolManagementEnabled && !current.spoolManagementEnabled) {
      const filaments = (
        await transaction.filament.findMany({
          where: { archivedAt: null },
          select: {
            id: true,
            purchasePrice: true,
            netWeightGrams: true,
            spools: { where: { archivedAt: null }, select: { remoteState: true } },
          },
        })
      ).filter((filament) =>
        filament.spools.every((spool) => ['ARCHIVED', 'MISSING'].includes(spool.remoteState ?? '')),
      );
      for (const filament of filaments) {
        const spoolId = randomUUID();
        await transaction.spool.create({
          data: {
            id: spoolId,
            code: `S-${spoolId}`,
            filamentId: filament.id,
            purchasePrice: filament.purchasePrice.toString(),
            initialNetWeightGrams: filament.netWeightGrams.toString(),
            movements: {
              create: {
                kind: 'RECEIPT',
                grams: filament.netWeightGrams.toString(),
                operationKey: `opening:${spoolId}`,
              },
            },
          },
        });
      }
    }
    return transaction.appSettings.update({
      where: { id: 1 },
      data: {
        ...data,
        ...(!data.spoolManagementEnabled ? { spoolmanEnabled: false } : {}),
      },
      select: { printSeriesEnabled: true, spoolManagementEnabled: true },
    });
  });
}
