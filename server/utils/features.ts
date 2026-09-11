import type { Prisma } from '../../prisma/generated/client/client';
import type { FeatureSettings } from '#shared/schemas/features';
import { db } from './db';
import { apiError } from './http';

type Feature = keyof FeatureSettings;
type SettingsClient = Pick<Prisma.TransactionClient, 'appSettings'>;

export async function readFeatureFlags(client: SettingsClient = db): Promise<FeatureSettings> {
  return client.appSettings.findUniqueOrThrow({
    where: { id: 1 },
    select: { printSeriesEnabled: true, spoolManagementEnabled: true },
  });
}

export async function requireFeature(feature: Feature, client: SettingsClient = db) {
  const flags = await readFeatureFlags(client);
  if (flags[feature]) return;
  if (feature === 'printSeriesEnabled') apiError(409, 'PRINT_SERIES_DISABLED', 'errors.printSeriesDisabled');
  apiError(409, 'SPOOL_MANAGEMENT_DISABLED', 'errors.spoolManagementDisabled');
}
