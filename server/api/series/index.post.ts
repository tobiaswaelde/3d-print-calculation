import { createSeries } from '../../services/series';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return createSeries(await readBody(event));
});
