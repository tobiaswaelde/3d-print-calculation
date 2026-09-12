import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import packageJson from '../package.json' with { type: 'json' };
import { createBackupFile, databasePathFromUrl } from './database-backup.ts';

const requestedTarget = process.argv[2];
if (!requestedTarget) throw new Error('Usage: pnpm db:backup <backup-file>');

await createBackupFile(databasePathFromUrl(), requestedTarget, packageJson.version);
process.stdout.write(`Portable ezPrint backup created at ${requestedTarget}\n`);
if (existsSync('.env')) loadEnvFile();
