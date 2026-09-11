export interface SpoolDto {
  spoolmanId: number | null;
  stockAuthority: string;
  remoteState: string | null;
  syncedAt: string | null;
  syncError: string | null;
  stale: boolean;
  id: string;
  code: string;
  filamentId: string;
  filamentName: string;
  purchaseLot: string | null;
  location: string | null;
  acquiredAt: string | null;
  purchasePrice: string;
  initialNetWeightGrams: string;
  costPerGram: string;
  remainingGrams: string | null;
  legacy: boolean;
  archivedAt: string | null;
}
export interface SpoolDetailDto extends SpoolDto {
  movements: Array<{
    id: string;
    kind: string;
    grams: string;
    note: string | null;
    printJobId: string | null;
    createdAt: string;
  }>;
  movementCount: number;
}
