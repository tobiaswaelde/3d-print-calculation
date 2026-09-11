import { updateFeatureSettings } from '../../services/feature-settings';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return updateFeatureSettings(await readBody(event));
});
