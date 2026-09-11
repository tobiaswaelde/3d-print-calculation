import { correctPrintOutcome } from '../../../../services/prints';
import { requireUser } from '../../../../utils/auth';
import { requireSameOrigin } from '../../../../utils/http';
defineRouteMeta({
  openAPI: {
    summary: 'Correct a print outcome',
    tags: ['Prints'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/PrintOutcomeCorrectionInput' } },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return correctPrintOutcome(getRouterParam(event, 'id')!, await readBody(event));
});
