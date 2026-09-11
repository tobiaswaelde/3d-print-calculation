import { bambuAction } from '../../services/bambubuddy';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return bambuAction(await readBody(event));
});
