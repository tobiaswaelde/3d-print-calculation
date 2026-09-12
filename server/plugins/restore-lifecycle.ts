import { closeSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { databasePathFromUrl } from '../../scripts/database-backup';
import { acquireRestoreStaging, RESTORE_STATUS_TTL_MS, restorePaths } from '../../scripts/restore-state';
import { db } from '../utils/db';

export default defineNitroPlugin(async () => {
  const databasePath = databasePathFromUrl();
  const paths = restorePaths(databasePath);
  const scheduleStatusCleanup = () => {
    const prefix = `${basename(databasePath)}.restore-status-`;
    for (const name of readdirSync(paths.directory).filter((value) => value.startsWith(prefix))) {
      const path = `${paths.directory}/${name}`;
      const remaining = Math.max(0, RESTORE_STATUS_TTL_MS - (Date.now() - statSync(path).mtimeMs));
      setTimeout(() => rmSync(path, { force: true }), remaining).unref();
    }
  };
  if (!existsSync(paths.active)) {
    if (existsSync(paths.pending)) {
      const descriptor = acquireRestoreStaging(paths.staging);
      if (descriptor !== null) closeSync(descriptor);
    } else {
      rmSync(paths.upload, { force: true });
      rmSync(paths.staging, { force: true });
    }
    scheduleStatusCleanup();
    return;
  }
  const marker = JSON.parse(readFileSync(paths.active, 'utf8')) as { id: string };
  await db.session.deleteMany();
  writeFileSync(paths.status(marker.id), JSON.stringify({ status: 'succeeded' }), { mode: 0o600 });
  rmSync(paths.upload, { force: true });
  rmSync(paths.rollback, { force: true });
  rmSync(paths.active, { force: true });
  rmSync(paths.staging, { force: true });
  scheduleStatusCleanup();
});
