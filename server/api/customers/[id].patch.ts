import { archiveResource, updateResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Update or archive a customer',
    tags: ['Customers'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  const body = await readBody(event);
  return body && typeof body === 'object' && 'archived' in body
    ? archiveResource('customers', getRouterParam(event, 'id')!, body)
    : updateResource('customers', getRouterParam(event, 'id')!, body);
});
