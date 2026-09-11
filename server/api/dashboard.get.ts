import { dashboardData } from '../services/dashboard';
import { requireUser } from '../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get dashboard metrics', tags: ['Dashboard'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return dashboardData(getQuery(event).period);
});
