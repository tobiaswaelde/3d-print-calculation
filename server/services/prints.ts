import { bookPrintStock } from './spoolman';
import type { PrintJobDto } from '#shared/types/prints';
import { componentSchema } from '#shared/schemas/master-data';
import { summarizePrints, emptyPrintSummary } from '#shared/domain/print-summary';
import { calculatePrintFinancials } from '#shared/domain/print-financials';
import Decimal from 'decimal.js';
import { spoolBalance, StockDecimal } from './spools';
import { calculateActualPrintCost } from '#shared/domain/print-outcome';
import { printOutcomeSchema, printOutcomeCorrectionSchema } from '#shared/schemas/print-outcomes';
import type { PrintCalculationResult } from '#shared/domain/print-calculation';
import type { Prisma } from '../../prisma/generated/client/client';
import { calculatePrintCost } from '#shared/domain/print-calculation';
import type { PrintDraftInput } from '#shared/schemas/prints';
import {
  printStatusSchema,
  printDraftSchema,
  printListQuerySchema,
  printWorkflowUpdateSchema,
} from '#shared/schemas/prints';
import { canonicalDecimal } from '#shared/utils/decimal';
import { db } from '../utils/db';
import { apiError } from '../utils/http';
import { spoolManagementEnabled } from '../utils/spool-management';
import { parseBody } from '../utils/validation';

type Transaction = Prisma.TransactionClient;
const printInclude = {
  bambuLink: true,
  customer: true,
  printer: true,
  componentUsages: { orderBy: { createdAt: 'asc' as const } },
  filamentUsages: { orderBy: { createdAt: 'asc' as const } },
  snapshot: true,
  series: true,
  repeatOf: { select: { id: true, name: true } },
  repeats: { select: { id: true, name: true } },
  outcome: { include: { corrections: { orderBy: { revision: 'desc' as const }, take: 20 } } },
  retryOf: { select: { id: true, name: true } },
  retries: { select: { id: true, name: true } },
};
type PrintWithSnapshot = Prisma.PrintJobGetPayload<{ include: typeof printInclude }>;

