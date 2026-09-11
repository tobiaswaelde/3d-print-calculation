import { z } from 'zod';
import { createHash } from 'node:crypto';
import Decimal from 'decimal.js';
import type { Prisma } from '../../prisma/generated/client/client';
import {
  integrationPageSchema,
  spoolmanImportSchema,
  spoolmanUnlinkSchema,
  syncOperationSchema,
} from '#shared/schemas/integrations';
import { db } from '../utils/db';
import { apiError } from '../utils/http';
import { parseBody } from '../utils/validation';
import { integrationConfigured, integrationRequest } from '../utils/integrations/http';
import { spoolmanSpoolSchema, type RemoteSpool } from '../utils/integrations/spoolman-contract';

function contract(value: unknown) {
  const result = spoolmanSpoolSchema.safeParse(value);
  if (!result.success) return apiError(502, 'INTEGRATION_CONTRACT', 'errors.integrationContract');
  return result.data;
}
function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function errorCode(reason: unknown) {
  if (
    reason &&
    typeof reason === 'object' &&
    'data' in reason &&
    reason.data &&
    typeof reason.data === 'object' &&
    'code' in reason.data
  )
    return String(reason.data.code);
  return 'INTEGRATION_UNAVAILABLE';
}
const remote = async (id: number) => {
  const value = contract(await integrationRequest('SPOOLMAN', `api/v1/spool/${id}`));
  if (value.id !== id) apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
  return value;
};
function cached(spool: RemoteSpool) {
  return {
    remoteRemainingGrams:
      spool.remaining_weight == null ? null : new Decimal(spool.remaining_weight).toFixed(),
    remoteState: spool.archived ? 'ARCHIVED' : 'ACTIVE',
    syncedAt: new Date(),
    syncError: null,
    location: spool.location ?? null,
  };
}
export async function spoolmanPreview(query: Record<string, unknown>) {
  const { page } = parseBody(integrationPageSchema, query);
  const response = await integrationRequest(
    'SPOOLMAN',
    `api/v1/spool?limit=50&offset=${(page - 1) * 50}&allow_archived=true`,
  );
  if (!Array.isArray(response) || response.length > 50)
    return apiError(502, 'INTEGRATION_CONTRACT', 'errors.integrationContract');
  const items = [];
  for (const entry of response) {
    const spool = contract(entry);
    const local = await db.spool.findUnique({ where: { spoolmanId: spool.id } });
    items.push({
      ...spool,
      previewHash: hash(spool),
      localId: local?.id ?? null,
      localCode: local?.code ?? null,
      authority: local?.stockAuthority ?? 'SPOOLMAN_READ_ONLY',
      conflicts: [
        ...(spool.archived ? ['ARCHIVED'] : []),
        ...(!spool.filament.vendor ||
        (spool.price ?? spool.filament.price) == null ||
        !(spool.initial_weight ?? spool.filament.weight)
          ? ['MISSING_PRICING']
          : []),
        ...(spool.remaining_weight == null ? ['UNKNOWN_BALANCE'] : []),
        ...(local && local.remoteRemainingGrams !== cached(spool).remoteRemainingGrams
          ? ['BALANCE_CHANGED']
          : []),
      ],
    });
  }
  return { items, page, hasMore: items.length === 50 };
}
export async function importSpoolman(input: unknown) {
  const data = parseBody(spoolmanImportSchema, input);
  const spool = await remote(data.remoteId);
  if (hash(spool) !== data.previewHash) apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
  const vendor = spool.filament.vendor;
  const price = spool.price ?? spool.filament.price;
  const weight = spool.initial_weight ?? spool.filament.weight;
  if (!vendor || price == null || !weight || spool.archived)
    apiError(422, 'INTEGRATION_METADATA', 'errors.integrationMetadata');
  return db.$transaction(async (transaction) => {
    const existing = await transaction.spool.findUnique({ where: { spoolmanId: spool.id } });
    if (data.localSpoolId && existing && existing.id !== data.localSpoolId)
      apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
    if (
      existing &&
      existing.stockAuthority !== data.authority &&
      (await transaction.spoolSyncOperation.count({
        where: { spoolId: existing.id, state: { notIn: ['APPLIED', 'CANCELLED'] } },
      }))
    )
      apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
    const manufacturer = await transaction.manufacturer.upsert({
      where: { spoolmanId: vendor.id },
      create: { spoolmanId: vendor.id, name: vendor.name },
      update: { name: vendor.name },
    });
    const filamentData = {
      name: spool.filament.name ?? `Spoolman ${spool.filament.id}`,
      manufacturerId: manufacturer.id,
      material: spool.filament.material ?? '',
      colorName: spool.filament.name ?? '',
      colorHex: `#${spool.filament.color_hex?.slice(0, 6) ?? 'FFFFFF'}`,
      purchasePrice: String(price),
      netWeightGrams: String(weight),
    };
    const filament = await transaction.filament.upsert({
      where: { spoolmanId: spool.filament.id },
      create: { ...filamentData, spoolmanId: spool.filament.id },
      update: filamentData,
    });
    const local = data.localSpoolId
      ? await transaction.spool.findUniqueOrThrow({ where: { id: data.localSpoolId } })
      : existing;
    if (
      local &&
      (local.filamentId !== filament.id || (local.spoolmanId !== null && local.spoolmanId !== spool.id))
    )
      apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
    const values = {
      ...cached(spool),
      stockAuthority: data.authority,
      spoolmanId: spool.id,
      purchasePrice: String(price),
    };
    const result = local
      ? await transaction.spool.update({ where: { id: local.id }, data: values })
      : await transaction.spool.create({
          data: {
            ...values,
            code: `SM-${spool.id}`,
            filamentId: filament.id,
            initialNetWeightGrams: String(weight),
          },
        });
    return { id: result.id };
  });
}
export async function syncSpoolman(spoolId: string) {
  const local = await db.spool.findUniqueOrThrow({ where: { id: spoolId } });
  if (!local.spoolmanId || local.stockAuthority === 'NATIVE') return;
  try {
    const spool = await remote(local.spoolmanId);
    const filament = await db.filament.findUniqueOrThrow({ where: { id: local.filamentId } });
    if (filament.spoolmanId !== spool.filament.id)
      apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
    await db.$transaction(async (transaction) => {
      await transaction.spool.update({
        where: { id: spoolId },
        data: {
          ...cached(spool),
          ...((spool.price ?? spool.filament.price) == null
            ? {}
            : { purchasePrice: String(spool.price ?? spool.filament.price) }),
        },
      });
      await transaction.filament.update({
        where: { id: filament.id },
        data: { name: spool.filament.name ?? filament.name },
      });
    });
  } catch (reason) {
    const code = errorCode(reason);
    await db.spool.update({
      where: { id: spoolId },
      data: { syncError: code, ...(code === 'REMOTE_HTTP_404' ? { remoteState: 'MISSING' } : {}) },
    });
  }
}
export async function unlinkSpoolman(input: unknown) {
  const data = parseBody(spoolmanUnlinkSchema, input);
  return db.$transaction(async (transaction) => {
    const spool = await transaction.spool.findUniqueOrThrow({ where: { id: data.spoolId } });
    if (spool.stockAuthority === 'NATIVE') return { id: spool.id };
    if (
      await transaction.spoolSyncOperation.count({
        where: { spoolId: spool.id, state: { notIn: ['APPLIED', 'CANCELLED'] } },
      })
    )
      apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
    const rows = await transaction.stockMovement.findMany({
      where: { spoolId: spool.id },
      select: { grams: true },
    });
    const balance = rows.reduce((sum, row) => sum.plus(row.grams), new Decimal(0));
    await transaction.stockMovement.create({
      data: {
        spoolId: spool.id,
        kind: 'CORRECTION',
        grams: new Decimal(data.openingBalance).minus(balance).toFixed(),
        note: 'Spoolman unlink: confirmed native opening balance',
        operationKey: `unlink:${spool.id}:${crypto.randomUUID()}`,
      },
    });
    await transaction.spool.update({
      where: { id: spool.id },
      data: { stockAuthority: 'NATIVE', remoteState: null, syncError: null },
    });
    return { id: spool.id };
  });
}
export async function bookPrintStock(
  transaction: Prisma.TransactionClient,
  data: {
    spoolId: string;
    grams: string;
    operationKey: string;
    printUsageId: string;
    kind: string;
    note?: string | null;
  },
  externalAlreadyTracked = false,
) {
  const spool = await transaction.spool.findUniqueOrThrow({ where: { id: data.spoolId } });
  if (spool.stockAuthority === 'NATIVE') return transaction.stockMovement.create({ data });
  if (spool.stockAuthority === 'EZPRINT_CONSUMPTION' && spool.spoolmanId && !externalAlreadyTracked)
    await transaction.spoolSyncOperation.create({
      data: {
        spoolId: spool.id,
        remoteId: spool.spoolmanId,
        operationKey: data.operationKey,
        grams: new Decimal(data.grams).negated().toFixed(),
      },
    });
}
export async function reconcileSpoolOperation(input: unknown) {
  const data = parseBody(syncOperationSchema, input);
  const operation = await db.spoolSyncOperation.findUniqueOrThrow({ where: { id: data.operationId } });
  if (data.action !== 'SEND') {
    if (!['UNKNOWN', 'FAILED'].includes(operation.state))
      apiError(409, 'INTEGRATION_CONFLICT', 'errors.integrationConflict');
    await db.spoolSyncOperation.update({
      where: { id: operation.id },
      data: { state: data.action === 'CONFIRM_APPLIED' ? 'APPLIED' : 'PENDING', error: null },
    });
    return;
  }
  // Spoolman's additive usage API has no idempotency key. Persist UNKNOWN before sending; never blindly retry an ambiguous request.
  const claimed = await db.spoolSyncOperation.updateMany({
    where: { id: operation.id, state: 'PENDING' },
    data: { state: 'UNKNOWN' },
  });
  if (!claimed.count) return;
  try {
    await integrationRequest('SPOOLMAN', `api/v1/spool/${operation.remoteId}/use`, {
      method: 'PUT',
      body: { use_weight: Number(operation.grams) },
    });
    await db.spoolSyncOperation.update({
      where: { id: operation.id },
      data: { state: 'APPLIED', error: null },
    });
    await syncSpoolman(operation.spoolId);
  } catch (reason) {
    const code = errorCode(reason);
    await db.spoolSyncOperation.update({
      where: { id: operation.id },
      data: { state: /^REMOTE_HTTP_4\d\d$/.test(code) ? 'FAILED' : 'UNKNOWN', error: code },
    });
  }
}
export async function spoolmanStatus() {
  let version: string | null = null;
  let error: string | null = null;
  const configured = await integrationConfigured('SPOOLMAN');
  if (configured)
    try {
      version = z
        .object({ version: z.string().max(64) })
        .parse(await integrationRequest('SPOOLMAN', 'api/v1/info')).version;
    } catch {
      error = 'INTEGRATION_UNAVAILABLE';
    }
  return {
    version,
    error,
    configured,
    capabilities: ['spool-v1', 'explicit-consumption'],
    operations: await db.spoolSyncOperation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, spoolId: true, grams: true, state: true, error: true, updatedAt: true },
    }),
  };
}
