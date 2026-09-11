import { updateSettings } from '../services/master-data';
import { requireUser } from '../utils/auth';
import { requireSameOrigin } from '../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Update application settings',
    tags: ['Settings'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/SettingsInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return updateSettings(await readBody(event));
});
