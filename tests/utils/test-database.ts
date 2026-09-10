import { resolve } from 'node:path';

export function assertSafeTestDatabaseUrl(url: string, testRoot: string) {
  if (!url.startsWith('file:')) throw new Error('Tests require an isolated file: SQLite URL.');
  const databasePath = resolve(decodeURIComponent(url.slice('file:'.length)));
  const root = resolve(testRoot);
  if (!databasePath.startsWith(`${root}/`)) {
    throw new Error('Refusing to use a database outside the isolated test directory.');
  }
  if (databasePath.includes('/data/app.db')) throw new Error('Refusing to use the production database path.');
  return databasePath;
}
