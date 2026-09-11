import { readIntegrationSettings } from '../../services/integration-settings';
import { requireUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUser(event);
  setHeader(event, 'cache-control', 'no-store');
  return readIntegrationSettings();
});
