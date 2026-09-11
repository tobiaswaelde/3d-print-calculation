import { getSpool } from '../../services/spools';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { requireFeature } from '../../utils/features';

defineRouteMeta({ openAPI: { summary: 'Get a spool', tags: ['Spools'], security: [{ cookieAuth: [] }] } });

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  return getSpool(getRouterParam(event, 'id')!, getQuery(event));
});