function printDto(value: PrintWithSnapshot): PrintJobDto {
  const exact = value.snapshot?.calculationJson
    ? (JSON.parse(value.snapshot.calculationJson) as PrintCalculationResult)
    : null;
  const exactLine = (id: string) => exact?.lines.find((line) => line.sourceId === id);
  const history = value.outcome
    ? [{ ...value.outcome, revision: 1 }, ...[...value.outcome.corrections].reverse()].map((entry) => ({
        ...printOutcomeSchema.parse(JSON.parse(entry.inputSnapshot)),
        revision: entry.revision,
        recordedAt: entry.recordedAt.toISOString(),
        costs: JSON.parse(entry.costSnapshot) as PrintCalculationResult,
      }))
    : [];
  return {
    id: value.id,
    seriesId: value.seriesId,
    series: value.series
      ? {
          id: value.series.id,
          name: value.series.name,
          archivedAt: value.series.archivedAt?.toISOString() ?? null,
        }
      : null,
    repeatOf: value.repeatOf,
    repeats: value.repeats,
    retryOf: value.retryOf,
    retries: value.retries,
    outcome: history.length ? { ...history.at(-1)!, history } : null,
    salesValue: value.snapshot?.salesValue ?? value.salesValue,
    financials: calculatePrintFinancials(
      value.snapshot?.salesValue ?? value.salesValue,
      exact?.totalCost ?? value.totalCost.toString(),
      value.quantity,
      history.at(-1),
    ),
    name: value.name,
    quantity: value.quantity,
    customer: value.customer ? { id: value.customer.id, name: value.customer.name } : null,
    customerId: value.customerId,
    printer: { id: value.printer.id, name: value.printer.name },
    printerId: value.printerId,
    status: printStatusSchema.parse(value.status),
    notes: value.notes,
    totalDurationSeconds: value.totalDurationSeconds,
    formulaVersion: value.formulaVersion,
    currency: value.currency,
    totalCost: exact?.totalCost ?? canonicalDecimal(value.totalCost.toString()),
    costPerUnit: canonicalDecimal((value.snapshot?.costPerUnit ?? value.totalCost).toString()),
    completedAt: value.completedAt?.toISOString() ?? null,
    paidAt: value.paidAt?.toISOString() ?? null,
    archivedAt: value.archivedAt?.toISOString() ?? null,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
    componentUsages: value.componentUsages.map((entry) => ({
      id: entry.id,
      componentId: entry.componentId,
      type: componentSchema.shape.type.parse(entry.componentType),
      name: entry.componentName,
      purchasePrice: canonicalDecimal(entry.purchasePrice.toString()),
      expectedLifetimeHours: canonicalDecimal(entry.expectedLifetimeHours.toString()),
      hourlyRate: exactLine(entry.componentId)?.unitRate ?? canonicalDecimal(entry.hourlyRate.toString()),
      appliedDurationSeconds: entry.appliedDurationSeconds,
      lineCost: exactLine(entry.componentId)?.cost ?? canonicalDecimal(entry.lineCost.toString()),
    })),
    filamentUsages: value.filamentUsages.map((entry) => ({
      id: entry.id,
      filamentId: entry.filamentId,
      spoolId: entry.spoolId,
      spoolCode: entry.spoolCode,
      name: entry.filamentName,
      manufacturer: entry.manufacturer,
      material: entry.material,
      purchasePrice: canonicalDecimal(entry.purchasePrice.toString()),
      netWeightGrams: canonicalDecimal(entry.netWeightGrams.toString()),
      costPerGram:
        exactLine(entry.spoolId ?? entry.filamentId)?.unitRate ??
        canonicalDecimal(entry.costPerGram.toString()),
      usedGrams:
        exactLine(entry.spoolId ?? entry.filamentId)?.quantity ??
        canonicalDecimal(entry.usedGrams.toString()),
      lineCost:
        exactLine(entry.spoolId ?? entry.filamentId)?.cost ?? canonicalDecimal(entry.lineCost.toString()),
    })),
    snapshot: value.snapshot && {
      salesValue: value.snapshot.salesValue,
      quantity: value.snapshot.quantity,
      costPerUnit: canonicalDecimal((value.snapshot.costPerUnit ?? value.snapshot.totalCost).toString()),
      electricityPricePerKwh: canonicalDecimal(value.snapshot.electricityPricePerKwh.toString()),
      printerName: value.snapshot.printerName,
      printerPurchasePrice: canonicalDecimal(value.snapshot.printerPurchasePrice.toString()),
      printerExpectedLifetimeHours: canonicalDecimal(value.snapshot.printerExpectedLifetimeHours.toString()),
      printerHourlyRate:
        exact?.lines.find((line) => line.category === 'printer')?.unitRate ??
        canonicalDecimal(value.snapshot.printerHourlyRate.toString()),
      printerPowerWatts: value.snapshot.printerPowerWatts,
      printerCost: exact?.printerCost ?? canonicalDecimal(value.snapshot.printerCost.toString()),
      componentCost: exact?.componentCost ?? canonicalDecimal(value.snapshot.componentCost.toString()),
      filamentCost: exact?.filamentCost ?? canonicalDecimal(value.snapshot.filamentCost.toString()),
      electricityCost: exact?.electricityCost ?? canonicalDecimal(value.snapshot.electricityCost.toString()),
      totalCost: exact?.totalCost ?? canonicalDecimal(value.snapshot.totalCost.toString()),
      currency: value.snapshot.currency,
      formulaVersion: value.snapshot.formulaVersion,
      calculatedAt: value.snapshot.calculatedAt.toISOString(),
    },
  };
}

