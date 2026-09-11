import { updateIntegrationSettings } from '../../services/integration-settings';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return updateIntegrationSettings(await readBody(event));
});
