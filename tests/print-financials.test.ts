import { expect, it } from 'vitest';
import { calculatePrintFinancials } from '../shared/domain/print-financials';

it('distinguishes planned, realized, zero, missing, and failed sales values', () => {
  expect(calculatePrintFinancials(null, '2', 1).plannedMargin).toBeNull();
  expect(calculatePrintFinancials('0', '2', 1).plannedMargin).toBe('-2');
  const planned = calculatePrintFinancials('3', '2', 3);
  expect(planned.plannedMargin).toBe('1');
  expect(planned.plannedMarginPerUnit).toBe('0.33333333333333333333');
  expect(planned.realizedRevenue).toBeNull();
  expect(
    calculatePrintFinancials('3', '2', 1, { status: 'SUCCESS', costs: { totalCost: '4' } }).realizedMargin,
  ).toBe('-1');
  expect(
    calculatePrintFinancials('3', '2', 1, { status: 'FAILED', costs: { totalCost: '4' } }).realizedRevenue,
  ).toBe('0');
  expect(
    calculatePrintFinancials(null, '2', 1, { status: 'SUCCESS', costs: { totalCost: '4' } }).realizedRevenue,
  ).toBeNull();
  expect(() => calculatePrintFinancials('-1', '2', 1)).toThrow();
});
