import { printHistory } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { requireFeature } from '../../../utils/features';
defineRouteMeta({
  openAPI: { summary: 'Get print series history', tags: ['Series'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('printSeriesEnabled');
  return printHistory({ seriesId: getRouterParam(event, 'id')! }, getQuery(event));
});
