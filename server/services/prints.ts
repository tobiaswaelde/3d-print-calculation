import type { Prisma } from '../../prisma/generated/client/client';
import { calculatePrintCost } from '#shared/domain/print-calculation';
import type { PrintDraftInput } from '#shared/schemas/prints';
import { printDraftSchema, printListQuerySchema } from '#shared/schemas/prints';
import { canonicalDecimal } from '#shared/utils/decimal';
import { db } from '../utils/db';
import { apiError } from '../utils/http';
import { parseBody } from '../utils/validation';

type Transaction = Prisma.TransactionClient;
const printInclude = {
  customer: true,
  printer: true,
  componentUsages: { orderBy: { createdAt: 'asc' as const } },
  filamentUsages: { orderBy: { createdAt: 'asc' as const } },
  snapshot: true,
};
type PrintWithSnapshot = Prisma.PrintJobGetPayload<{ include: typeof printInclude }>;

function printDto(value: PrintWithSnapshot) {
  return {
    id: value.id,
    name: value.name,
    customer: value.customer ? { id: value.customer.id, name: value.customer.name } : null,
    customerId: value.customerId,
    printer: { id: value.printer.id, name: value.printer.name },
    printerId: value.printerId,
    status: value.status,
    notes: value.notes,
    totalDurationSeconds: value.totalDurationSeconds,
    formulaVersion: value.formulaVersion,
    currency: value.currency,
    totalCost: canonicalDecimal(value.totalCost.toString()),
    completedAt: value.completedAt?.toISOString() ?? null,
    archivedAt: value.archivedAt?.toISOString() ?? null,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
    componentUsages: value.componentUsages.map((entry) => ({
      id: entry.id,
      componentId: entry.componentId,
      type: entry.componentType,
      name: entry.componentName,
      purchasePrice: canonicalDecimal(entry.purchasePrice.toString()),
      expectedLifetimeHours: canonicalDecimal(entry.expectedLifetimeHours.toString()),
      hourlyRate: canonicalDecimal(entry.hourlyRate.toString()),
      appliedDurationSeconds: entry.appliedDurationSeconds,
      lineCost: canonicalDecimal(entry.lineCost.toString()),
    })),
    filamentUsages: value.filamentUsages.map((entry) => ({
      id: entry.id,
      filamentId: entry.filamentId,
      name: entry.filamentName,
      manufacturer: entry.manufacturer,
      material: entry.material,
      purchasePrice: canonicalDecimal(entry.purchasePrice.toString()),
      netWeightGrams: canonicalDecimal(entry.netWeightGrams.toString()),
      costPerGram: canonicalDecimal(entry.costPerGram.toString()),
      usedGrams: canonicalDecimal(entry.usedGrams.toString()),
      lineCost: canonicalDecimal(entry.lineCost.toString()),
    })),
    snapshot: value.snapshot && {
      electricityPricePerKwh: canonicalDecimal(value.snapshot.electricityPricePerKwh.toString()),
      printerName: value.snapshot.printerName,
      printerPurchasePrice: canonicalDecimal(value.snapshot.printerPurchasePrice.toString()),
      printerExpectedLifetimeHours: canonicalDecimal(value.snapshot.printerExpectedLifetimeHours.toString()),
      printerHourlyRate: canonicalDecimal(value.snapshot.printerHourlyRate.toString()),
      printerPowerWatts: value.snapshot.printerPowerWatts,
      printerCost: canonicalDecimal(value.snapshot.printerCost.toString()),
      componentCost: canonicalDecimal(value.snapshot.componentCost.toString()),
      filamentCost: canonicalDecimal(value.snapshot.filamentCost.toString()),
      electricityCost: canonicalDecimal(value.snapshot.electricityCost.toString()),
      totalCost: canonicalDecimal(value.snapshot.totalCost.toString()),
      currency: value.snapshot.currency,
      formulaVersion: value.snapshot.formulaVersion,
      calculatedAt: value.snapshot.calculatedAt.toISOString(),
    },
  };
}

async function resolveCalculation(transaction: Transaction, input: PrintDraftInput) {
  const componentIds = [
    input.buildPlateId,
    ...input.hotends.map((entry) => entry.componentId),
    ...input.otherComponentIds,
  ];
  const filamentIds = input.filaments.map((entry) => entry.filamentId);
  if (new Set(componentIds).size !== componentIds.length)
    apiError(422, 'DUPLICATE_COMPONENT', 'errors.duplicateComponent');
  if (new Set(filamentIds).size !== filamentIds.length)
    apiError(422, 'DUPLICATE_FILAMENT', 'errors.duplicateFilament');

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
      return {
        id: source.id,
        name: source.name,
        purchasePrice: source.purchasePrice.toString(),
        netWeightGrams: source.netWeightGrams.toString(),
        usedGrams: entry.usedGrams,
      };
    }),
    electricityPricePerKwh: settings.electricityPricePerKwh.toString(),
    currency: settings.currency,
  });
  return { settings, printer, componentMap, filamentMap, result };
}

