export type MasterDataResource = 'customers' | 'printers' | 'manufacturers' | 'components' | 'filaments';

export interface MasterDataListItem {
  id: string;
  name: string;
  archivedAt: string | null;
  [key: string]: unknown;
}

export interface CustomerDto extends MasterDataListItem {
  email: string | null;
  excludeFromDashboard: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
