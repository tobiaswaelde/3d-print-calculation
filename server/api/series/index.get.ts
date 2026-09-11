import { listSeries } from '../../services/series';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { requireFeature } from '../../utils/features';
defineRouteMeta({
  openAPI: { summary: 'List print series', tags: ['Series'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('printSeriesEnabled');
  return listSeries(getQuery(event));
});
