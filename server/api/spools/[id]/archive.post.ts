import { archiveSpool } from '../../../services/spools';
import { requireSpoolManagement } from '../../../utils/spool-management';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Archive or restore a spool',
    tags: ['Spools'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ArchiveInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireSpoolManagement();
  return archiveSpool(getRouterParam(event, 'id')!, await readBody(event));
});
