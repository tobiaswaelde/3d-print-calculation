import { readIntegrationSettings } from '../../services/integration-settings';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get integration settings', tags: ['Settings'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  setHeader(event, 'cache-control', 'no-store');
  return readIntegrationSettings();
});
