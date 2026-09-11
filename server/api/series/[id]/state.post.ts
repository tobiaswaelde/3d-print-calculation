import { setSeriesState } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { requireFeature } from '../../../utils/features';
export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('printSeriesEnabled');
  return setSeriesState(getRouterParam(event, 'id')!, await readBody(event));
});
