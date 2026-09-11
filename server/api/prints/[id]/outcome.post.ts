import { recordPrintOutcome } from '../../../services/prints';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return recordPrintOutcome(getRouterParam(event, 'id')!, await readBody(event));
});
