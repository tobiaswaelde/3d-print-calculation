import { closeSync, fstatSync, openSync, readFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

import type { RestoreStatus } from '../shared/schemas/backups';

export const RESTORE_STATUS_TTL_MS = 10 * 60 * 1000;

export function restorePaths(databasePath: string) {
  return {
    directory: dirname(databasePath),
    staging: `${databasePath}.restore-staging`,
    pending: `${databasePath}.restore-pending.json`,
    active: `${databasePath}.restore-active.json`,
    upload: `${databasePath}.restore-upload`,
    rollback: `${databasePath}.restore-rollback`,
    status: (id: string) => `${databasePath}.restore-status-${id}.json`,
  };
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export function acquireRestoreStaging(path: string) {
  try {
    return openSync(path, 'wx', 0o600);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'EEXIST') return null;
    throw error;
  }
}

export function releaseRestoreStaging(path: string, descriptor: number) {
  closeSync(descriptor);
  rmSync(path, { force: true });
}

export function readRestoreStatusFile(path: string, now = Date.now()): { status: RestoreStatus } | null {
  let descriptor: number;
  try {
    descriptor = openSync(path, 'r');
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') return null;
    throw error;
  }

  try {
    if (now - fstatSync(descriptor).mtimeMs <= RESTORE_STATUS_TTL_MS) {
      return JSON.parse(readFileSync(descriptor, 'utf8')) as { status: RestoreStatus };
    }
  } finally {
    closeSync(descriptor);
  }

  rmSync(path, { force: true });
  return null;
}
