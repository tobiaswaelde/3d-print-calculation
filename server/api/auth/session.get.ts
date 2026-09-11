import { getSessionUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get current session', tags: ['Authentication'], security: [{}, { cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => ({ user: await getSessionUser(event) }));
