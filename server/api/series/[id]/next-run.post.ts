import { nextSeriesRun } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { requireFeature } from '../../../utils/features';
defineRouteMeta({
  openAPI: {
    summary: 'Create the next series run',
    tags: ['Series'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['sourcePrintId'],
            properties: { sourcePrintId: { type: 'string' } },
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('printSeriesEnabled');
  return nextSeriesRun(getRouterParam(event, 'id')!, await readBody(event));
});
