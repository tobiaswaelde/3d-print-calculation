import { searchApplication } from '../services/search';
import { requireUser } from '../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Search the application', tags: ['Search'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return searchApplication(getQuery(event));
});
