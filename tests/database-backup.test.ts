import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT_VERSION,
  backupDownloadName,
  createBackupFile,
  databasePathFromUrl,
  importBackupFile,
  inspectBackupFile,
} from '../scripts/database-backup';

const roots: string[] = [];

function createDatabase(path: string, value: string) {
  const database = new Database(path);
  database.exec(`
    CREATE TABLE User (id TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE Session (id TEXT PRIMARY KEY);
    CREATE TABLE AppSettings (id INTEGER PRIMARY KEY);
    CREATE TABLE _prisma_migrations (migration_name TEXT, started_at TEXT, finished_at TEXT);
    INSERT INTO User VALUES ('user', '${value}');
    INSERT INTO _prisma_migrations VALUES ('20260910140000_application_foundation', '2026-09-10', '2026-09-10');
  `);
  database.close();
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('database backups', () => {
  it('creates a versioned, intact logical archive without changing the source', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ezprint-backup-test-'));
    roots.push(root);
    const source = join(root, 'app.db');
    const target = join(root, 'backup.ezprint-backup');
    createDatabase(source, 'preserved');

    const metadata = await createBackupFile(source, target, '0.6.0');

    expect(metadata.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    await expect(inspectBackupFile(target)).resolves.toMatchObject({
      appVersion: '0.6.0',
      formatVersion: BACKUP_FORMAT_VERSION,
    });
    expect(readFileSync(target).subarray(0, 4).toString('binary')).toBe('PK\x03\x04');
    expect(statSync(target).mode & 0o777).toBe(0o600);
    expect(metadata.tables.map((table) => table.name)).toEqual(['User', 'AppSettings']);
  });

  it('rejects unversioned SQLite and unrelated files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ezprint-backup-test-'));
    roots.push(root);
    const databasePath = join(root, 'plain.db');
    createDatabase(databasePath, 'plain');
    await expect(inspectBackupFile(databasePath)).rejects.toThrow('not an ezPrint backup archive');
    const textPath = join(root, 'text.ezprint-backup');
    writeFileSync(textPath, 'not sqlite');
    await expect(inspectBackupFile(textPath)).rejects.toThrow('not an ezPrint backup archive');
  });

  it('rejects a corrupted logical backup', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ezprint-backup-test-'));
    roots.push(root);
    const source = join(root, 'app.db');
    const target = join(root, 'corrupt.ezprint-backup');
    createDatabase(source, 'preserved');
    await createBackupFile(source, target, '0.6.0');
    const contents = readFileSync(target);
    contents.fill(0xff, 100, Math.min(contents.length, 512));
    writeFileSync(target, contents);

    await expect(inspectBackupFile(target)).rejects.toThrow();
  });

  it('resolves only file-based SQLite database URLs', () => {
    expect(databasePathFromUrl('file:./data/test.db')).toBe(join(process.cwd(), 'data/test.db'));
    expect(() => databasePathFromUrl('postgresql://database.example.test/ezprint')).toThrow(
      'only file: SQLite database URLs',
    );
  });

  it('imports logical data into a freshly migrated database and can roll back atomically', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ezprint-restore-test-'));
    roots.push(root);
    const databasePath = join(root, 'app.db');
    createDatabase(databasePath, 'current');
    const replacementDatabase = join(root, 'replacement.db');
    createDatabase(replacementDatabase, 'replacement');
    const replacement = new Database(replacementDatabase);
    replacement.exec("ALTER TABLE User ADD COLUMN legacyOnly TEXT; UPDATE User SET legacyOnly = 'ignored'");
    replacement.close();
    await createBackupFile(replacementDatabase, `${databasePath}.restore-upload`, '0.6.0');
    const id = '11111111-1111-4111-8111-111111111111';
    writeFileSync(
      `${databasePath}.restore-pending.json`,
      JSON.stringify({ id, createdAt: new Date().toISOString() }),
    );
    const environment = { ...process.env, DATABASE_URL: `file:${databasePath}` };

    expect(
      execFileSync(process.execPath, ['scripts/apply-pending-restore.ts', 'prepare'], {
        cwd: process.cwd(),
        env: environment,
      }).toString(),
    ).toBe('prepared');
    expect(() => new Database(databasePath, { fileMustExist: true })).toThrow();
    createDatabase(databasePath, 'fresh');
    const migrated = new Database(databasePath);
    migrated.exec("ALTER TABLE User ADD COLUMN futureValue TEXT NOT NULL DEFAULT 'defaulted'");
    migrated.close();
    await importBackupFile(`${databasePath}.restore-upload`, databasePath);
    const restored = new Database(databasePath, { readonly: true });
    expect(restored.prepare('SELECT value FROM User').pluck().get()).toBe('replacement');
    expect(restored.prepare('SELECT futureValue FROM User').pluck().get()).toBe('defaulted');
    restored.close();
    expect(
      execFileSync(process.execPath, ['scripts/apply-pending-restore.ts', 'prepare'], {
        cwd: process.cwd(),
        env: environment,
      }).toString(),
    ).toBe('prepared');

    createDatabase(databasePath, 'fresh-again');
    await importBackupFile(`${databasePath}.restore-upload`, databasePath);

    execFileSync(process.execPath, ['scripts/apply-pending-restore.ts', 'rollback'], {
      cwd: process.cwd(),
      env: environment,
    });
    const rolledBack = new Database(databasePath, { readonly: true });
    expect(rolledBack.prepare('SELECT value FROM User').pluck().get()).toBe('current');
    rolledBack.close();
    expect(JSON.parse(readFileSync(`${databasePath}.restore-status-${id}.json`, 'utf8'))).toEqual({
      status: 'rolled_back',
    });
  });

  it('uses a stable UTC download filename', () => {
    expect(backupDownloadName(new Date('2026-09-12T02:05:00.123Z'))).toBe(
      'ezprint-backup-20260912T020500Z.ezprint-backup',
    );
  });
});