function persistenceData(input: PrintDraftInput, resolved: Awaited<ReturnType<typeof resolveCalculation>>) {
  const { settings, printer, componentMap, filamentMap, result } = resolved;
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
      const line = lineMap.get(entry.filamentId)!;
      return {
        filamentId: source.id,
        filamentName: source.name,
        manufacturer: source.manufacturer.name,
        material: source.material,
        purchasePrice: source.purchasePrice,
        netWeightGrams: source.netWeightGrams,
        costPerGram: line.unitRate,
        usedGrams: entry.usedGrams,
        lineCost: line.cost,
      };
    }),
    snapshot: {
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
  return db.$transaction(async (transaction) => (await resolveCalculation(transaction, parsed)).result);
}

export async function createPrint(input: unknown) {
  const parsed = parseBody(printDraftSchema, input);
  return db.$transaction(async (transaction) => {
    const data = persistenceData(parsed, await resolveCalculation(transaction, parsed));
    return printDto(
      await transaction.printJob.create({
        data: {
          ...data.job,
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
    customerId: value.customerId,
    printerId: value.printerId,
    buildPlateId: buildPlate.componentId,
    hotends: value.componentUsages
      .filter((entry) => entry.componentType === 'HOTEND')
      .map((entry) => ({ componentId: entry.componentId, durationSeconds: entry.appliedDurationSeconds })),
    otherComponentIds: value.componentUsages
      .filter((entry) => entry.componentType === 'OTHER')
      .map((entry) => entry.componentId),
    filaments: value.filamentUsages.map((entry) => ({
      filamentId: entry.filamentId,
      usedGrams: entry.usedGrams.toString(),
    })),
    notes: value.notes,
  };
}

export async function completePrint(id: string) {
  return db.$transaction(async (transaction) => {
    const existing = await transaction.printJob.findUniqueOrThrow({ where: { id }, include: printInclude });
    if (existing.status !== 'DRAFT') apiError(409, 'PRINT_IMMUTABLE', 'errors.printImmutable');
    const input = intentFromPrint(existing);
    const data = persistenceData(input, await resolveCalculation(transaction, input));
    return printDto(
      await transaction.printJob.update({
        where: { id },
        data: {
          ...data.job,
          status: 'COMPLETED',
          completedAt: new Date(),
          componentUsages: { deleteMany: {}, create: data.components },
          filamentUsages: { deleteMany: {}, create: data.filaments },
          snapshot: { update: data.snapshot },
        },
        include: printInclude,
      }),
    );
  });
}

export async function duplicatePrint(id: string) {
  const existing = await db.printJob.findUniqueOrThrow({ where: { id }, include: printInclude });
  const input = intentFromPrint(existing);
  return createPrint({ ...input, name: `${input.name} (copy)` });
}

export async function archivePrint(id: string, archived: boolean) {
  return printDto(
    await db.printJob.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
      include: printInclude,
    }),
  );
}

export async function getPrint(id: string) {
  return printDto(await db.printJob.findUniqueOrThrow({ where: { id }, include: printInclude }));
}

export async function listPrints(query: Record<string, unknown>) {
  const input = parseBody(printListQuerySchema, query);
  const where = {
    ...(input.includeArchived ? {} : { archivedAt: null }),
    ...(input.status ? { status: input.status } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
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
  const [items, total] = await db.$transaction([
    db.printJob.findMany({
      where,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      orderBy: { updatedAt: 'desc' },
      include: printInclude,
    }),
    db.printJob.count({ where }),
  ]);
  return { items: items.map(printDto), total, page: input.page, pageSize: input.pageSize };
}

export async function assertUnreferenced(
  resource: 'customers' | 'printers' | 'manufacturers' | 'components' | 'filaments',
  id: string,
) {
  let count: number;
  if (resource === 'customers') count = await db.printJob.count({ where: { customerId: id } });
  else if (resource === 'printers') count = await db.printJob.count({ where: { printerId: id } });
  else if (resource === 'manufacturers')
    count =
      (await db.component.count({ where: { manufacturerId: id } })) +
      (await db.filament.count({ where: { manufacturerId: id } }));
  else if (resource === 'components')
    count = await db.printComponentUsage.count({ where: { componentId: id } });
  else count = await db.printFilamentUsage.count({ where: { filamentId: id } });
  if (count) apiError(409, 'RESOURCE_REFERENCED', 'errors.resourceReferenced');
}
