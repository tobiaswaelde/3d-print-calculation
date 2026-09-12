import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  closeSync,
  createWriteStream,
  existsSync,
  openSync,
  rmSync,
  fsyncSync,
  statfsSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { once } from 'node:events';
import { finished } from 'node:stream/promises';
import { verify } from '@node-rs/argon2';
import packageJson from '../../package.json' with { type: 'json' };
import {
  BACKUP_FORMAT_VERSION,
  backupDownloadName,
  backupReadStream,
  createBackupFile,
  databasePathFromUrl,
  inspectBackupFile,
} from '../../scripts/database-backup';
import {
  acquireRestoreStaging,
  readRestoreStatusFile,
  releaseRestoreStaging,
  restorePaths,
} from '../../scripts/restore-state';
import type { RestoreStatus } from '#shared/schemas/backups';
import { db } from '../utils/db';
import { apiError } from '../utils/http';

const authorizations = new Map<string, { userId: string; expiresAt: number }>();
const AUTHORIZATION_TTL_MS = 5 * 60 * 1000;
const DISK_RESERVE_BYTES = 64 * 1024 * 1024;

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function compareVersions(left: string, right: string) {
  const parse = (value: string) => value.split('.').map((part) => Number.parseInt(part, 10));
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

function cleanExpiredAuthorizations() {
  const now = Date.now();
  for (const [key, value] of authorizations) if (value.expiresAt <= now) authorizations.delete(key);
}

export async function authorizeRestore(userId: string, password: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verify(user.passwordHash, password))) {
    apiError(401, 'INVALID_CREDENTIALS', 'errors.invalidCredentials');
  }
  cleanExpiredAuthorizations();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + AUTHORIZATION_TTL_MS;
  authorizations.set(tokenHash(token), { userId, expiresAt });
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

function consumeAuthorization(token: string | undefined, userId: string) {
  cleanExpiredAuthorizations();
  if (!token) apiError(401, 'RESTORE_AUTHORIZATION_REQUIRED', 'errors.restoreAuthorizationRequired');
  const key = tokenHash(token);
  const authorization = authorizations.get(key);
  authorizations.delete(key);
  if (!authorization || authorization.userId !== userId || authorization.expiresAt <= Date.now()) {
    apiError(401, 'RESTORE_AUTHORIZATION_INVALID', 'errors.restoreAuthorizationInvalid');
  }
}

export async function createDownloadBackup() {
  const databasePath = databasePathFromUrl();
  const target = `${databasePath}.backup-download-${randomUUID()}`;
  await createBackupFile(databasePath, target, packageJson.version);
  return { path: target, name: backupDownloadName(), ...backupReadStream(target) };
}

function validateUploadCapacity(databasePath: string, contentLength: number, maxBytes: number) {
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    apiError(411, 'CONTENT_LENGTH_REQUIRED', 'errors.contentLengthRequired');
  }
  if (contentLength > maxBytes) apiError(413, 'BACKUP_TOO_LARGE', 'errors.backupTooLarge');
  const currentSize = existsSync(databasePath) ? statSync(databasePath).size : 0;
  const filesystem = statfsSync(databasePath);
  const available = Number(filesystem.bavail) * Number(filesystem.bsize);
  if (available < contentLength + currentSize + DISK_RESERVE_BYTES) {
    apiError(507, 'INSUFFICIENT_STORAGE', 'errors.insufficientStorage');
  }
}

export async function stageRestore(
  request: NodeJS.ReadableStream,
  contentLength: number,
  maxBytes: number,
  token: string | undefined,
  userId: string,
) {
  consumeAuthorization(token, userId);
  const databasePath = databasePathFromUrl();
  const paths = restorePaths(databasePath);
  const stagingDescriptor = acquireRestoreStaging(paths.staging);
  if (stagingDescriptor === null) {
    apiError(409, 'RESTORE_ALREADY_PENDING', 'errors.restoreAlreadyPending');
  }
  let keepStaging = false;
  try {
    validateUploadCapacity(databasePath, contentLength, maxBytes);
    rmSync(paths.upload, { force: true });
    const uploadDescriptor = openSync(paths.upload, 'wx', 0o600);
    const output = createWriteStream(paths.upload, { fd: uploadDescriptor, autoClose: false });
    let received = 0;
    try {
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        received += buffer.length;
        if (received > maxBytes || received > contentLength) throw new Error('BACKUP_TOO_LARGE');
        if (!output.write(buffer)) await once(output, 'drain');
      }
      output.end();
      await finished(output);
      fsyncSync(uploadDescriptor);
    } catch (error) {
      output.destroy();
      throw error;
    } finally {
      closeSync(uploadDescriptor);
    }
    if (received !== contentLength) throw new Error('BACKUP_LENGTH_MISMATCH');
    const metadata = await inspectBackupFile(paths.upload, maxBytes);
    if (metadata.formatVersion !== BACKUP_FORMAT_VERSION) {
      apiError(422, 'BACKUP_FORMAT_UNSUPPORTED', 'errors.backupFormatUnsupported');
    }
    if (compareVersions(metadata.appVersion, packageJson.version) > 0) {
      apiError(422, 'BACKUP_VERSION_NEWER', 'errors.backupVersionNewer');
    }
    const id = randomUUID();
    const marker = { id, createdAt: new Date().toISOString() };
    writeFileSync(paths.status(id), JSON.stringify({ status: 'pending' }), { flag: 'wx', mode: 0o600 });
    writeFileSync(paths.pending, JSON.stringify(marker), { flag: 'wx', mode: 0o600 });
    closeSync(stagingDescriptor);
    keepStaging = true;
    return { id, status: 'pending' as const };
  } catch (error) {
    rmSync(paths.upload, { force: true });
    if (error instanceof Error && error.message === 'BACKUP_TOO_LARGE') {
      apiError(413, 'BACKUP_TOO_LARGE', 'errors.backupTooLarge');
    }
    if (error instanceof Error && error.message === 'BACKUP_LENGTH_MISMATCH') {
      apiError(400, 'BACKUP_LENGTH_MISMATCH', 'errors.backupLengthMismatch');
    }
    if (error instanceof Error && !('statusCode' in error)) {
      apiError(422, 'BACKUP_INVALID', 'errors.backupInvalid');
    }
    throw error;
  } finally {
    if (!keepStaging) releaseRestoreStaging(paths.staging, stagingDescriptor);
  }
}

export function readRestoreStatus(id: string): { status: RestoreStatus } {
  if (!/^[0-9a-f-]{36}$/i.test(id)) apiError(404, 'RESTORE_NOT_FOUND', 'errors.restoreNotFound');
  const path = restorePaths(databasePathFromUrl()).status(id);
  const status = readRestoreStatusFile(path);
  if (!status) apiError(404, 'RESTORE_NOT_FOUND', 'errors.restoreNotFound');
  return status;
}