async function resolveCalculation(transaction: Transaction, input: PrintDraftInput) {
  if (input.seriesId) {
    const series = await transaction.printSeries.findFirst({
      where: { id: input.seriesId, archivedAt: null },
    });
    if (!series) apiError(422, 'INVALID_SERIES', 'errors.invalidSeries');
    if (series.customerId) {
      if (input.customerId && input.customerId !== series.customerId)
        apiError(409, 'SERIES_CUSTOMER_CONFLICT', 'errors.seriesCustomerConflict');
      input.customerId = series.customerId;
    }
  }
  const componentIds = [
    input.buildPlateId,
    ...input.hotends.map((entry) => entry.componentId),
    ...input.otherComponentIds,
  ];
  const filamentIds = [...new Set(input.filaments.map((entry) => entry.filamentId))];
  if (new Set(componentIds).size !== componentIds.length)
    apiError(422, 'DUPLICATE_COMPONENT', 'errors.duplicateComponent');

  const [settings, printer, components, filaments, customer] = await Promise.all([
    transaction.appSettings.findUniqueOrThrow({ where: { id: 1 } }),
    transaction.printer.findFirst({ where: { id: input.printerId, archivedAt: null } }),
    transaction.component.findMany({
      where: { id: { in: componentIds }, archivedAt: null },
      include: { printers: true },
    }),
    transaction.filament.findMany({
      where: { id: { in: filamentIds }, archivedAt: null },
      include: { manufacturer: true },
    }),
    input.customerId
      ? transaction.customer.findFirst({ where: { id: input.customerId, archivedAt: null } })
      : Promise.resolve(null),
  ]);
  if (!printer) apiError(422, 'INVALID_PRINTER', 'errors.invalidPrinter');
  if (input.customerId && !customer) apiError(422, 'INVALID_CUSTOMER', 'errors.invalidCustomer');
  if (components.length !== componentIds.length)
    apiError(422, 'INVALID_COMPONENT', 'errors.invalidComponent');
  if (filaments.length !== filamentIds.length) apiError(422, 'INVALID_FILAMENT', 'errors.invalidFilament');

  const spools = settings.spoolManagementEnabled
    ? await transaction.spool.findMany({
        where: { filamentId: { in: filamentIds }, archivedAt: null },
      })
    : [];
  if (settings.spoolManagementEnabled) {
    for (const line of input.filaments) {
      const candidates = spools.filter(
        (spool) => spool.filamentId === line.filamentId && (!line.spoolId || spool.id === line.spoolId),
      );
      const balance = candidates.length === 1 ? await spoolBalance(transaction, candidates[0]!.id) : null;
      if (
        candidates.length !== 1 ||
        ['ARCHIVED', 'MISSING'].includes(candidates[0]!.remoteState ?? '') ||
        (balance !== null && new Decimal(balance).lte(0))
      )
        apiError(422, 'INVALID_SPOOL', 'errors.invalidSpool');
      line.spoolId = candidates[0]!.id;
    }
    if (new Set(input.filaments.map((line) => line.spoolId)).size !== input.filaments.length)
      apiError(422, 'DUPLICATE_FILAMENT', 'errors.duplicateFilament');
  } else {
    for (const line of input.filaments) line.spoolId = undefined;
    if (new Set(input.filaments.map((line) => line.filamentId)).size !== input.filaments.length)
      apiError(422, 'DUPLICATE_FILAMENT', 'errors.duplicateFilament');
  }
  const spoolMap = new Map(spools.map((spool) => [spool.id, spool]));
  const componentMap = new Map(components.map((entry) => [entry.id, entry]));
  const filamentMap = new Map(filaments.map((entry) => [entry.id, entry]));
  const buildPlate = componentMap.get(input.buildPlateId)!;
  if (buildPlate.type !== 'BUILD_PLATE') apiError(422, 'INVALID_BUILD_PLATE', 'errors.invalidBuildPlate');
  for (const hotend of input.hotends) {
    if (componentMap.get(hotend.componentId)?.type !== 'HOTEND')
      apiError(422, 'INVALID_HOTEND', 'errors.invalidHotend');
  }
  for (const id of input.otherComponentIds) {
    if (componentMap.get(id)?.type !== 'OTHER') apiError(422, 'INVALID_COMPONENT', 'errors.invalidComponent');
  }
  for (const component of components) {
    if (!component.printers.some((entry) => entry.printerId === printer.id))
      apiError(422, 'INCOMPATIBLE_COMPONENT', 'errors.incompatibleComponent');
  }

  const result = calculatePrintCost({
    quantity: input.quantity,
    printer: {
      id: printer.id,
      name: printer.name,
      purchasePrice: printer.purchasePrice.toString(),
      expectedLifetimeHours: printer.expectedLifetimeHours.toString(),
      averagePowerWatts: printer.averagePowerWatts,
    },
    buildPlate: {
      id: buildPlate.id,
      name: buildPlate.name,
      purchasePrice: buildPlate.purchasePrice.toString(),
      expectedLifetimeHours: buildPlate.expectedLifetimeHours.toString(),
    },
    hotends: input.hotends.map((entry) => {
      const source = componentMap.get(entry.componentId)!;
      return {
        id: source.id,
        name: source.name,
        purchasePrice: source.purchasePrice.toString(),
        expectedLifetimeHours: source.expectedLifetimeHours.toString(),
        durationSeconds: entry.durationSeconds,
      };
    }),
    otherComponents: input.otherComponentIds.map((id) => {
      const source = componentMap.get(id)!;
      return {
        id: source.id,
        name: source.name,
        purchasePrice: source.purchasePrice.toString(),
        expectedLifetimeHours: source.expectedLifetimeHours.toString(),
      };
    }),
    filaments: input.filaments.map((entry) => {
      const source = filamentMap.get(entry.filamentId)!;
      const spool = entry.spoolId ? spoolMap.get(entry.spoolId) : undefined;
      return {
        id: spool?.id ?? source.id,
        name: spool ? `${source.name} · ${spool.code}` : source.name,
        purchasePrice: (spool?.purchasePrice ?? source.purchasePrice).toString(),
        netWeightGrams: (spool?.initialNetWeightGrams ?? source.netWeightGrams).toString(),
        usedGrams: entry.usedGrams,
      };
    }),
    electricityPricePerKwh: settings.electricityPricePerKwh.toString(),
    currency: settings.currency,
  });
  return { settings, printer, componentMap, filamentMap, spoolMap, result };
}

