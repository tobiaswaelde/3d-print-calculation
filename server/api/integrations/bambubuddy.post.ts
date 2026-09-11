import { bambuAction } from '../../services/bambubuddy';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
defineRouteMeta({
  openAPI: {
    summary: 'Run a BambuBuddy action',
    tags: ['Integrations'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/BambuBuddyActionInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return bambuAction(await readBody(event));
});
