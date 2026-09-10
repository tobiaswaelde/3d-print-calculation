import { destroySession } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await destroySession(event);
  return { success: true };
});
