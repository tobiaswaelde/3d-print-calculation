import Decimal from 'decimal.js';
import { salesValueSchema, printQuantitySchema } from '../schemas/prints';
import { canonicalDecimal } from '../utils/decimal';

export function calculatePrintFinancials(
  salesInput: string | null,
  plannedCost: string,
  quantityInput: number,
  outcome?: { status: string; costs: { totalCost: string } } | null,
) {
  const salesValue = salesValueSchema.parse(salesInput);
  const quantity = printQuantitySchema.parse(quantityInput);
  const plannedMargin =
    salesValue === null ? null : canonicalDecimal(new Decimal(salesValue).minus(plannedCost));
  const realizedRevenue =
    salesValue === null || !outcome ? null : outcome.status === 'SUCCESS' ? salesValue : '0';
  const realizedMargin =
    salesValue !== null && outcome?.status === 'SUCCESS'
      ? canonicalDecimal(new Decimal(salesValue).minus(outcome.costs.totalCost))
      : null;
  const perUnit = (value: string | null) =>
    value === null ? null : canonicalDecimal(new Decimal(value).div(quantity));
  return {
    salesValue,
    plannedMargin,
    realizedRevenue,
    realizedMargin,
    salesPerUnit: perUnit(salesValue),
    plannedMarginPerUnit: perUnit(plannedMargin),
    realizedMarginPerUnit: perUnit(realizedMargin),
  };
}
export type PrintFinancials = ReturnType<typeof calculatePrintFinancials>;