function persistenceData(input: PrintDraftInput, resolved: Awaited<ReturnType<typeof resolveCalculation>>) {
  const { settings, printer, componentMap, filamentMap, spoolMap, result } = resolved;
  const lineMap = new Map(
    result.lines.filter((line) => line.sourceId !== 'electricity').map((line) => [line.sourceId, line]),
  );
  const componentInputs = [
    { id: input.buildPlateId, duration: result.totalDurationSeconds },
    ...input.hotends.map((entry) => ({ id: entry.componentId, duration: entry.durationSeconds })),
    ...input.otherComponentIds.map((id) => ({ id, duration: result.totalDurationSeconds })),
  ];
  return {
    job: {
      name: input.name,
      quantity: input.quantity,
      salesValue: input.salesValue,
      seriesId: input.seriesId,
      customerId: input.customerId,
      printerId: input.printerId,
      notes: input.notes,
      totalDurationSeconds: result.totalDurationSeconds,
      formulaVersion: result.calculationVersion,
      currency: result.currency,
      totalCost: result.totalCost,
    },
    components: componentInputs.map(({ id, duration }) => {
      const source = componentMap.get(id)!;
      const line = lineMap.get(id)!;
      return {
        componentId: id,
        componentType: source.type,
        componentName: source.name,
        purchasePrice: source.purchasePrice,
        expectedLifetimeHours: source.expectedLifetimeHours,
        hourlyRate: line.unitRate,
        appliedDurationSeconds: duration,
        lineCost: line.cost,
      };
    }),
    filaments: input.filaments.map((entry) => {
      const source = filamentMap.get(entry.filamentId)!;
      const spool = entry.spoolId ? spoolMap.get(entry.spoolId) : undefined;
      const line = lineMap.get(spool?.id ?? source.id)!;
      return {
        filamentId: source.id,
        spoolId: spool?.id ?? null,
        spoolCode: spool?.code ?? null,
        filamentName: source.name,
        manufacturer: source.manufacturer.name,
        material: source.material,
        purchasePrice: spool?.purchasePrice ?? source.purchasePrice,
        netWeightGrams: spool?.initialNetWeightGrams ?? source.netWeightGrams,
        costPerGram: line.unitRate,
        usedGrams: entry.usedGrams,
        lineCost: line.cost,
      };
    }),
    snapshot: {
      calculationJson: JSON.stringify(result),
      salesValue: input.salesValue,
      quantity: result.quantity,
      costPerUnit: result.costPerUnit,
      electricityPricePerKwh: settings.electricityPricePerKwh,
      printerName: printer.name,
      printerPurchasePrice: printer.purchasePrice,
      printerExpectedLifetimeHours: printer.expectedLifetimeHours,
      printerHourlyRate: result.lines.find((line) => line.category === 'printer')!.unitRate,
      printerPowerWatts: printer.averagePowerWatts,
      printerCost: result.printerCost,
      componentCost: result.componentCost,
      filamentCost: result.filamentCost,
      electricityCost: result.electricityCost,
      totalCost: result.totalCost,
      currency: result.currency,
      formulaVersion: result.calculationVersion,
      calculatedAt: new Date(),
    },
    result,
  };
}

