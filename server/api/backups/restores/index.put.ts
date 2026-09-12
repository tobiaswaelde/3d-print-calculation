import { stageRestore } from '../../../services/backups';
import { requireUser } from '../../../utils/auth';
import { apiError, requireSameOrigin } from '../../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Stage a database restore',
    description: 'Validates and stages a versioned ezPrint backup, then restarts the application.',
    tags: ['Backups'],
    security: [{ cookieAuth: [] }],
    parameters: [
      {
        name: 'X-Ezprint-Restore-Token',
        in: 'header',
        required: true,
        schema: { type: 'string' },
        description: 'Single-use token from the restore authorization endpoint.',
      },
    ],
    requestBody: {
      required: true,
      content: { 'application/vnd.ezprint.backup': { schema: { type: 'string', format: 'binary' } } },
    },
    responses: {
      202: { description: 'Restore staged; the application is restarting.' },
      401: { description: 'Authentication or restore authorization failed.' },
      409: { description: 'Another restore is already pending.' },
      413: { description: 'The backup exceeds the configured size limit.' },
      422: { description: 'The backup is invalid or incompatible.' },
      507: { description: 'There is not enough free storage to stage the restore safely.' },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  const user = await requireUser(event);
  if (getHeader(event, 'content-type')?.split(';')[0] !== 'application/vnd.ezprint.backup') {
    apiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'errors.unsupportedMediaType');
  }
  const contentLength = Number(getHeader(event, 'content-length'));
  const maxBytes = Number(useRuntimeConfig(event).backupMaxBytes);
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    apiError(500, 'BACKUP_CONFIG_INVALID', 'errors.backupConfigInvalid');
  }
  const result = await stageRestore(
    event.node.req,
    contentLength,
    maxBytes,
    getHeader(event, 'x-ezprint-restore-token'),
    user.id,
  );
  setResponseStatus(event, 202);
  event.node.res.once('finish', () => {
    setTimeout(() => process.kill(process.pid, 'SIGTERM'), 250).unref();
  });
  return result;
});
