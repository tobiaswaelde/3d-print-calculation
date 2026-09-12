import { rmSync } from 'node:fs';
import { createDownloadBackup } from '../../services/backups';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: {
    summary: 'Download a database backup',
    description: 'Creates a consistent, versioned logical ezPrint archive containing all restorable data.',
    tags: ['Backups'],
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        description: 'Versioned ezPrint backup.',
        content: { 'application/vnd.ezprint.backup': { schema: { type: 'string', format: 'binary' } } },
      },
      401: { description: 'Authentication required.' },
    },
  },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const backup = await createDownloadBackup();
  setHeaders(event, {
    'content-type': 'application/vnd.ezprint.backup',
    'content-length': backup.size,
    'content-disposition': `attachment; filename="${backup.name}"`,
    'cache-control': 'no-store',
  });
  event.node.res.once('close', () => rmSync(backup.path, { force: true }));
  return sendStream(event, backup.stream);
});
