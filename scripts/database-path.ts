import { closeSync, mkdirSync, openSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

export function databasePathFromUrl(url = process.env.DATABASE_URL ?? 'file:./dev.db') {
  if (!url.startsWith('file:')) throw new Error('This application supports only file: SQLite database URLs.');
  const configuredPath = decodeURIComponent(url.slice('file:'.length));
  return isAbsolute(configuredPath) ? configuredPath : resolve(configuredPath);
}

export function ensureDatabaseFile(databasePath = databasePathFromUrl()) {
  mkdirSync(dirname(databasePath), { recursive: true });
  closeSync(openSync(databasePath, 'a', 0o600));
}
