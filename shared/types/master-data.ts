export type MasterDataResource = 'customers' | 'printers' | 'components' | 'filaments';

export interface MasterDataListItem {
  id: string;
  name: string;
  archivedAt: string | null;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
