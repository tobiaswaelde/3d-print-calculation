import { listSpools } from '../../services/spools';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { requireFeature } from '../../utils/features';

defineRouteMeta({ openAPI: { summary: 'List spools', tags: ['Spools'], security: [{ cookieAuth: [] }] } });

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  return listSpools(getQuery(event));
});
