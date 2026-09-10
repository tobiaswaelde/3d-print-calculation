import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../prisma/generated/client/client';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
if (databaseUrl.startsWith('file:')) {
  const path = fileURLToPath(new URL(databaseUrl.slice(5), `file://${process.cwd()}/`));
  mkdirSync(dirname(path), { recursive: true });
}

const globalDatabase = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalDatabase.prisma ?? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

if (process.env.NODE_ENV !== 'production') globalDatabase.prisma = db;
