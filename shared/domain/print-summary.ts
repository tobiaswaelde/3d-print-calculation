import Decimal from 'decimal.js';
import type { PrintJobDto } from '../types/prints';

export function emptyPrintSummary() {
  return {
    totalRuns: 0,
    completedPrints: 0,
    drafts: 0,
    inProgress: 0,
    pending: 0,
    successes: 0,
    failures: 0,
    quantity: 0,
    producedQuantity: 0,
    totalDurationSeconds: 0,
    actualDurationSeconds: 0,
    plannedCost: '0',
    draftCost: '0',
    actualCost: '0',
    failedCost: '0',
    revenue: '0',
    margin: '0',
    lastActivity: null as string | null,
  };
}
export type PrintSummary = ReturnType<typeof emptyPrintSummary>;
export function summarizePrints(prints: Iterable<PrintJobDto>, initial = emptyPrintSummary()): PrintSummary {
  const result = { ...initial };
  const add = (
    key: 'plannedCost' | 'draftCost' | 'actualCost' | 'failedCost' | 'revenue' | 'margin',
    value: string,
  ) => {
    result[key] = new Decimal(result[key]).plus(value).toFixed();
  };
  for (const print of prints) {
    result.totalRuns++;
    if (!result.lastActivity || print.updatedAt > result.lastActivity) result.lastActivity = print.updatedAt;
    if (print.status === 'DRAFT') {
      result.drafts++;
      add('draftCost', print.totalCost);
      continue;
    }
    if (print.status !== 'DONE') {
      result.inProgress++;
      continue;
    }
    result.completedPrints++;
    result.quantity += print.quantity;
    result.totalDurationSeconds += print.totalDurationSeconds;
    add('plannedCost', print.totalCost);
    if (!print.outcome) {
      result.pending++;
      continue;
    }
    result.actualDurationSeconds += print.outcome.durationSeconds;
    add('actualCost', print.outcome.costs.totalCost);
    if (print.outcome.status === 'FAILED') {
      result.failures++;
      add('failedCost', print.outcome.costs.totalCost);
      continue;
    }
    result.successes++;
    result.producedQuantity += print.quantity;
    if (print.financials.realizedRevenue !== null) add('revenue', print.financials.realizedRevenue);
    if (print.financials.realizedMargin !== null) add('margin', print.financials.realizedMargin);
  }
  return result;
}
