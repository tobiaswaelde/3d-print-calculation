import type { Prisma } from '../../prisma/generated/client/client';
import { db } from './db';
import { apiError } from './http';

type SettingsClient = Pick<Prisma.TransactionClient, 'appSettings'>;

export async function spoolManagementEnabled(client: SettingsClient = db) {
  return (
    await client.appSettings.findUniqueOrThrow({
      where: { id: 1 },
      select: { spoolManagementEnabled: true },
    })
  ).spoolManagementEnabled;
}

export async function requireSpoolManagement(client: SettingsClient = db) {
  if (!(await spoolManagementEnabled(client)))
    apiError(409, 'SPOOL_MANAGEMENT_DISABLED', 'errors.spoolManagementDisabled');
}
