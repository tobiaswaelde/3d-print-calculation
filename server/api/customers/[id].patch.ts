import { archiveResource, updateResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  const body = await readBody(event);
  return 'archived' in body
    ? archiveResource('customers', getRouterParam(event, 'id')!, body)
    : updateResource('customers', getRouterParam(event, 'id')!, body);
});
