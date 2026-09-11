import { recordPrintOutcome } from '../../../services/prints';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Record a print outcome',
    tags: ['Prints'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/PrintOutcomeInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return recordPrintOutcome(getRouterParam(event, 'id')!, await readBody(event));
});
