import { archiveSpool } from '../../../services/spools';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { requireFeature } from '../../../utils/features';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  return archiveSpool(getRouterParam(event, 'id')!, await readBody(event));
});
