import { archiveSchema } from '#shared/schemas/master-data';
import { parseBody } from '../../utils/validation';
import { archivePrint, updatePrint, updatePrintWorkflow } from '../../services/prints';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  const body = await readBody(event);
  if (body && typeof body === 'object' && 'archived' in body)
    return archivePrint(getRouterParam(event, 'id')!, parseBody(archiveSchema, body).archived);
  if (body && typeof body === 'object' && ('status' in body || 'paid' in body))
    return updatePrintWorkflow(getRouterParam(event, 'id')!, body);
  return updatePrint(getRouterParam(event, 'id')!, body);
});