export async function previewPrint(input: unknown) {
  const parsed = parseBody(printDraftSchema, input);
  return db.$transaction(async (transaction) => {
    const { result } = await resolveCalculation(transaction, parsed);
    return {
      ...result,
      financials: calculatePrintFinancials(parsed.salesValue, result.totalCost, result.quantity),
    };
  });
}

export async function createPrint(input: unknown, links: { retryOfId?: string; repeatOfId?: string } = {}) {
  const { retryOfId, repeatOfId } = links;
  const parsed = parseBody(printDraftSchema, input);
  return db.$transaction(async (transaction) => {
    if (retryOfId) {
      const source = await transaction.printJob.findFirst({
        where: { id: retryOfId, archivedAt: null, outcome: { status: 'FAILED' } },
      });
      if (!source) apiError(409, 'RETRY_NOT_ALLOWED', 'errors.retryNotAllowed');
    }
    if (
      repeatOfId &&
      !(await transaction.printJob.findFirst({ where: { id: repeatOfId, archivedAt: null, status: 'DONE' } }))
    )
      apiError(409, 'REPEAT_NOT_ALLOWED', 'errors.repeatNotAllowed');
    const data = persistenceData(parsed, await resolveCalculation(transaction, parsed));
    return printDto(
      await transaction.printJob.create({
        data: {
          ...data.job,
          retryOfId,
          repeatOfId,
          componentUsages: { create: data.components },
          filamentUsages: { create: data.filaments },
          snapshot: { create: data.snapshot },
        },
        include: printInclude,
      }),
    );
  });
}

export async function updatePrint(id: string, input: unknown) {
  const parsed = parseBody(printDraftSchema, input);
  return db.$transaction(async (transaction) => {
    const existing = await transaction.printJob.findUniqueOrThrow({ where: { id } });
    if (existing.status !== 'DRAFT') apiError(409, 'PRINT_IMMUTABLE', 'errors.printImmutable');
    const data = persistenceData(parsed, await resolveCalculation(transaction, parsed));
    return printDto(
      await transaction.printJob.update({
        where: { id },
        data: {
          ...data.job,
          componentUsages: { deleteMany: {}, create: data.components },
          filamentUsages: { deleteMany: {}, create: data.filaments },
          snapshot: { update: data.snapshot },
        },
        include: printInclude,
      }),
    );
  });
}

function intentFromPrint(value: PrintWithSnapshot): PrintDraftInput {
  const buildPlate = value.componentUsages.find((entry) => entry.componentType === 'BUILD_PLATE');
  if (!buildPlate) apiError(409, 'STALE_PRINT', 'errors.stalePrint');
  return {
    name: value.name,
    quantity: value.quantity,
    salesValue: value.salesValue,
    seriesId: value.seriesId,
    customerId: value.customerId,
    printerId: value.printerId,
    buildPlateId: buildPlate.componentId,
    hotends: value.componentUsages
      .filter((entry) => entry.componentType === 'HOTEND')
      .map((entry) => ({ componentId: entry.componentId, durationSeconds: entry.appliedDurationSeconds })),
    otherComponentIds: value.componentUsages
      .filter((entry) => entry.componentType === 'OTHER')
      .map((entry) => entry.componentId),
    filaments: printDto(value).filamentUsages.map((entry) => ({
      filamentId: entry.filamentId,
      spoolId: entry.spoolId ?? undefined,
      usedGrams: entry.usedGrams.toString(),
    })),
    notes: value.notes,
  };
}

export async function completePrint(id: string) {
  return updatePrintWorkflow(id, { status: 'DONE' });
}

