import { existsSync } from 'node:fs';
import { databasePathFromUrl, importBackupFile } from './database-backup.ts';
import { restorePaths } from './restore-state.ts';

const databasePath = databasePathFromUrl();
const paths = restorePaths(databasePath);
if (!existsSync(paths.active) || !existsSync(paths.upload)) {
  throw new Error('No staged ezPrint restore archive is available.');
}

await importBackupFile(paths.upload, databasePath);
process.stdout.write('Logical ezPrint backup imported.\n');
