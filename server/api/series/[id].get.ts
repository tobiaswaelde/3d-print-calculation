import { getSeries } from '../../services/series';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { requireFeature } from '../../utils/features';
defineRouteMeta({
  openAPI: { summary: 'Get a print series', tags: ['Series'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('printSeriesEnabled');
  return getSeries(getRouterParam(event, 'id')!);
});
