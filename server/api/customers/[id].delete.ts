import { deleteResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: { summary: 'Delete a customer', tags: ['Customers'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return deleteResource('customers', getRouterParam(event, 'id')!);
});
