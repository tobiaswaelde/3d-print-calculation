import { updateIntegrationSettings } from '../../services/integration-settings';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Update integration settings',
    tags: ['Settings'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/IntegrationSettingsInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return updateIntegrationSettings(await readBody(event));
});