export async function updatePrintWorkflow(id: string, input: unknown) {
  const parsed = parseBody(printWorkflowUpdateSchema, input);
  return db.$transaction(async (transaction) => {
    const existing = await transaction.printJob.findUniqueOrThrow({ where: { id }, include: printInclude });
    const status = parsed.status ?? existing.status;
    if (status === 'DRAFT' && existing.status !== 'DRAFT')
      apiError(409, 'PRINT_IMMUTABLE', 'errors.printImmutable');

    const paymentData =
      parsed.paid === undefined ? {} : { paidAt: parsed.paid ? (existing.paidAt ?? new Date()) : null };

    if (existing.status !== 'DRAFT' || status === 'DRAFT') {
      const updated = await transaction.printJob.update({
        where: { id },
        data: {
          status,
          ...(status === 'DONE' && !existing.completedAt ? { completedAt: new Date() } : {}),
          ...paymentData,
        },
        include: printInclude,
      });
      await refreshSeriesProgress(transaction, existing.seriesId);
      return printDto(updated);
    }

    const draft = intentFromPrint(existing);
    const data = persistenceData(draft, await resolveCalculation(transaction, draft));
    return printDto(
      await transaction.printJob.update({
        where: { id },
        data: {
          ...data.job,
          status,
          ...(status === 'DONE' ? { completedAt: new Date() } : {}),
          ...paymentData,
          componentUsages: { deleteMany: {}, create: data.components },
          filamentUsages: { deleteMany: {}, create: data.filaments },
          snapshot: { update: data.snapshot },
        },
        include: printInclude,
      }),
    );
  });
}

export async function duplicatePrint(id: string, relationship: 'copy' | 'retry' | 'repeat' = 'copy') {
  const existing = await db.printJob.findUniqueOrThrow({ where: { id }, include: printInclude });
  const input = intentFromPrint(existing);
  if (existing.series?.archivedAt) input.seriesId = null;
  return createPrint(
    { ...input, salesValue: null, name: `${input.name} (copy)` },
    {
      retryOfId: relationship === 'retry' ? id : undefined,
      repeatOfId: relationship === 'repeat' ? id : undefined,
    },
  );
}

export async function archivePrint(id: string, archived: boolean) {
  return db.$transaction(async (transaction) => {
    const print = await transaction.printJob.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
      include: printInclude,
    });
    await refreshSeriesProgress(transaction, print.seriesId);
    return printDto(print);
  });
}

export async function getPrint(id: string) {
  return printDto(await db.printJob.findUniqueOrThrow({ where: { id }, include: printInclude }));
}

function printFilter(input: ReturnType<typeof printListQuerySchema.parse>) {
  const where: Prisma.PrintJobWhereInput = {
    ...(input.includeArchived ? {} : { archivedAt: null }),
    ...(input.status ? { status: input.status } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(input.printerId ? { printerId: input.printerId } : {}),
    ...(input.seriesId ? { seriesId: input.seriesId } : {}),
    ...(input.outcome === 'PENDING'
      ? { outcome: null }
      : input.outcome
        ? { outcome: { status: input.outcome } }
        : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search } },
            { customer: { name: { contains: input.search } } },
            { printer: { name: { contains: input.search } } },
          ],
        }
      : {}),
  };
  const conditions: Prisma.PrintJobWhereInput[] = input.outcome === 'PENDING' ? [{ status: 'DONE' }] : [];
  if (input.dateFrom || input.dateTo) {
    const range = {
      ...(input.dateFrom ? { gte: new Date(`${input.dateFrom}T00:00:00.000Z`) } : {}),
      ...(input.dateTo ? { lte: new Date(`${input.dateTo}T23:59:59.999Z`) } : {}),
    };
    conditions.push({ OR: [{ completedAt: range }, { completedAt: null, createdAt: range }] });
  }
  where.AND = conditions;
  return where;
}

export async function listPrints(query: Record<string, unknown>, transaction?: Transaction) {
  const input = parseBody(printListQuerySchema, query);
  const where = printFilter(input);
  const run = async (client: Transaction) => {
    const [items, total] = await Promise.all([
      client.printJob.findMany({
        where,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { updatedAt: 'desc' },
        include: printInclude,
      }),
      client.printJob.count({ where }),
    ]);
    return { items: items.map(printDto), total, page: input.page, pageSize: input.pageSize };
  };
  return transaction ? run(transaction) : db.$transaction(run);
}

