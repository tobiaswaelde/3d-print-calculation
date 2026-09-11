import { archiveSeries } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return archiveSeries(getRouterParam(event, 'id')!, await readBody(event));
});
