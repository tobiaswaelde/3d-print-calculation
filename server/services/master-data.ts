import Decimal from 'decimal.js';
import type { Prisma } from '../../prisma/generated/client/client';
import {
  archiveSchema,
  componentSchema,
  customerSchema,
  filamentSchema,
  listQuerySchema,
  printerSchema,
  settingsSchema,
} from '#shared/schemas/master-data';
import { canonicalDecimal } from '#shared/utils/decimal';
import { db } from '../utils/db';
import { apiError } from '../utils/http';
import { parseBody } from '../utils/validation';
import { assertUnreferenced } from './prints';

type Resource = 'customers' | 'printers' | 'components' | 'filaments';

function baseDto(value: {
  id: string;
  name: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: value.id,
    name: value.name,
    archivedAt: value.archivedAt?.toISOString() ?? null,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
}

function customerDto(value: Awaited<ReturnType<typeof db.customer.findFirstOrThrow>>) {
  return { ...baseDto(value), email: value.email, note: value.note };
}

function printerDto(value: Awaited<ReturnType<typeof db.printer.findFirstOrThrow>>) {
  return {
    ...baseDto(value),
    manufacturer: value.manufacturer,
    model: value.model,
    purchasePrice: canonicalDecimal(value.purchasePrice.toString()),
    expectedLifetimeHours: canonicalDecimal(value.expectedLifetimeHours.toString()),
    averagePowerWatts: value.averagePowerWatts,
    hourlyRate: canonicalDecimal(
      new Decimal(value.purchasePrice.toString()).div(value.expectedLifetimeHours.toString()),
    ),
    note: value.note,
  };
}

type ComponentWithPrinters = Prisma.ComponentGetPayload<{ include: { printers: true } }>;
function componentDto(value: ComponentWithPrinters) {
  return {
    ...baseDto(value),
    type: value.type,
    manufacturer: value.manufacturer,
    model: value.model,
    purchasePrice: canonicalDecimal(value.purchasePrice.toString()),
    expectedLifetimeHours: canonicalDecimal(value.expectedLifetimeHours.toString()),
    hourlyRate: canonicalDecimal(
      new Decimal(value.purchasePrice.toString()).div(value.expectedLifetimeHours.toString()),
    ),
    printerIds: value.printers.map((entry) => entry.printerId),
    note: value.note,
  };
}

function filamentDto(value: Awaited<ReturnType<typeof db.filament.findFirstOrThrow>>) {
  return {
    ...baseDto(value),
    manufacturer: value.manufacturer,
    material: value.material,
    color: value.color,
    purchasePrice: canonicalDecimal(value.purchasePrice.toString()),
    netWeightGrams: canonicalDecimal(value.netWeightGrams.toString()),
    costPerGram: canonicalDecimal(
      new Decimal(value.purchasePrice.toString()).div(value.netWeightGrams.toString()),
    ),
    note: value.note,
  };
}

function listInput(query: Record<string, unknown>) {
  return parseBody(listQuerySchema, query);
}

export async function listResource(resource: Resource, query: Record<string, unknown>) {
  const input = listInput(query);
  const pagination = { skip: (input.page - 1) * input.pageSize, take: input.pageSize };
  const archived = input.includeArchived ? {} : { archivedAt: null };

  if (resource === 'customers') {
    const where = {
      ...archived,
      ...(input.search
        ? { OR: [{ name: { contains: input.search } }, { email: { contains: input.search } }] }
        : {}),
    };
    const [items, total] = await db.$transaction([
      db.customer.findMany({ where, ...pagination, orderBy: { name: 'asc' } }),
      db.customer.count({ where }),
    ]);
    return { items: items.map(customerDto), total, page: input.page, pageSize: input.pageSize };
  }
  if (resource === 'printers') {
    const where = {
      ...archived,
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search } },
              { manufacturer: { contains: input.search } },
              { model: { contains: input.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await db.$transaction([
      db.printer.findMany({ where, ...pagination, orderBy: { name: 'asc' } }),
      db.printer.count({ where }),
    ]);
    return { items: items.map(printerDto), total, page: input.page, pageSize: input.pageSize };
  }
  if (resource === 'components') {
    const where = {
      ...archived,
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search } },
              { manufacturer: { contains: input.search } },
              { model: { contains: input.search } },
              { type: { contains: input.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await db.$transaction([
      db.component.findMany({
        where,
        ...pagination,
        include: { printers: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
      db.component.count({ where }),
    ]);
    return { items: items.map(componentDto), total, page: input.page, pageSize: input.pageSize };
  }
  const where = {
    ...archived,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search } },
            { manufacturer: { contains: input.search } },
            { material: { contains: input.search } },
          ],
        }
      : {}),
  };
  const [items, total] = await db.$transaction([
    db.filament.findMany({ where, ...pagination, orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }] }),
    db.filament.count({ where }),
  ]);
  return { items: items.map(filamentDto), total, page: input.page, pageSize: input.pageSize };
}

