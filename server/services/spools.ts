import Decimal from 'decimal.js';
import type { Prisma } from '../../prisma/generated/client/client';
import { spoolSchema, spoolListSchema, stockMovementSchema } from '#shared/schemas/spools';
import { archiveSchema } from '#shared/schemas/master-data';
import { canonicalDecimal } from '#shared/utils/decimal';
import { db } from '../utils/db';
import { parseBody } from '../utils/validation';
import { apiError } from '../utils/http';

export const StockDecimal = Decimal.clone({ precision: 256 });

type Transaction = Prisma.TransactionClient;
const include = { filament: true };
type Spool = Prisma.SpoolGetPayload<{ include: typeof include }>;

// ponytail: balances scan immutable movements; add transactional checkpoints if long histories make reads slow.
export async function spoolBalance(transaction: Transaction, spoolId: string) {
  const spool = await transaction.spool.findUniqueOrThrow({ where: { id: spoolId } });
  if (spool.stockAuthority !== 'NATIVE') return spool.remoteRemainingGrams;
  let balance = new StockDecimal(0);
  let cursor: string | undefined;
  for (;;) {
    const rows = await transaction.stockMovement.findMany({
      where: { spoolId },
      select: { id: true, grams: true },
      orderBy: { id: 'asc' },
      take: 500,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    for (const row of rows) balance = balance.plus(row.grams);
    if (rows.length < 500) return canonicalDecimal(balance);
    cursor = rows.at(-1)!.id;
  }
}

async function dto(transaction: Transaction, spool: Spool) {
  return {
    spoolmanId: spool.spoolmanId,
    stockAuthority: spool.stockAuthority,
    remoteState: spool.remoteState,
    syncedAt: spool.syncedAt?.toISOString() ?? null,
    syncError: spool.syncError,
    stale:
      spool.stockAuthority !== 'NATIVE' &&
      (!spool.syncedAt || Date.now() - spool.syncedAt.getTime() > 300000 || !!spool.syncError),
    id: spool.id,
    code: spool.code,
    filamentId: spool.filamentId,
    filamentName: spool.filament.name,
    purchaseLot: spool.purchaseLot,
    location: spool.location,
    acquiredAt: spool.acquiredAt?.toISOString().slice(0, 10) ?? null,
    purchasePrice: spool.purchasePrice,
    initialNetWeightGrams: spool.initialNetWeightGrams,
    costPerGram: canonicalDecimal(new Decimal(spool.purchasePrice).div(spool.initialNetWeightGrams)),
    remainingGrams: await spoolBalance(transaction, spool.id),
    legacy: spool.legacy,
    archivedAt: spool.archivedAt?.toISOString() ?? null,
  };
}

export async function listSpools(query: Record<string, unknown>) {
  const input = parseBody(spoolListSchema, query);
  return db.$transaction(async (transaction) => {
    const where = {
      ...(input.includeArchived ? {} : { archivedAt: null, filament: { archivedAt: null } }),
      ...(input.filamentId ? { filamentId: input.filamentId } : {}),
      ...(input.search
        ? {
            OR: [
              { code: { contains: input.search } },
              { location: { contains: input.search } },
              { filament: { name: { contains: input.search } } },
            ],
          }
        : {}),
    };
    if (input.availableOnly) {
      const items: Awaited<ReturnType<typeof dto>>[] = [];
      let total = 0;
      let cursor: string | undefined;
      for (;;) {
        const batch = await transaction.spool.findMany({
          where,
          include,
          orderBy: { id: 'asc' },
          take: 100,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        for (const row of batch) {
          const item = await dto(transaction, row);
          if (
            ['ARCHIVED', 'MISSING'].includes(item.remoteState ?? '') ||
            (item.remainingGrams !== null && new Decimal(item.remainingGrams).lte(0))
          )
            continue;
          if (total >= (input.page - 1) * input.pageSize && items.length < input.pageSize) items.push(item);
          total++;
        }
        if (batch.length < 100) break;
        cursor = batch.at(-1)!.id;
      }
      return { items, total, page: input.page, pageSize: input.pageSize };
    }
    const rows = await transaction.spool.findMany({
      where,
      orderBy: { code: 'asc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include,
    });
    const items = await Promise.all(rows.map((row) => dto(transaction, row)));
    return {
      items,
      total: await transaction.spool.count({ where }),
      page: input.page,
      pageSize: input.pageSize,
    };
  });
}

export async function getSpool(id: string, query: Record<string, unknown> = {}) {
  const input = parseBody(spoolListSchema, query);
  return db.$transaction(async (transaction) => ({
    ...(await dto(transaction, await transaction.spool.findUniqueOrThrow({ where: { id }, include }))),
    movements: (
      await transaction.stockMovement.findMany({
        where: { spoolId: id },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { printUsage: { select: { printJobId: true } } },
      })
    ).map((row) => ({
      id: row.id,
      kind: row.kind,
      grams: row.grams,
      note: row.note,
      printJobId: row.printUsage?.printJobId ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    movementCount: await transaction.stockMovement.count({ where: { spoolId: id } }),
  }));
}

export async function createSpool(input: unknown) {
  const data = parseBody(spoolSchema, input);
  return db.$transaction(async (transaction) => {
    if (!(await transaction.filament.findFirst({ where: { id: data.filamentId, archivedAt: null } })))
      apiError(422, 'INVALID_FILAMENT', 'errors.invalidFilament');
    const spool = await transaction.spool.create({
      data: { ...data, acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null },
      include,
    });
    await transaction.stockMovement.create({
      data: {
        spoolId: spool.id,
        kind: 'RECEIPT',
        grams: data.initialNetWeightGrams,
        operationKey: `opening:${spool.id}`,
      },
    });
    return dto(transaction, spool);
  });
}

export async function updateSpool(id: string, input: unknown) {
  const data = parseBody(spoolSchema, input);
  return db.$transaction(async (transaction) => {
    const existing = await transaction.spool.findUniqueOrThrow({ where: { id } });
    if (existing.stockAuthority !== 'NATIVE')
      apiError(409, 'STOCK_OWNED_EXTERNALLY', 'errors.stockOwnedExternally');
    if (
      existing.filamentId !== data.filamentId ||
      existing.initialNetWeightGrams !== data.initialNetWeightGrams ||
      existing.code !== data.code
    )
      apiError(409, 'SPOOL_IDENTITY_IMMUTABLE', 'errors.spoolIdentityImmutable');
    return dto(
      transaction,
      await transaction.spool.update({
        where: { id },
        data: {
          purchasePrice: data.purchasePrice,
          purchaseLot: data.purchaseLot,
          location: data.location,
          acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null,
        },
        include,
      }),
    );
  });
}

export async function archiveSpool(id: string, input: unknown) {
  const { archived } = parseBody(archiveSchema, input);
  return db.$transaction(async (transaction) =>
    dto(
      transaction,
      await transaction.spool.update({
        where: { id },
        data: { archivedAt: archived ? new Date() : null },
        include,
      }),
    ),
  );
}

export async function moveStock(id: string, input: unknown) {
  const data = parseBody(stockMovementSchema, input);
  return db.$transaction(async (transaction) => {
    const spool = await transaction.spool.findUniqueOrThrow({ where: { id }, include });
    if (spool.stockAuthority !== 'NATIVE')
      apiError(409, 'STOCK_OWNED_EXTERNALLY', 'errors.stockOwnedExternally');
    if (spool.archivedAt) apiError(409, 'SPOOL_ARCHIVED', 'errors.spoolArchived');
    const existing = await transaction.stockMovement.findUnique({
      where: { operationKey: data.operationKey },
    });
    if (existing) {
      if (
        existing.spoolId !== id ||
        existing.grams !== data.grams ||
        existing.kind !== data.kind ||
        existing.note !== data.note
      )
        apiError(409, 'STOCK_OPERATION_CONFLICT', 'errors.stockOperationConflict');
    } else await transaction.stockMovement.create({ data: { ...data, spoolId: id } });
    return dto(transaction, spool);
  });
}

export async function filamentStock(transaction: Transaction, filamentId: string) {
  const filament = await transaction.filament.findUniqueOrThrow({ where: { id: filamentId } });
  const spools = await transaction.spool.findMany({
    where: { filamentId, archivedAt: null },
    select: { id: true },
  });
  const balances = await Promise.all(spools.map((spool) => spoolBalance(transaction, spool.id)));
  const remainingGrams = balances.reduce((sum, grams) => sum.plus(grams ?? '0'), new StockDecimal(0));
  return {
    filamentId,
    name: filament.name,
    minimumStockGrams: filament.minimumStockGrams,
    remainingGrams: balances.includes(null) ? null : canonicalDecimal(remainingGrams),
    lowStock: !balances.includes(null) && remainingGrams.lt(filament.minimumStockGrams),
  };
}

export async function lowStockFilaments() {
  return db.$transaction(async (transaction) => {
    const filaments = await transaction.filament.findMany({
      where: { archivedAt: null },
      select: { id: true },
    });
    const stock = await Promise.all(filaments.map((filament) => filamentStock(transaction, filament.id)));
    return stock.filter((item) => item.lowStock);
  });
}
