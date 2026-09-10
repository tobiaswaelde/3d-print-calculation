import { archiveResource, updateResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  const body = await readBody(event);
  return body && typeof body === 'object' && 'archived' in body
    ? archiveResource('printers', getRouterParam(event, 'id')!, body)
    : updateResource('printers', getRouterParam(event, 'id')!, body);
});
