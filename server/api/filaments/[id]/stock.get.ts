import { filamentStock } from '../../../services/spools';
import { db } from '../../../utils/db';
import { requireUser } from '../../../utils/auth';
export default defineEventHandler(async (event) => {
  await requireUser(event);
  return db.$transaction((transaction) => filamentStock(transaction, getRouterParam(event, 'id')!));
});
