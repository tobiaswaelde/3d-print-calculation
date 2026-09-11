import { createSession } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { setupApplication } from '../../services/auth';

defineRouteMeta({
  openAPI: {
    summary: 'Set up the application',
    tags: ['Authentication'],
    security: [],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/SetupInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  const user = await setupApplication(await readBody(event));
  await createSession(event, user.id);
  return { user: { id: user.id, email: user.email, displayName: user.displayName, locale: user.locale } };
});
