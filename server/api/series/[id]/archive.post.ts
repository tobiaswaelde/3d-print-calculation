import { archiveSeries } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { requireFeature } from '../../../utils/features';
defineRouteMeta({
  openAPI: {
    summary: 'Archive or restore a print series',
    tags: ['Series'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ArchiveInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('printSeriesEnabled');
  return archiveSeries(getRouterParam(event, 'id')!, await readBody(event));
});
