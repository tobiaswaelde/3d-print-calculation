import { createResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Create a component',
    tags: ['Components'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ComponentInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return createResource('components', await readBody(event));
});
