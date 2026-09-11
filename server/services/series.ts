import type { Prisma } from '../../prisma/generated/client/client';
import { seriesSchema, seriesListSchema, seriesStateSchema, nextRunSchema } from '#shared/schemas/series';
import { archiveSchema } from '#shared/schemas/master-data';
import { emptyPrintSummary, type PrintSummary } from '#shared/domain/print-summary';
import { db } from '../utils/db';
import { apiError } from '../utils/http';
import { parseBody } from '../utils/validation';
import { aggregatePrints, listPrints, duplicatePrint, refreshSeriesProgress } from './prints';

const include = { customer: true };
type Series = Prisma.PrintSeriesGetPayload<{ include: typeof include }>;
function dto(series: Series, currency: string, summary: PrintSummary = emptyPrintSummary()) {
  return {
    id: series.id,
    name: series.name,
    customerId: series.customerId,
    customer: series.customer ? { id: series.customer.id, name: series.customer.name } : null,
    targetQuantity: series.targetQuantity,
    notes: series.notes,
    status: series.status,
    autoComplete: series.autoComplete,
    archivedAt: series.archivedAt?.toISOString() ?? null,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
    currency,
    summary,
  };
}
export async function createSeries(input: unknown) {
  const data = parseBody(seriesSchema, input);
  return db.$transaction(async (transaction) => {
    if (
      data.customerId &&
      !(await transaction.customer.findFirst({ where: { id: data.customerId, archivedAt: null } }))
    )
      apiError(422, 'INVALID_CUSTOMER', 'errors.invalidCustomer');
    const series = await transaction.printSeries.create({ data, include });
    return dto(series, (await transaction.appSettings.findUniqueOrThrow({ where: { id: 1 } })).currency);
  });
}
export async function getSeries(id: string) {
  return db.$transaction(async (transaction) =>
    dto(
      await transaction.printSeries.findUniqueOrThrow({ where: { id }, include }),
      (await transaction.appSettings.findUniqueOrThrow({ where: { id: 1 } })).currency,
      await aggregatePrints({ seriesId: id }, transaction),
    ),
  );
}
export async function listSeries(query: Record<string, unknown>) {
  const input = parseBody(seriesListSchema, query);
  return db.$transaction(async (transaction) => {
    const where = {
      ...(input.includeArchived ? {} : { archivedAt: null }),
      ...(input.status ? { status: input.status } : {}),
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.search
        ? { OR: [{ name: { contains: input.search } }, { customer: { name: { contains: input.search } } }] }
        : {}),
    };
    const series = await transaction.printSeries.findMany({
      where,
      include,
      orderBy: { updatedAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });
    const currency = (await transaction.appSettings.findUniqueOrThrow({ where: { id: 1 } })).currency;
    const items = await Promise.all(
      series.map(async (row) => dto(row, currency, await aggregatePrints({ seriesId: row.id }, transaction))),
    );
    return {
      items,
      total: await transaction.printSeries.count({ where }),
      page: input.page,
      pageSize: input.pageSize,
    };
  });
}
export async function updateSeries(id: string, input: unknown) {
  const data = parseBody(seriesSchema, input);
  await db.$transaction(async (transaction) => {
    if (data.customerId) {
      if (!(await transaction.customer.findFirst({ where: { id: data.customerId, archivedAt: null } })))
        apiError(422, 'INVALID_CUSTOMER', 'errors.invalidCustomer');
      const conflict = await transaction.printJob.findFirst({
        where: { seriesId: id, OR: [{ customerId: null }, { customerId: { not: data.customerId } }] },
        select: { id: true },
      });
      if (conflict) apiError(409, 'SERIES_CUSTOMER_CONFLICT', 'errors.seriesCustomerConflict');
    }
    await transaction.printSeries.update({ where: { id }, data });
    await refreshSeriesProgress(transaction, id);
  });
  return getSeries(id);
}
export async function setSeriesState(id: string, input: unknown) {
  const { status } = parseBody(seriesStateSchema, input);
  await db.printSeries.update({ where: { id }, data: { status, autoComplete: false } });
  return getSeries(id);
}
export async function archiveSeries(id: string, input: unknown) {
  const { archived } = parseBody(archiveSchema, input);
  await db.printSeries.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
  return getSeries(id);
}
export async function nextSeriesRun(id: string, input: unknown) {
  const { sourcePrintId } = parseBody(nextRunSchema, input);
  if (
    !(await db.printJob.findFirst({
      where: { id: sourcePrintId, seriesId: id, archivedAt: null, series: { archivedAt: null } },
    }))
  )
    apiError(409, 'INVALID_SERIES', 'errors.invalidSeries');
  return duplicatePrint(sourcePrintId);
}
export async function printHistory(
  scope: { customerId: string } | { seriesId: string },
  query: Record<string, unknown>,
) {
  return db.$transaction(async (transaction) => {
    if ('customerId' in scope)
      await transaction.customer.findUniqueOrThrow({ where: { id: scope.customerId } });
    else await transaction.printSeries.findUniqueOrThrow({ where: { id: scope.seriesId } });
    const filters = { ...query, ...scope };
    return {
      ...(await listPrints(filters, transaction)),
      summary: await aggregatePrints(filters, transaction),
      currency: (await transaction.appSettings.findUniqueOrThrow({ where: { id: 1 } })).currency,
    };
  });
}
