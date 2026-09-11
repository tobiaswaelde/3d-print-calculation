import { getResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get a customer', tags: ['Customers'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getResource('customers', getRouterParam(event, 'id')!);
});
