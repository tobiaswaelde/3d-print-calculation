import { dirname } from 'node:path';

export const RESTORE_STATUS_TTL_MS = 10 * 60 * 1000;

export function restorePaths(databasePath: string) {
  return {
    directory: dirname(databasePath),
    pending: `${databasePath}.restore-pending.json`,
    active: `${databasePath}.restore-active.json`,
    upload: `${databasePath}.restore-upload`,
    rollback: `${databasePath}.restore-rollback`,
    status: (id: string) => `${databasePath}.restore-status-${id}.json`,
  };
}
