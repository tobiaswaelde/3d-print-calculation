import { destroySession } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: { summary: 'Sign out', tags: ['Authentication'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await destroySession(event);
  return { success: true };
});