export async function assertUnreferenced(
  resource: 'customers' | 'printers' | 'manufacturers' | 'components' | 'filaments',
  id: string,
) {
  let count: number;
  if (resource === 'customers')
    count =
      (await db.printJob.count({ where: { customerId: id } })) +
      (await db.printSeries.count({ where: { customerId: id } }));
  else if (resource === 'printers') count = await db.printJob.count({ where: { printerId: id } });
  else if (resource === 'manufacturers')
    count =
      (await db.component.count({ where: { manufacturerId: id } })) +
      (await db.filament.count({ where: { manufacturerId: id } }));
  else if (resource === 'components')
    count = await db.printComponentUsage.count({ where: { componentId: id } });
  else
    count =
      (await db.printFilamentUsage.count({ where: { filamentId: id } })) +
      (await db.spool.count({ where: { filamentId: id } }));
  if (count) apiError(409, 'RESOURCE_REFERENCED', 'errors.resourceReferenced');
}

export async function recordPrintOutcome(id: string, input: unknown, externalAlreadyTracked = false) {
  const parsed = parseBody(printOutcomeSchema, input);
  parsed.filaments.sort((a, b) => a.usageId.localeCompare(b.usageId));
  return db.$transaction(async (transaction) => {
    const existing = await transaction.printJob.findUniqueOrThrow({ where: { id }, include: printInclude });
    if (existing.status !== 'DONE' || existing.archivedAt || !existing.snapshot)
      apiError(409, 'OUTCOME_NOT_ALLOWED', 'errors.outcomeNotAllowed');
    const inputSnapshot = JSON.stringify(parsed);
    if (existing.outcome) {
      if (existing.outcome.inputSnapshot !== inputSnapshot)
        apiError(409, 'OUTCOME_IMMUTABLE', 'errors.outcomeImmutable');
      return printDto(existing);
    }
    const source = printDto(existing);
    if (
      parsed.filaments.length !== source.filamentUsages.length ||
      parsed.filaments.some((line) => !source.filamentUsages.some((usage) => usage.id === line.usageId))
    )
      apiError(422, 'INVALID_ACTUAL_USAGE', 'errors.invalidActualUsage');
    const costs = calculateActualPrintCost({ ...source, snapshot: source.snapshot! }, parsed);
    const stockEnabled = await spoolManagementEnabled(transaction);
    await transaction.printOutcome.create({
      data: {
        printJobId: id,
        status: parsed.status,
        durationSeconds: parsed.durationSeconds,
        failureReason: parsed.failureReason,
        note: parsed.note,
        inputSnapshot,
        costSnapshot: JSON.stringify(costs),
        stockTracked: stockEnabled,
      },
    });
    if (stockEnabled)
      for (const usage of existing.filamentUsages) {
        if (!usage.spoolId) continue;
        const grams = parsed.filaments.find((line) => line.usageId === usage.id)!.usedGrams;
        await bookPrintStock(
          transaction,
          {
            spoolId: usage.spoolId,
            kind: 'PRINT',
            grams: new Decimal(grams).negated().toFixed(),
            printUsageId: usage.id,
            operationKey: `outcome:${id}:${usage.id}`,
          },
          externalAlreadyTracked,
        );
      }
    if (externalAlreadyTracked && existing.bambuLink)
      await transaction.bambuPrintLink.update({
        where: { id: existing.bambuLink.id },
        data: { importedAt: new Date(), importedJson: inputSnapshot },
      });
    await refreshSeriesProgress(transaction, existing.seriesId);
    return printDto(await transaction.printJob.findUniqueOrThrow({ where: { id }, include: printInclude }));
  });
}

