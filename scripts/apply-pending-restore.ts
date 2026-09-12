import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { databasePathFromUrl } from './database-path.ts';
import { restorePaths } from './restore-state.ts';

type RestoreMarker = { id: string; createdAt: string; phase?: 'prepared' | 'rolling_back' };

const databasePath = databasePathFromUrl();
const paths = restorePaths(databasePath);
const command = process.argv[2];

function statusPath(id: string) {
  return paths.status(id);
}

function writeMarker(path: string, marker: RestoreMarker) {
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(marker), { mode: 0o600 });
  renameSync(temporaryPath, path);
}

function createRollback() {
  if (existsSync(paths.rollback)) return;
  const temporaryPath = `${paths.rollback}.tmp`;
  rmSync(temporaryPath, { force: true });
  copyFileSync(databasePath, temporaryPath);
  const descriptor = openSync(temporaryPath, 'r');
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  renameSync(temporaryPath, paths.rollback);
}

function completeRollback(marker: RestoreMarker) {
  if (existsSync(paths.rollback)) renameSync(paths.rollback, databasePath);
  rmSync(`${databasePath}-wal`, { force: true });
  rmSync(`${databasePath}-shm`, { force: true });
  writeFileSync(statusPath(marker.id), JSON.stringify({ status: 'rolled_back' }), { mode: 0o600 });
  rmSync(paths.active, { force: true });
  rmSync(paths.upload, { force: true });
  rmSync(paths.staging, { force: true });
}

if (command === 'prepare') {
  if (existsSync(paths.pending) && !existsSync(paths.active)) renameSync(paths.pending, paths.active);
  if (!existsSync(paths.active)) {
    process.stdout.write('none');
    process.exit(0);
  }
  const marker = JSON.parse(readFileSync(paths.active, 'utf8')) as RestoreMarker;
  if (marker.phase === 'rolling_back') {
    completeRollback(marker);
    process.stdout.write('none');
    process.exit(0);
  }
  if (!existsSync(paths.upload)) throw new Error('The pending restore archive is missing.');
  createRollback();
  rmSync(databasePath, { force: true });
  rmSync(`${databasePath}-wal`, { force: true });
  rmSync(`${databasePath}-shm`, { force: true });
  writeMarker(paths.active, { ...marker, phase: 'prepared' });
  writeFileSync(statusPath(marker.id), JSON.stringify({ status: 'pending' }), { mode: 0o600 });
  process.stdout.write('prepared');
} else if (command === 'rollback') {
  if (!existsSync(paths.active)) process.exit(0);
  const marker = JSON.parse(readFileSync(paths.active, 'utf8')) as RestoreMarker;
  writeMarker(paths.active, { ...marker, phase: 'rolling_back' });
  completeRollback(marker);
} else {
  throw new Error('Usage: node scripts/apply-pending-restore.ts <prepare|rollback>');
}