export async function getResource(resource: Resource, id: string) {
  if (resource === 'customers') return customerDto(await db.customer.findUniqueOrThrow({ where: { id } }));
  if (resource === 'printers') return printerDto(await db.printer.findUniqueOrThrow({ where: { id } }));
  if (resource === 'components')
    return componentDto(await db.component.findUniqueOrThrow({ where: { id }, include: { printers: true } }));
  return filamentDto(await db.filament.findUniqueOrThrow({ where: { id } }));
}

async function ensureActivePrinters(printerIds: string[]) {
  const uniqueIds = [...new Set(printerIds)];
  const count = await db.printer.count({ where: { id: { in: uniqueIds }, archivedAt: null } });
  if (count !== uniqueIds.length) apiError(422, 'INVALID_COMPATIBILITY', 'errors.invalidCompatibility');
  return uniqueIds;
}

export async function createResource(resource: Resource, input: unknown) {
  if (resource === 'customers')
    return customerDto(await db.customer.create({ data: parseBody(customerSchema, input) }));
  if (resource === 'printers')
    return printerDto(await db.printer.create({ data: parseBody(printerSchema, input) }));
  if (resource === 'components') {
    const data = parseBody(componentSchema, input);
    const printerIds = await ensureActivePrinters(data.printerIds);
    return componentDto(
      await db.component.create({
        data: {
          ...data,
          printerIds: undefined,
          printers: { create: printerIds.map((printerId) => ({ printerId })) },
        },
        include: { printers: true },
      }),
    );
  }
  return filamentDto(await db.filament.create({ data: parseBody(filamentSchema, input) }));
}

export async function updateResource(resource: Resource, id: string, input: unknown) {
  if (resource === 'customers')
    return customerDto(await db.customer.update({ where: { id }, data: parseBody(customerSchema, input) }));
  if (resource === 'printers')
    return printerDto(await db.printer.update({ where: { id }, data: parseBody(printerSchema, input) }));
  if (resource === 'components') {
    const data = parseBody(componentSchema, input);
    const printerIds = await ensureActivePrinters(data.printerIds);
    return componentDto(
      await db.component.update({
        where: { id },
        data: {
          ...data,
          printerIds: undefined,
          printers: { deleteMany: {}, create: printerIds.map((printerId) => ({ printerId })) },
        },
        include: { printers: true },
      }),
    );
  }
  return filamentDto(await db.filament.update({ where: { id }, data: parseBody(filamentSchema, input) }));
}

export async function archiveResource(resource: Resource, id: string, input: unknown) {
  const { archived } = parseBody(archiveSchema, input);
  const data = { archivedAt: archived ? new Date() : null };
  if (resource === 'customers') return customerDto(await db.customer.update({ where: { id }, data }));
  if (resource === 'printers') return printerDto(await db.printer.update({ where: { id }, data }));
  if (resource === 'components')
    return componentDto(await db.component.update({ where: { id }, data, include: { printers: true } }));
  return filamentDto(await db.filament.update({ where: { id }, data }));
}

export async function deleteResource(resource: Resource, id: string) {
  await assertUnreferenced(resource, id);
  if (resource === 'customers') await db.customer.delete({ where: { id } });
  else if (resource === 'printers') await db.printer.delete({ where: { id } });
  else if (resource === 'components') await db.component.delete({ where: { id } });
  else await db.filament.delete({ where: { id } });
  return { success: true };
}

export async function readSettings() {
  const value = await db.appSettings.findUniqueOrThrow({ where: { id: 1 } });
  return {
    currency: value.currency,
    defaultLocale: value.defaultLocale,
    electricityPricePerKwh: canonicalDecimal(value.electricityPricePerKwh.toString()),
    calculationVersion: value.calculationVersion,
  };
}

export async function updateSettings(input: unknown) {
  const data = parseBody(settingsSchema, input);
  const value = await db.$transaction(async (transaction) => {
    const current = await transaction.appSettings.findUniqueOrThrow({ where: { id: 1 } });
    if (current.currency !== data.currency) {
      const count =
        (await transaction.printer.count()) +
        (await transaction.component.count()) +
        (await transaction.filament.count()) +
        (await transaction.printJob.count());
      if (count > 0) apiError(409, 'CURRENCY_LOCKED', 'errors.currencyLocked');
    }
    return transaction.appSettings.update({ where: { id: 1 }, data });
  });
  return {
    currency: value.currency,
    defaultLocale: value.defaultLocale,
    electricityPricePerKwh: canonicalDecimal(value.electricityPricePerKwh.toString()),
    calculationVersion: value.calculationVersion,
  };
}
