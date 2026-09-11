import { bambuStatus } from '../../services/bambubuddy';
import { requireUser } from '../../utils/auth';
export default defineEventHandler(async (event) => {
  await requireUser(event);
  setHeader(event, 'cache-control', 'no-store');
  return bambuStatus(getQuery(event));
});
