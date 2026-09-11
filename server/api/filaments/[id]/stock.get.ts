import { filamentStock } from '../../../services/spools';
import { db } from '../../../utils/db';
import { requireUser } from '../../../utils/auth';
import { requireFeature } from '../../../utils/features';
defineRouteMeta({
  openAPI: { summary: 'Get filament stock', tags: ['Filaments'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  return db.$transaction((transaction) => filamentStock(transaction, getRouterParam(event, 'id')!));
});
