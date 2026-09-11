import { updateSpool } from '../../services/spools';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return updateSpool(getRouterParam(event, 'id')!, await readBody(event));
});
