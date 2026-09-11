import { updateSpool } from '../../services/spools';
import { requireSpoolManagement } from '../../utils/spool-management';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Update a spool',
    tags: ['Spools'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/SpoolInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireSpoolManagement();
  return updateSpool(getRouterParam(event, 'id')!, await readBody(event));
});
