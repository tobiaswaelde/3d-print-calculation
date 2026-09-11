import { setSeriesState } from '../../../services/series';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { requireFeature } from '../../../utils/features';
defineRouteMeta({
  openAPI: {
    summary: 'Update print series state',
    tags: ['Series'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string', enum: ['OPEN', 'COMPLETED'] } },
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
  return setSeriesState(getRouterParam(event, 'id')!, await readBody(event));
});
