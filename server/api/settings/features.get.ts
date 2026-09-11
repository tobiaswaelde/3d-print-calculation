import { readFeatureSettings } from '../../services/feature-settings';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get feature settings', tags: ['Settings'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  setHeader(event, 'cache-control', 'no-store');
  return readFeatureSettings();
});
