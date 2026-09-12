import { closeSync, existsSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  acquireRestoreStaging,
  readRestoreStatusFile,
  releaseRestoreStaging,
  RESTORE_STATUS_TTL_MS,
  restorePaths,
} from '../scripts/restore-state';

const roots: string[] = [];

function testPaths() {
  const root = join(tmpdir(), `ezprint-restore-state-${crypto.randomUUID()}`);
  mkdirSync(root);
  roots.push(root);
  return restorePaths(join(root, 'app.db'));
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('restore filesystem state', () => {
  it('grants staging ownership to only one caller', () => {
    const paths = testPaths();
    const descriptor = acquireRestoreStaging(paths.staging);

    expect(descriptor).not.toBeNull();
    expect(acquireRestoreStaging(paths.staging)).toBeNull();

    releaseRestoreStaging(paths.staging, descriptor!);
    const reacquired = acquireRestoreStaging(paths.staging);
    expect(reacquired).not.toBeNull();
    closeSync(reacquired!);
  });

  it('releases staging ownership after a failed operation', () => {
    const paths = testPaths();
    const descriptor = acquireRestoreStaging(paths.staging)!;

    releaseRestoreStaging(paths.staging, descriptor);

    expect(existsSync(paths.staging)).toBe(false);
    const reacquired = acquireRestoreStaging(paths.staging);
    expect(reacquired).not.toBeNull();
    closeSync(reacquired!);
  });

  it('reads status metadata from a single opened file', () => {
    const paths = testPaths();
    const path = paths.status(crypto.randomUUID());
    writeFileSync(path, JSON.stringify({ status: 'succeeded' }), { mode: 0o600 });

    expect(readRestoreStatusFile(path)).toEqual({ status: 'succeeded' });
  });

  it('removes and rejects expired status metadata', () => {
    const paths = testPaths();
    const path = paths.status(crypto.randomUUID());
    writeFileSync(path, JSON.stringify({ status: 'pending' }), { mode: 0o600 });
    const expiredAt = new Date(Date.now() - RESTORE_STATUS_TTL_MS - 1_000);
    utimesSync(path, expiredAt, expiredAt);

    expect(readRestoreStatusFile(path)).toBeNull();
    expect(existsSync(path)).toBe(false);
  });
});
