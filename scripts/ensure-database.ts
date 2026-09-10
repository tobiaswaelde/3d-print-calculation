import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

if (existsSync('.env')) loadEnvFile();

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
if (!url.startsWith('file:')) throw new Error('This application supports only file: SQLite database URLs.');

const configuredPath = decodeURIComponent(url.slice('file:'.length));
const databasePath = isAbsolute(configuredPath) ? configuredPath : resolve(configuredPath);
mkdirSync(dirname(databasePath), { recursive: true });
closeSync(openSync(databasePath, 'a', 0o600));
