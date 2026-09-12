import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { databasePathFromUrl, ensureDatabaseFile } from './database-path.ts';

if (existsSync('.env')) loadEnvFile();

ensureDatabaseFile(databasePathFromUrl());
