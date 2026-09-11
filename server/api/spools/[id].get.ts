import { getSpool } from '../../services/spools';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { requireFeature } from '../../utils/features';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  return getSpool(getRouterParam(event, 'id')!, getQuery(event));
});