export async function correctPrintOutcome(id: string, input: unknown) {
  const { operationKey, expectedRevision, ...parsed } = parseBody(printOutcomeCorrectionSchema, input);
  parsed.filaments.sort((a, b) => a.usageId.localeCompare(b.usageId));
  return db.$transaction(async (transaction) => {
    const existing = await transaction.printJob.findUniqueOrThrow({ where: { id }, include: printInclude });
    if (existing.status !== 'DONE' || existing.archivedAt || !existing.outcome || !existing.snapshot)
      apiError(409, 'OUTCOME_NOT_ALLOWED', 'errors.outcomeNotAllowed');
    const source = printDto(existing);
    const inputSnapshot = JSON.stringify(parsed);
    const previousOperation = await transaction.printOutcomeCorrection.findUnique({
      where: { operationKey },
    });
    if (previousOperation) {
      if (
        previousOperation.outcomeId !== existing.outcome.id ||
        previousOperation.inputSnapshot !== inputSnapshot ||
        previousOperation.revision !== expectedRevision + 1
      )
        apiError(409, 'STOCK_OPERATION_CONFLICT', 'errors.stockOperationConflict');
      return source;
    }
    if (source.outcome!.revision !== expectedRevision)
      apiError(409, 'OUTCOME_REVISION_CONFLICT', 'errors.outcomeRevisionConflict');
    if (
      parsed.filaments.length !== source.filamentUsages.length ||
      parsed.filaments.some((line) => !source.filamentUsages.some((usage) => usage.id === line.usageId))
    )
      apiError(422, 'INVALID_ACTUAL_USAGE', 'errors.invalidActualUsage');
    const costs = calculateActualPrintCost({ ...source, snapshot: source.snapshot! }, parsed);
    const stockEnabled = await spoolManagementEnabled(transaction);
    await transaction.printOutcomeCorrection.create({
      data: {
        outcomeId: existing.outcome.id,
        revision: expectedRevision + 1,
        operationKey,
        inputSnapshot,
        costSnapshot: JSON.stringify(costs),
      },
    });
    if (stockEnabled && existing.outcome.stockTracked)
      for (const usage of existing.filamentUsages) {
        if (!usage.spoolId) continue;
        const previousGrams = source.outcome!.filaments.find((line) => line.usageId === usage.id)!.usedGrams;
        const currentGrams = parsed.filaments.find((line) => line.usageId === usage.id)!.usedGrams;
        const delta = new StockDecimal(previousGrams).minus(currentGrams);
        if (!delta.isZero())
          await bookPrintStock(
            transaction,
            {
              spoolId: usage.spoolId,
              kind: 'CORRECTION',
              grams: delta.toFixed(),
              note: parsed.note,
              printUsageId: usage.id,
              operationKey: `correction:${operationKey}:${usage.id}`,
            },
            !!existing.bambuLink?.importedAt,
          );
      }
    await transaction.printOutcome.update({
      where: { id: existing.outcome.id },
      data: {
        status: parsed.status,
        durationSeconds: parsed.durationSeconds,
        note: parsed.note,
        failureReason: parsed.failureReason,
        ...(!stockEnabled ? { stockTracked: false } : {}),
      },
    });
    await refreshSeriesProgress(transaction, existing.seriesId);
    return printDto(await transaction.printJob.findUniqueOrThrow({ where: { id }, include: printInclude }));
  });
}

export async function aggregatePrints(query: Record<string, unknown>, transaction?: Transaction) {
  const input = parseBody(printListQuerySchema, query);
  const run = async (transaction: Transaction) => {
    let summary = emptyPrintSummary();
    let cursor: string | undefined;
    for (;;) {
      const rows = await transaction.printJob.findMany({
        where: printFilter(input),
        include: printInclude,
        orderBy: { id: 'asc' },
        take: 100,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      summary = summarizePrints(rows.map(printDto), summary);
      if (rows.length < 100) return summary;
      cursor = rows.at(-1)!.id;
    }
  };
  return transaction ? run(transaction) : db.$transaction(run);
}

export async function refreshSeriesProgress(transaction: Transaction, seriesId: string | null) {
  if (!seriesId) return;
  const series = await transaction.printSeries.findUniqueOrThrow({ where: { id: seriesId } });
  if (!series.autoComplete || series.targetQuantity === null) return;
  const quantity = await transaction.printJob.aggregate({
    where: { seriesId, status: 'DONE', archivedAt: null, outcome: { status: 'SUCCESS' } },
    _sum: { quantity: true },
  });
  await transaction.printSeries.update({
    where: { id: seriesId },
    data: { status: (quantity._sum.quantity ?? 0) >= series.targetQuantity ? 'COMPLETED' : 'OPEN' },
  });
}
