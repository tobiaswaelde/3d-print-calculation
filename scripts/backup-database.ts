import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import Database from 'better-sqlite3';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const requestedTarget = process.argv[2];
if (!databaseUrl.startsWith('file:') || !requestedTarget) {
  throw new Error('Usage: pnpm db:backup <backup-file>; DATABASE_URL must be a file: SQLite URL.');
}

const sourceValue = decodeURIComponent(databaseUrl.slice('file:'.length));
const source = isAbsolute(sourceValue) ? sourceValue : resolve(sourceValue);
const target = isAbsolute(requestedTarget) ? requestedTarget : resolve(requestedTarget);
if (source === target) throw new Error('Backup target must differ from the live database.');

mkdirSync(dirname(target), { recursive: true });
const database = new Database(source, { fileMustExist: true });
try {
  database.pragma('foreign_keys = ON');
  await database.backup(target);
  const check = new Database(target, { readonly: true, fileMustExist: true });
  try {
    const result = check.pragma('integrity_check', { simple: true });
    if (result !== 'ok') throw new Error(`Backup integrity check failed: ${String(result)}`);
  } finally {
    check.close();
  }
} finally {
  database.close();
}

process.stdout.write(`SQLite-safe backup created at ${target}\n`);
