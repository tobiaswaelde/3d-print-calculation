import { archiveSpool } from '../../../services/spools';
import { requireSpoolManagement } from '../../../utils/spool-management';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireSpoolManagement();
  return archiveSpool(getRouterParam(event, 'id')!, await readBody(event));
});
