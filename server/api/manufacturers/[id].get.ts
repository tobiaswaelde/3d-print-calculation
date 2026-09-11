import { getResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get a manufacturer', tags: ['Manufacturers'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getResource('manufacturers', getRouterParam(event, 'id')!);
});
