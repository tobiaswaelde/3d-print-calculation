import Decimal from 'decimal.js';
import { dashboardPeriodSchema } from '#shared/schemas/prints';
import { canonicalDecimal } from '#shared/utils/decimal';
import { db } from '../utils/db';
import { parseBody } from '../utils/validation';

function startFor(period: '30d' | '90d' | 'all', now: Date) {
  if (period === 'all') return undefined;
  const days = period === '30d' ? 30 : 90;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
}

function bucket(date: Date, period: '30d' | '90d' | 'all') {
  if (period === 'all') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return date.toISOString().slice(0, 10);
}

export async function dashboardData(periodInput: unknown, now = new Date()) {
  const period = parseBody(dashboardPeriodSchema, periodInput);
  const start = startFor(period, now);
  const [completed, unfinished] = await Promise.all([
    db.printJob.findMany({
      where: {
        status: 'DONE',
        archivedAt: null,
        ...(start ? { completedAt: { gte: start, lte: now } } : {}),
      },
      include: { snapshot: true },
      orderBy: { completedAt: 'asc' },
    }),
    db.printJob.findMany({
      where: { status: { not: 'DONE' }, archivedAt: null },
      include: { customer: true, printer: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  let duration = 0;
  let total = new Decimal(0);
  const categories = {
    printer: new Decimal(0),
    component: new Decimal(0),
    filament: new Decimal(0),
    electricity: new Decimal(0),
  };
  const series = new Map<string, Decimal>();
  for (const job of completed) {
    if (!job.snapshot || !job.completedAt) continue;
    duration += job.totalDurationSeconds;
    total = total.plus(job.snapshot.totalCost.toString());
    categories.printer = categories.printer.plus(job.snapshot.printerCost.toString());
    categories.component = categories.component.plus(job.snapshot.componentCost.toString());
    categories.filament = categories.filament.plus(job.snapshot.filamentCost.toString());
    categories.electricity = categories.electricity.plus(job.snapshot.electricityCost.toString());
    const key = bucket(job.completedAt, period);
    series.set(key, (series.get(key) ?? new Decimal(0)).plus(job.snapshot.totalCost.toString()));
  }

  return {
    period,
    periodStart: start?.toISOString() ?? null,
    periodEnd: now.toISOString(),
    currency:
      completed[0]?.currency ??
      unfinished[0]?.currency ??
      (await db.appSettings.findUniqueOrThrow({ where: { id: 1 } })).currency,
    kpis: {
      activeDrafts: unfinished.filter((job) => job.status === 'DRAFT').length,
      completedPrints: completed.length,
      totalDurationSeconds: duration,
      totalCost: canonicalDecimal(total),
    },
    completedCostSeries: [...series.entries()].map(([date, value]) => ({
      date,
      value: canonicalDecimal(value),
    })),
    categoryTotals: Object.entries(categories).map(([category, value]) => ({
      category,
      value: canonicalDecimal(value),
    })),
    unfinishedPrints: unfinished.map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      customer: job.customer ? { id: job.customer.id, name: job.customer.name } : null,
      printer: { id: job.printer.id, name: job.printer.name },
      totalDurationSeconds: job.totalDurationSeconds,
      totalCost: canonicalDecimal(job.totalCost.toString()),
      currency: job.currency,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    })),
  };
}
