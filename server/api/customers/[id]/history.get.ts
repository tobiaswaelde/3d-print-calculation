import { printHistory } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
defineRouteMeta({
  openAPI: { summary: 'Get customer print history', tags: ['Customers'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return printHistory({ customerId: getRouterParam(event, 'id')! }, getQuery(event));
});
