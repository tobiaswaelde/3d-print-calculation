import { stockThresholdSchema } from '#shared/schemas/spools';
import { db } from '../../../utils/db';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';
import { parseBody } from '../../../utils/validation';
import { requireSpoolManagement } from '../../../utils/spool-management';
export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireSpoolManagement();
  const data = parseBody(stockThresholdSchema, await readBody(event));
  await db.filament.update({ where: { id: getRouterParam(event, 'id')! }, data });
  return data;
});
