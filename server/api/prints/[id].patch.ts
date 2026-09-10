import { archivePrint, updatePrint } from '../../services/prints';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  const body = await readBody(event);
  if (body && typeof body === 'object' && 'archived' in body)
    return archivePrint(getRouterParam(event, 'id')!, body.archived === true);
  return updatePrint(getRouterParam(event, 'id')!, body);
});
