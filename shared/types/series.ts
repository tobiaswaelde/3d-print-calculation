import type { PrintSummary } from '../domain/print-summary';
export interface PrintSeriesDto {
  id: string;
  name: string;
  customerId: string | null;
  customer: { id: string; name: string } | null;
  targetQuantity: number | null;
  notes: string | null;
  status: 'OPEN' | 'COMPLETED';
  autoComplete: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currency: string;
  summary: PrintSummary;
}
