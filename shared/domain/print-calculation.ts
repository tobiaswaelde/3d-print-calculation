import type { PrintFinancials } from './print-financials';
import { printQuantitySchema } from '../schemas/prints';
import Decimal from 'decimal.js';
import { canonicalDecimal } from '../utils/decimal';

export const PRINT_CALCULATION_VERSION = '3';

export interface CostSource {
  id: string;
  name: string;
  purchasePrice: string;
  expectedLifetimeHours: string;
}

export interface PrintCalculationInput {
  quantity?: number;
  printer: CostSource & { averagePowerWatts: number };
  buildPlate: CostSource;
  hotends: Array<CostSource & { durationSeconds: number }>;
  otherComponents: CostSource[];
  filaments: Array<{
    id: string;
    name: string;
    purchasePrice: string;
    netWeightGrams: string;
    usedGrams: string;
  }>;
  electricityPricePerKwh: string;
  currency: string;
}

export interface CostBreakdownLine {
  category: 'printer' | 'component' | 'filament' | 'electricity';
  sourceId: string;
  label: string;
  quantity: string;
  unitRate: string;
  cost: string;
}

export interface PrintCalculationResult {
  financials?: PrintFinancials;
  quantity: number;
  costPerUnit: string;
  calculationVersion: string;
  currency: string;
  totalDurationSeconds: number;
  printerCost: string;
  componentCost: string;
  filamentCost: string;
  electricityCost: string;
  totalCost: string;
  lines: CostBreakdownLine[];
}

function nonNegative(value: string, label: string) {
  const decimal = new Decimal(value);
  if (!decimal.isFinite() || decimal.isNegative()) throw new Error(`${label} must not be negative`);
  return decimal;
}

function positive(value: string, label: string) {
  const decimal = nonNegative(value, label);
  if (decimal.isZero()) throw new Error(`${label} must be greater than zero`);
  return decimal;
}

function durationHours(seconds: number) {
  if (!Number.isSafeInteger(seconds) || seconds <= 0)
    throw new Error('Duration must be a positive whole number of seconds');
  return new Decimal(seconds).div(3600);
}

function hourly(source: CostSource) {
  return nonNegative(source.purchasePrice, `${source.name} purchase price`).div(
    positive(source.expectedLifetimeHours, `${source.name} expected lifetime`),
  );
}

export function calculatePrintCost(input: PrintCalculationInput): PrintCalculationResult {
  const quantity = printQuantitySchema.parse(input.quantity);
  if (!input.printer || !input.buildPlate) throw new Error('A printer and one build plate are required');
  if (!input.hotends.length) throw new Error('At least one hotend is required');
  if (!input.filaments.length) throw new Error('At least one filament is required');
  if (!Number.isSafeInteger(input.printer.averagePowerWatts) || input.printer.averagePowerWatts < 0) {
    throw new Error('Printer power must be a non-negative whole number');
  }

  const totalDuration = input.hotends.reduce(
    (sum, entry) => sum.plus(durationHours(entry.durationSeconds)),
    new Decimal(0),
  );
  const totalDurationSeconds = input.hotends.reduce((sum, entry) => sum + entry.durationSeconds, 0);
  const lines: CostBreakdownLine[] = [];

  const printerRate = hourly(input.printer);
  const printerCost = totalDuration.mul(printerRate);
  lines.push({
    category: 'printer',
    sourceId: input.printer.id,
    label: input.printer.name,
    quantity: canonicalDecimal(totalDuration),
    unitRate: canonicalDecimal(printerRate),
    cost: canonicalDecimal(printerCost),
  });

  let componentCost = new Decimal(0);
  for (const hotend of input.hotends) {
    const quantity = durationHours(hotend.durationSeconds);
    const unitRate = hourly(hotend);
    const cost = quantity.mul(unitRate);
    componentCost = componentCost.plus(cost);
    lines.push({
      category: 'component',
      sourceId: hotend.id,
      label: hotend.name,
      quantity: canonicalDecimal(quantity),
      unitRate: canonicalDecimal(unitRate),
      cost: canonicalDecimal(cost),
    });
  }
  for (const component of [input.buildPlate, ...input.otherComponents]) {
    const unitRate = hourly(component);
    const cost = totalDuration.mul(unitRate);
    componentCost = componentCost.plus(cost);
    lines.push({
      category: 'component',
      sourceId: component.id,
      label: component.name,
      quantity: canonicalDecimal(totalDuration),
      unitRate: canonicalDecimal(unitRate),
      cost: canonicalDecimal(cost),
    });
  }

  let filamentCost = new Decimal(0);
  for (const filament of input.filaments) {
    const weight = positive(filament.usedGrams, `${filament.name} used weight`);
    const rate = nonNegative(filament.purchasePrice, `${filament.name} purchase price`).div(
      positive(filament.netWeightGrams, `${filament.name} net weight`),
    );
    const cost = weight.mul(rate);
    filamentCost = filamentCost.plus(cost);
    lines.push({
      category: 'filament',
      sourceId: filament.id,
      label: filament.name,
      quantity: canonicalDecimal(weight),
      unitRate: canonicalDecimal(rate),
      cost: canonicalDecimal(cost),
    });
  }

  const electricityRate = nonNegative(input.electricityPricePerKwh, 'Electricity price');
  const electricityCost = totalDuration.mul(input.printer.averagePowerWatts).div(1000).mul(electricityRate);
  lines.push({
    category: 'electricity',
    sourceId: 'electricity',
    label: 'Electricity',
    quantity: canonicalDecimal(totalDuration),
    unitRate: canonicalDecimal(electricityRate),
    cost: canonicalDecimal(electricityCost),
  });

  const totalCost = printerCost.plus(componentCost).plus(filamentCost).plus(electricityCost);
  return {
    quantity,
    costPerUnit: canonicalDecimal(totalCost.div(quantity)),
    calculationVersion: PRINT_CALCULATION_VERSION,
    currency: input.currency,
    totalDurationSeconds,
    printerCost: canonicalDecimal(printerCost),
    componentCost: canonicalDecimal(componentCost),
    filamentCost: canonicalDecimal(filamentCost),
    electricityCost: canonicalDecimal(electricityCost),
    totalCost: canonicalDecimal(totalCost),
    lines,
  };
}
