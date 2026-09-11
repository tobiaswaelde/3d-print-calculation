import { readSettings } from '../services/master-data';
import { requireUser } from '../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get application settings', tags: ['Settings'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return readSettings();
});
