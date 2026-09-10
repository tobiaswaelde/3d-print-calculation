import type { PrintCalculationResult } from '../domain/print-calculation';

export interface PrintJobDto {
  id: string;
  name: string;
  customer: { id: string; name: string } | null;
  customerId: string | null;
  printer: { id: string; name: string };
  printerId: string;
  status: 'DRAFT' | 'COMPLETED';
  notes: string | null;
  totalDurationSeconds: number;
  formulaVersion: string;
  currency: string;
  totalCost: string;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  componentUsages: Array<{
    id: string;
    componentId: string;
    type: 'HOTEND' | 'BUILD_PLATE' | 'OTHER';
    name: string;
    purchasePrice: string;
    expectedLifetimeHours: string;
    hourlyRate: string;
    appliedDurationSeconds: number;
    lineCost: string;
  }>;
  filamentUsages: Array<{
    id: string;
    filamentId: string;
    name: string;
    usedGrams: string;
    lineCost: string;
  }>;
  snapshot:
    | (Omit<PrintCalculationResult, 'lines' | 'totalDurationSeconds' | 'calculationVersion'> & {
        printerName: string;
        printerPurchasePrice: string;
        printerExpectedLifetimeHours: string;
        printerHourlyRate: string;
        printerPowerWatts: number;
        formulaVersion: string;
        electricityPricePerKwh: string;
        calculatedAt: string;
      })
    | null;
}

export interface DashboardDto {
  period: '30d' | '90d' | 'all';
  periodStart: string | null;
  periodEnd: string;
  currency: string;
  kpis: { activeDrafts: number; completedPrints: number; totalDurationSeconds: number; totalCost: string };
  completedCostSeries: Array<{ date: string; value: string }>;
  categoryTotals: Array<{ category: string; value: string }>;
  unfinishedPrints: Array<{
    id: string;
    name: string;
    customer: { id: string; name: string } | null;
    printer: { id: string; name: string };
    totalDurationSeconds: number;
    totalCost: string;
    currency: string;
    updatedAt: string;
  }>;
}
