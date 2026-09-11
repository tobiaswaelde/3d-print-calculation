import { filamentStock } from '../../../services/spools';
import { db } from '../../../utils/db';
import { requireUser } from '../../../utils/auth';
import { requireFeature } from '../../../utils/features';
export default defineEventHandler(async (event) => {
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  return db.$transaction((transaction) => filamentStock(transaction, getRouterParam(event, 'id')!));
});
