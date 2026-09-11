import { bambuStatus } from '../../services/bambubuddy';
import { requireUser } from '../../utils/auth';
defineRouteMeta({
  openAPI: {
    summary: 'Get BambuBuddy status or logs',
    tags: ['Integrations'],
    security: [{ cookieAuth: [] }],
  },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  setHeader(event, 'cache-control', 'no-store');
  return bambuStatus(getQuery(event));
});
